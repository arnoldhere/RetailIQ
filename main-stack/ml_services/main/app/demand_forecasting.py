from __future__ import annotations

import hashlib
import logging
import pickle
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from sklearn.linear_model import LinearRegression

from .config import settings
from .schemas import DemandForecastResponse


logger = logging.getLogger(__name__)


@dataclass
class DemandForecastingPipeline:
    """Pipeline for forecasting product demand using historical order data."""

    algorithm_version: str = "1.1.0"
    model_ready: bool = False
    model_error: str | None = None
    model_dir: Path = field(default_factory=lambda: settings.demand_forecast_model_dir)

    def __post_init__(self):
        """Initialize the forecasting pipeline and ensure model storage exists."""
        try:
            self.model_dir.mkdir(parents=True, exist_ok=True)
            self.model_ready = True
        except Exception as exc:
            self.model_error = str(exc)
            self.model_ready = False
            logger.exception("Failed to initialize demand forecasting pipeline")

    def moving_average_forecast(
        self, data: list[float], periods: int = 7, window_size: int | None = None
    ) -> list[float]:
        """Simple moving average forecasting."""
        if periods <= 0:
            return []

        history = [float(value) for value in data]
        effective_window = window_size or min(len(history), periods) or 1

        if len(history) < effective_window:
            avg = sum(history) / len(history) if history else 0.0
            return [float(avg)] * periods

        forecasts: list[float] = []
        for _ in range(periods):
            window = history[-effective_window:] if len(history) >= effective_window else history
            avg = sum(window) / len(window) if window else 0.0
            forecasts.append(float(max(avg, 0.0)))
            history.append(avg)

        return forecasts

    def linear_regression_forecast(
        self, model: LinearRegression, start_index: int, periods: int = 7
    ) -> list[float]:
        """Forecast future periods using a trained linear regression model."""
        if periods <= 0:
            return []

        future_X = np.array(range(start_index, start_index + periods)).reshape(-1, 1)
        forecasts = model.predict(future_X)
        return np.maximum(forecasts, 0).astype(float).tolist()

    def _model_artifact_path(self, product_id: int) -> Path:
        return self.model_dir / f"demand_forecast_product_{product_id}.pkl"

    def _normalize_history(self, historical_data: list[dict]) -> tuple[list[str], list[float]]:
        daily_demand = defaultdict(float)

        for index, record in enumerate(historical_data):
            try:
                date = record.get("date", record.get("order_date", record.get("timestamp", "")))
                quantity_raw = record.get("quantity", record.get("qty", 0))

                if not date:
                    continue

                date_key = str(date).split("T")[0] if "T" in str(date) else str(date).split(" ")[0]
                quantity = float(quantity_raw)
                if quantity < 0:
                    logger.warning("Ignoring negative quantity for demand forecast at index %s", index)
                    continue

                daily_demand[date_key] += quantity
            except (TypeError, ValueError):
                logger.warning("Skipping malformed historical record for demand forecast: %s", record)

        sorted_dates = sorted(daily_demand.keys())
        daily_quantities = [float(daily_demand[date]) for date in sorted_dates]
        return sorted_dates, daily_quantities

    def _build_training_signature(
        self, product_id: int, sorted_dates: list[str], daily_quantities: list[float], algorithm: str
    ) -> str:
        payload = f"{self.algorithm_version}|{product_id}|{algorithm}|{sorted_dates}|{daily_quantities}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def _load_saved_model(self, product_id: int) -> dict | None:
        artifact_path = self._model_artifact_path(product_id)
        if not artifact_path.exists():
            return None

        try:
            with artifact_path.open("rb") as model_file:
                artifact = pickle.load(model_file)
                if isinstance(artifact, dict):
                    return artifact
        except Exception:
            logger.exception("Failed to load saved demand forecast model for product %s", product_id)

        return None

    def _save_model(self, product_id: int, artifact: dict) -> None:
        artifact_path = self._model_artifact_path(product_id)
        try:
            with artifact_path.open("wb") as model_file:
                pickle.dump(artifact, model_file)
        except Exception:
            logger.exception("Failed to save demand forecast model for product %s", product_id)

    def _train_model(
        self,
        product_id: int,
        sorted_dates: list[str],
        daily_quantities: list[float],
        days_ahead: int,
    ) -> tuple[list[float], str, float, str]:
        periods = min(days_ahead, 7)

        if len(daily_quantities) >= 14:
            X = np.array(range(len(daily_quantities))).reshape(-1, 1)
            y = np.array(daily_quantities, dtype=float)
            model = LinearRegression()
            model.fit(X, y)

            forecasts = self.linear_regression_forecast(model, len(daily_quantities), periods)
            algorithm = "linear_regression"
            confidence = min(0.8, len(daily_quantities) / 100)
            signature = self._build_training_signature(product_id, sorted_dates, daily_quantities, algorithm)

            self._save_model(
                product_id,
                {
                    "algorithm": algorithm,
                    "signature": signature,
                    "trained_points": len(daily_quantities),
                    "sorted_dates": sorted_dates,
                    "daily_quantities": daily_quantities,
                    "model": model,
                },
            )
            return forecasts, algorithm, round(confidence, 2), "trained_and_saved"

        window_size = min(len(daily_quantities), 7) or 1
        forecasts = self.moving_average_forecast(daily_quantities, periods, window_size=window_size)
        algorithm = "moving_average"
        confidence = min(0.6, len(daily_quantities) / 50)
        signature = self._build_training_signature(product_id, sorted_dates, daily_quantities, algorithm)

        self._save_model(
            product_id,
            {
                "algorithm": algorithm,
                "signature": signature,
                "trained_points": len(daily_quantities),
                "sorted_dates": sorted_dates,
                "daily_quantities": daily_quantities,
                "window_size": window_size,
            },
        )
        return forecasts, algorithm, round(confidence, 2), "trained_and_saved"

    def _forecast_with_saved_model(
        self,
        saved_model: dict,
        product_id: int,
        sorted_dates: list[str],
        daily_quantities: list[float],
        days_ahead: int,
    ) -> tuple[list[float], str, float, str] | None:
        algorithm = saved_model.get("algorithm")
        expected_signature = self._build_training_signature(product_id, sorted_dates, daily_quantities, algorithm)
        if saved_model.get("signature") != expected_signature:
            return None

        periods = min(days_ahead, 7)
        if algorithm == "linear_regression":
            model = saved_model.get("model")
            if model is None:
                return None
            forecasts = self.linear_regression_forecast(model, len(daily_quantities), periods)
            confidence = round(min(0.8, len(daily_quantities) / 100), 2)
            return forecasts, algorithm, confidence, "loaded_from_pickle"

        if algorithm == "moving_average":
            window_size = int(saved_model.get("window_size") or min(len(daily_quantities), 7) or 1)
            forecasts = self.moving_average_forecast(daily_quantities, periods, window_size=window_size)
            confidence = round(min(0.6, len(daily_quantities) / 50), 2)
            return forecasts, algorithm, confidence, "loaded_from_pickle"

        return None

    def forecast_product_demand(
        self, product_id: int, historical_data: list[dict], days_ahead: int = 7
    ) -> DemandForecastResponse:
        """
        Forecast demand for a specific product.

        Args:
            product_id: The product ID to forecast
            historical_data: List of historical order data with timestamps and quantities
            days_ahead: Number of days to forecast ahead

        Returns:
            DemandForecastResponse with forecast data
        """
        try:
            if not historical_data:
                return DemandForecastResponse(
                    product_id=product_id,
                    forecast_next_7_days=[0.0] * min(days_ahead, 7),
                    algorithm_used="no_data",
                    confidence_score=0.0,
                    historical_data_points=0,
                    model_source="fallback",
                    error_message="No historical data available for forecasting.",
                )

            sorted_dates, daily_quantities = self._normalize_history(historical_data)
            if not daily_quantities:
                return DemandForecastResponse(
                    product_id=product_id,
                    forecast_next_7_days=[0.0] * min(days_ahead, 7),
                    algorithm_used="no_valid_data",
                    confidence_score=0.0,
                    historical_data_points=0,
                    model_source="fallback",
                    error_message="Historical records did not contain usable demand values.",
                )

            saved_model = self._load_saved_model(product_id)
            if saved_model:
                saved_forecast = self._forecast_with_saved_model(
                    saved_model=saved_model,
                    product_id=product_id,
                    sorted_dates=sorted_dates,
                    daily_quantities=daily_quantities,
                    days_ahead=days_ahead,
                )
                if saved_forecast:
                    forecasts, algorithm, confidence, model_source = saved_forecast
                    return DemandForecastResponse(
                        product_id=product_id,
                        forecast_next_7_days=forecasts,
                        algorithm_used=algorithm,
                        confidence_score=confidence,
                        historical_data_points=len(daily_quantities),
                        model_source=model_source,
                    )

            forecasts, algorithm, confidence, model_source = self._train_model(
                product_id=product_id,
                sorted_dates=sorted_dates,
                daily_quantities=daily_quantities,
                days_ahead=days_ahead,
            )

            return DemandForecastResponse(
                product_id=product_id,
                forecast_next_7_days=forecasts,
                algorithm_used=algorithm,
                confidence_score=confidence,
                historical_data_points=len(daily_quantities),
                model_source=model_source,
            )

        except Exception as exc:
            logger.exception("Demand forecasting failed for product %s", product_id)
            return DemandForecastResponse(
                product_id=product_id,
                forecast_next_7_days=[0.0] * min(days_ahead, 7),
                algorithm_used="error_fallback",
                confidence_score=0.0,
                historical_data_points=len(historical_data) if historical_data else 0,
                model_source="fallback",
                error_message=str(exc),
            )


demand_forecasting_pipeline = DemandForecastingPipeline()

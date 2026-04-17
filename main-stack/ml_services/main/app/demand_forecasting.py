from __future__ import annotations
from pathlib import Path
import json
import math
from collections import defaultdict
from dataclasses import dataclass
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

from .config import settings
from .schemas import DemandForecastRequest, DemandForecastResponse


@dataclass
class DemandForecastingPipeline:
    """Pipeline for forecasting product demand using historical order data."""

    algorithm_version: str = "1.0.0"
    model_ready: bool = False
    model_error: str | None = None

    def __post_init__(self):
        """Initialize the forecasting pipeline."""
        try:
            # For now, we'll use in-memory data processing
            # In production, this could load pre-trained models
            self.model_ready = True
        except Exception as e:
            self.model_error = str(e)
            self.model_ready = False

    def moving_average_forecast(
        self, data: list[float], periods: int = 7
    ) -> list[float]:
        """Simple moving average forecasting."""
        if len(data) < periods:
            # If insufficient data, return average of available data
            avg = sum(data) / len(data) if data else 0
            return [avg] * periods

        forecasts = []
        for i in range(periods):
            # Use last 'periods' data points for moving average
            window = data[-(periods):] if len(data) >= periods else data
            avg = sum(window) / len(window)
            forecasts.append(avg)
            # Add the forecast to data for next iteration (for multi-step forecasting)
            data = data + [avg]

        return forecasts

    def linear_regression_forecast(
        self, data: list[float], periods: int = 7
    ) -> list[float]:
        """Linear regression forecasting on time series data."""
        if len(data) < 3:
            # Fall back to moving average if insufficient data
            return self.moving_average_forecast(data, periods)

        try:
            # Create time indices
            X = np.array(range(len(data))).reshape(-1, 1)
            y = np.array(data)

            # Fit linear regression
            model = LinearRegression()
            model.fit(X, y)

            # Forecast future periods
            future_X = np.array(range(len(data), len(data) + periods)).reshape(-1, 1)
            forecasts = model.predict(future_X)

            # Ensure non-negative forecasts
            forecasts = np.maximum(forecasts, 0)

            return forecasts.tolist()

        except Exception:
            # Fall back to moving average on any error
            return self.moving_average_forecast(data, periods)

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
                # No historical data available
                return DemandForecastResponse(
                    product_id=product_id,
                    forecast_next_7_days=[0.0] * min(days_ahead, 7),
                    algorithm_used="no_data",
                    confidence_score=0.0,
                    historical_data_points=0,
                )

            # Process historical data - group by date and sum quantities
            daily_demand = defaultdict(float)
            for record in historical_data:
                date = record.get(
                    "date", record.get("order_date", record.get("timestamp", ""))
                )
                quantity = float(record.get("quantity", record.get("qty", 0)))

                if date:
                    # Normalize date format (assuming YYYY-MM-DD)
                    date_key = (
                        str(date).split("T")[0]
                        if "T" in str(date)
                        else str(date).split(" ")[0]
                    )
                    daily_demand[date_key] += quantity

            # Sort by date and get daily quantities
            sorted_dates = sorted(daily_demand.keys())
            daily_quantities = [daily_demand[date] for date in sorted_dates]

            if not daily_quantities:
                return DemandForecastResponse(
                    product_id=product_id,
                    forecast_next_7_days=[0.0] * min(days_ahead, 7),
                    algorithm_used="no_valid_data",
                    confidence_score=0.0,
                    historical_data_points=0,
                )

            # Choose algorithm based on data availability
            if len(daily_quantities) >= 14:
                # Use linear regression for sufficient data
                forecasts = self.linear_regression_forecast(
                    daily_quantities, min(days_ahead, 7)
                )
                algorithm = "linear_regression"
                confidence = min(
                    0.8, len(daily_quantities) / 100
                )  # Higher confidence with more data
            else:
                # Use moving average for limited data
                forecasts = self.moving_average_forecast(
                    daily_quantities, min(days_ahead, 7)
                )
                algorithm = "moving_average"
                confidence = min(0.6, len(daily_quantities) / 50)

            return DemandForecastResponse(
                product_id=product_id,
                forecast_next_7_days=forecasts,
                algorithm_used=algorithm,
                confidence_score=round(confidence, 2),
                historical_data_points=len(daily_quantities),
            )

        except Exception as e:
            # Return safe fallback on any error
            return DemandForecastResponse(
                product_id=product_id,
                forecast_next_7_days=[0.0] * min(days_ahead, 7),
                algorithm_used="error_fallback",
                confidence_score=0.0,
                historical_data_points=len(historical_data) if historical_data else 0,
            )


# Global instance
demand_forecasting_pipeline = DemandForecastingPipeline()

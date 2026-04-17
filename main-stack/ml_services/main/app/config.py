from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]


def _split_csv_env(name: str, default: str) -> list[str]:
    raw_value = os.getenv(name, default)
    return [part.strip() for part in raw_value.split(",") if part.strip()]


@dataclass(frozen=True)
class Settings:
    """Centralized runtime settings for the FastAPI service."""

    model_path: Path = BASE_DIR / "models" / "saved" / "v1_retailiq_lightfm.pkl"
    demand_forecast_model_dir: Path = BASE_DIR / "models" / "saved" / "demand_forecasting"
    user_map_path: Path = BASE_DIR / "notebooks" / "user_map.json"
    item_map_path: Path = BASE_DIR / "notebooks" / "item_map.json"
    raw_data_dir: Path = BASE_DIR / "data" / "raw_kaggle"
    algorithm_version: str = os.getenv("ML_ALGORITHM_VERSION", "lightfm_v1_blended")
    service_name: str = os.getenv("ML_SERVICE_NAME", "RetailIQ Recommendation Service")
    allowed_origins: list[str] = field(
        default_factory=lambda: _split_csv_env(
            "ML_ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8888,http://127.0.0.1:8888",
        )
    )


settings = Settings()

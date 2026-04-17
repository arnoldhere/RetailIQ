from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.recommender_pipeline import recommendation_pipeline
from app.demand_forecasting import demand_forecasting_pipeline
from app.schemas import (
    RecommendationRequest,
    RecommendationResponse,
    DemandForecastRequest,
    DemandForecastResponse,
)


app = FastAPI(
    title=settings.service_name,
    version=settings.algorithm_version,
    description="FastAPI service that ranks RetailIQ products and customization services/preferences",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    """Basic health endpoint used by the Node backend and local development."""
    return {
        "message": "FastAPI started...",
        "model_ready": recommendation_pipeline.model_ready,
        "demand_forecasting_ready": demand_forecasting_pipeline.model_ready,
        "algorithm_version": recommendation_pipeline.algorithm_version,
    }


@app.get("/health")
def detailed_health_check():
    """Verbose health check that surfaces model readiness for observability."""
    return {
        "status": "ok",
        "service": settings.service_name,
        "algorithm_version": recommendation_pipeline.algorithm_version,
        "model_ready": recommendation_pipeline.model_ready,
        "model_error": recommendation_pipeline.model_error,
        "demand_forecasting_ready": demand_forecasting_pipeline.model_ready,
        "demand_forecasting_error": demand_forecasting_pipeline.model_error,
    }


@app.post("/recommendations/products", response_model=RecommendationResponse)
def recommend_products(payload: RecommendationRequest):
    """
    Rank live product candidates for a validated RetailIQ customer.

    The Node backend prepares the customer context and product catalog snapshot, then
    this endpoint converts LightFM category preferences into product recommendations.
    """

    try:
        return recommendation_pipeline.recommend(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - protects the API boundary
        raise HTTPException(
            status_code=500, detail="Failed to generate recommendations"
        ) from exc


@app.post("/demand-forecasting", response_model=DemandForecastResponse)
def forecast_demand(payload: DemandForecastRequest):
    """
    Forecast product demand for the next N days using historical order data.

    This endpoint analyzes historical customer order patterns to predict future demand
    for specific products using moving average or linear regression algorithms.
    """

    try:
        historical_data = payload.historical_data or []

        return demand_forecasting_pipeline.forecast_product_demand(
            product_id=payload.product_id,
            historical_data=historical_data,
            days_ahead=payload.days_ahead,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - protects the API boundary
        raise HTTPException(
            status_code=500, detail="Failed to generate demand forecast"
        ) from exc

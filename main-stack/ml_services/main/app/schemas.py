from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    """Validated user context received from the Node backend."""

    id: int = Field(..., gt=0)
    gender: str | None = None
    age: int | None = Field(default=None, ge=0, le=120)
    order_count: int = Field(default=0, ge=0)
    wishlist_count: int = Field(default=0, ge=0)
    cart_count: int = Field(default=0, ge=0)
    seen_product_ids: list[int] = Field(default_factory=list)
    category_weights: dict[str, float] = Field(default_factory=dict)


class CandidateProduct(BaseModel):
    """Product candidates that the recommendation pipeline is allowed to rank."""

    id: int = Field(..., gt=0)
    name: str
    description: str | None = None
    category_id: int | None = None
    category_name: str | None = None
    supplier_id: int | None = None
    sell_price: float = Field(default=0.0, ge=0.0)
    stock_available: int = Field(default=0, ge=0)
    images: list[Any] = Field(default_factory=list)
    purchase_count: int = Field(default=0, ge=0)


class RecommendationRequest(BaseModel):
    """Request payload consumed by the FastAPI recommendation endpoint."""

    user: UserProfile
    products: list[CandidateProduct] = Field(default_factory=list)
    limit: int = Field(default=8, ge=1, le=20)


class RankedProduct(BaseModel):
    """A ranked recommendation returned to the Node backend."""

    product_id: int
    score: float
    reason_code: str
    reason: str
    product: CandidateProduct


class RecommendationMetadata(BaseModel):
    """Small metadata payload for observability/debugging."""

    algorithm_version: str
    strategy: str
    model_ready: bool
    matched_training_users: int = 0


class RecommendationResponse(BaseModel):
    """Top-level API response returned by the recommendation service."""

    recommendations: list[RankedProduct]
    metadata: RecommendationMetadata

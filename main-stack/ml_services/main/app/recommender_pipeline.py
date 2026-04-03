from __future__ import annotations
from pathlib import Path
import json
import math
import pickle
from collections import Counter, defaultdict
from dataclasses import dataclass
import numpy as np
import pandas as pd

from .config import settings
from .schemas import (
    CandidateProduct,
    RecommendationMetadata,
    RecommendationRequest,
    RecommendationResponse,
    RankedProduct,
)


CATEGORY_ALIASES = {
    "food and beverage": "food & beverage",
    "food beverage": "food & beverage",
    "food": "food & beverage",
    "beverages": "food & beverage",
    "electronic": "electronics",
    "tech": "technology",
}


def normalize_category_name(value: str | None) -> str:
    """Normalize raw category labels from datasets and the application database."""

    if not value:
        return ""

    normalized = " ".join(
        str(value).strip().lower().replace("/", " ").replace("-", " ").split()
    )
    return CATEGORY_ALIASES.get(normalized, normalized)


def safe_float(value: float | int | None, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def normalize_score_map(score_map: dict[str, float]) -> dict[str, float]:
    if not score_map:
        return {}

    values = list(score_map.values())
    min_value = min(values)
    max_value = max(values)
    if math.isclose(min_value, max_value):
        return {key: 1.0 for key in score_map}

    return {
        key: (value - min_value) / (max_value - min_value)
        for key, value in score_map.items()
    }


@dataclass
class HistoricalUserProfile:
    raw_user_id: str
    user_index: int
    gender: str | None
    age: int | None
    category_weights: dict[str, float]


class RetailIQRecommendationPipeline:
    """
    Blended recommendation pipeline.

    The LightFM model was trained on category interactions in the notebook, so this
    production wrapper first predicts promising categories and then maps them back
    to real products from the application database.
    """

    def __init__(self) -> None:
        self.model = None
        self.model_ready = False
        self.model_error = ""
        self.algorithm_version = settings.algorithm_version
        self.item_categories: dict[int, str] = {}
        self.historical_profiles: list[HistoricalUserProfile] = []
        self.global_category_weights: dict[str, float] = {}
        self._load_artifacts()

    def _load_artifacts(self) -> None:
        self.item_categories = self._load_item_categories(settings.item_map_path)
        self.historical_profiles = self._build_historical_profiles(
            raw_data_dir=settings.raw_data_dir,
            user_map_path=settings.user_map_path,
        )
        self.global_category_weights = self._build_global_category_weights(
            self.historical_profiles
        )

        try:
            with settings.model_path.open("rb") as model_file:
                self.model = pickle.load(model_file)
            self.model_ready = True
        except (
            Exception
        ) as exc:  # pragma: no cover - graceful degradation matters more than the exact exception
            self.model = None
            self.model_ready = False
            self.model_error = str(exc)

    def _load_item_categories(self, path: Path) -> dict[int, str]:
        with path.open("r", encoding="utf-8") as item_map_file:
            raw_item_map = json.load(item_map_file)

        return {
            int(index): normalize_category_name(category_name)
            for index, category_name in raw_item_map.items()
        }

    def _build_historical_profiles(
        self, raw_data_dir: Path, user_map_path: Path
    ) -> list[HistoricalUserProfile]:
        with user_map_path.open("r", encoding="utf-8") as user_map_file:
            raw_user_map = json.load(user_map_file)

        known_users = {
            str(raw_user_id): int(index) for index, raw_user_id in raw_user_map.items()
        }
        merged_df = self._load_training_dataframe(raw_data_dir)
        if merged_df.empty:
            return []

        merged_df["normalized_category"] = merged_df["category"].map(
            normalize_category_name
        )
        merged_df = merged_df[
            merged_df["raw_user_id"].astype(str).isin(known_users.keys())
        ].copy()
        if merged_df.empty:
            return []

        profiles: list[HistoricalUserProfile] = []
        for raw_user_id, user_df in merged_df.groupby("raw_user_id"):
            gender = self._pick_mode(user_df["gender"])
            age = self._pick_age(user_df["age"])
            category_weights = (
                user_df.groupby("normalized_category")["quantity"]
                .sum()
                .astype(float)
                .to_dict()
            )

            profiles.append(
                HistoricalUserProfile(
                    raw_user_id=str(raw_user_id),
                    user_index=known_users[str(raw_user_id)],
                    gender=gender,
                    age=age,
                    category_weights=category_weights,
                )
            )

        return profiles

    def _load_training_dataframe(self, raw_data_dir: Path) -> pd.DataFrame:
        source_frames: list[pd.DataFrame] = []
        csv_specs = [
            (
                raw_data_dir / "customer_shopping_data.csv",
                {
                    "customer_id": "raw_user_id",
                    "gender": "gender",
                    "age": "age",
                    "category": "category",
                    "quantity": "quantity",
                },
            ),
            (
                raw_data_dir / "retail_sales_dataset.csv",
                {
                    "Customer ID": "raw_user_id",
                    "Gender": "gender",
                    "Age": "age",
                    "Product Category": "category",
                    "Quantity": "quantity",
                },
            ),
        ]

        for csv_path, rename_map in csv_specs:
            if not csv_path.exists():
                continue

            frame = pd.read_csv(csv_path)
            frame = frame[list(rename_map.keys())].rename(columns=rename_map)
            source_frames.append(frame)

        if not source_frames:
            return pd.DataFrame(
                columns=["raw_user_id", "gender", "age", "category", "quantity"]
            )

        merged = pd.concat(source_frames, ignore_index=True)
        merged["raw_user_id"] = merged["raw_user_id"].astype(str)
        merged["gender"] = merged["gender"].map(self._normalize_gender)
        merged["age"] = pd.to_numeric(merged["age"], errors="coerce")
        merged["quantity"] = pd.to_numeric(merged["quantity"], errors="coerce").fillna(
            1.0
        )
        return merged.dropna(subset=["raw_user_id", "category"])

    def _build_global_category_weights(
        self, profiles: list[HistoricalUserProfile]
    ) -> dict[str, float]:
        category_counter: defaultdict[str, float] = defaultdict(float)
        for profile in profiles:
            for category_name, weight in profile.category_weights.items():
                category_counter[category_name] += safe_float(weight)

        return normalize_score_map(dict(category_counter))

    def _pick_mode(self, values: pd.Series) -> str | None:
        normalized_values = [self._normalize_gender(value) for value in values.tolist()]
        normalized_values = [value for value in normalized_values if value]
        if not normalized_values:
            return None
        return Counter(normalized_values).most_common(1)[0][0]

    def _pick_age(self, values: pd.Series) -> int | None:
        numeric_values = [int(value) for value in values.dropna().tolist()]
        if not numeric_values:
            return None
        return int(round(float(np.median(numeric_values))))

    def _normalize_gender(self, value: str | None) -> str | None:
        if not value:
            return None

        normalized = str(value).strip().lower()
        if normalized in {"male", "m"}:
            return "male"
        if normalized in {"female", "f"}:
            return "female"
        return None

    def _find_similar_profiles(
        self, request: RecommendationRequest, top_k: int = 30
    ) -> list[tuple[HistoricalUserProfile, float]]:
        if not self.historical_profiles:
            return []

        live_gender = self._normalize_gender(request.user.gender)
        live_age = request.user.age
        live_category_weights = {
            normalize_category_name(category_name): safe_float(weight)
            for category_name, weight in request.user.category_weights.items()
            if category_name
        }

        scored_profiles: list[tuple[HistoricalUserProfile, float]] = []
        for profile in self.historical_profiles:
            similarity = 0.0

            if live_gender and profile.gender:
                similarity += 0.35 if live_gender == profile.gender else 0.05

            if live_age and profile.age:
                age_gap = abs(int(live_age) - int(profile.age))
                similarity += max(0.0, 0.35 * (1.0 - min(age_gap, 40) / 40))

            if live_category_weights and profile.category_weights:
                similarity += 0.30 * self._cosine_similarity(
                    live_category_weights, profile.category_weights
                )

            # Cold-start users might not have enough activity, so give them a small
            # base similarity to nearby demographic profiles instead of returning nothing.
            if not live_category_weights and similarity > 0:
                similarity += 0.10

            if similarity > 0:
                scored_profiles.append((profile, similarity))

        scored_profiles.sort(key=lambda item: item[1], reverse=True)
        return scored_profiles[:top_k]

    def _cosine_similarity(
        self, left: dict[str, float], right: dict[str, float]
    ) -> float:
        keys = set(left.keys()) | set(right.keys())
        if not keys:
            return 0.0

        left_vector = np.array([safe_float(left.get(key)) for key in keys], dtype=float)
        right_vector = np.array(
            [safe_float(right.get(key)) for key in keys], dtype=float
        )

        left_norm = np.linalg.norm(left_vector)
        right_norm = np.linalg.norm(right_vector)
        if math.isclose(left_norm, 0.0) or math.isclose(right_norm, 0.0):
            return 0.0

        return float(np.dot(left_vector, right_vector) / (left_norm * right_norm))

    def _predict_model_category_scores(
        self, request: RecommendationRequest
    ) -> tuple[dict[str, float], int]:
        if not self.model_ready or self.model is None or not self.item_categories:
            return {}, 0

        similar_profiles = self._find_similar_profiles(request)
        if not similar_profiles:
            return {}, 0

        item_indices = np.arange(len(self.item_categories))
        weighted_scores: defaultdict[str, float] = defaultdict(float)
        total_weight = 0.0

        for profile, similarity in similar_profiles:
            predictions = self.model.predict(profile.user_index, item_indices)
            for item_index, raw_score in enumerate(predictions):
                category_name = self.item_categories.get(int(item_index))
                if not category_name:
                    continue
                weighted_scores[category_name] += safe_float(raw_score) * similarity
            total_weight += similarity

        if math.isclose(total_weight, 0.0):
            return {}, 0

        averaged_scores = {
            category_name: score / total_weight
            for category_name, score in weighted_scores.items()
        }
        return normalize_score_map(averaged_scores), len(similar_profiles)

    def _build_interaction_scores(
        self, request: RecommendationRequest
    ) -> dict[str, float]:
        normalized_scores = {
            normalize_category_name(category_name): safe_float(weight)
            for category_name, weight in request.user.category_weights.items()
            if category_name
        }
        return normalize_score_map(normalized_scores)

    def _pick_reason(
        self,
        category_name: str,
        interaction_score: float,
        model_score: float,
        popularity_score: float,
    ) -> tuple[str, str]:
        pretty_category = category_name.title() if category_name else "similar products"

        if (
            interaction_score >= max(model_score, popularity_score)
            and interaction_score > 0
        ):
            return (
                "activity_match",
                f"Based on your recent interest in {pretty_category}.",
            )

        if model_score > 0:
            return (
                "similar_customers",
                f"Customers with similar tastes also explore {pretty_category}.",
            )

        return "popular_right_now", f"Popular picks from {pretty_category} right now."

    def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        if not request.products:
            return RecommendationResponse(
                recommendations=[],
                metadata=RecommendationMetadata(
                    algorithm_version=self.algorithm_version,
                    strategy="no_products_available",
                    model_ready=self.model_ready,
                    matched_training_users=0,
                ),
            )

        model_category_scores, matched_training_users = (
            self._predict_model_category_scores(request)
        )
        interaction_scores = self._build_interaction_scores(request)
        seen_product_ids = set(request.user.seen_product_ids)

        popularity_max = max(
            (product.purchase_count for product in request.products), default=0
        )
        ranked_candidates: list[RankedProduct] = []
        seen_ranked_candidates: list[RankedProduct] = []

        for product in request.products:
            normalized_category = normalize_category_name(product.category_name)
            interaction_score = interaction_scores.get(normalized_category, 0.0)
            model_score = model_category_scores.get(
                normalized_category,
                self.global_category_weights.get(normalized_category, 0.0),
            )
            popularity_score = (
                safe_float(product.purchase_count) / popularity_max
                if popularity_max > 0
                else 0.0
            )

            final_score = (
                0.55 * model_score + 0.30 * interaction_score + 0.15 * popularity_score
            )

            reason_code, reason = self._pick_reason(
                category_name=normalized_category,
                interaction_score=interaction_score,
                model_score=model_score,
                popularity_score=popularity_score,
            )

            ranked_product = RankedProduct(
                product_id=product.id,
                score=round(final_score, 6),
                reason_code=reason_code,
                reason=reason,
                product=product,
            )

            if product.id in seen_product_ids:
                seen_ranked_candidates.append(ranked_product)
            else:
                ranked_candidates.append(ranked_product)

        ranked_candidates.sort(key=lambda item: item.score, reverse=True)
        seen_ranked_candidates.sort(key=lambda item: item.score, reverse=True)

        final_recommendations = ranked_candidates[: request.limit]
        if len(final_recommendations) < request.limit:
            final_recommendations.extend(
                seen_ranked_candidates[: request.limit - len(final_recommendations)]
            )

        return RecommendationResponse(
            recommendations=final_recommendations,
            metadata=RecommendationMetadata(
                algorithm_version=self.algorithm_version,
                strategy=(
                    "lightfm_category_blend"
                    if self.model_ready
                    else "heuristic_fallback"
                ),
                model_ready=self.model_ready,
                matched_training_users=matched_training_users,
            ),
        )


recommendation_pipeline = RetailIQRecommendationPipeline()

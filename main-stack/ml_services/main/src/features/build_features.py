def build_features(df):
    df["avg_order_value"] = df["total_order_value"] / df["total_orders"]
    return df
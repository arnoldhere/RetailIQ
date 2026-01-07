def clean_data(df):
    df = df.dropna()
    df = df[df["total_order_value"] > 0]
    return df
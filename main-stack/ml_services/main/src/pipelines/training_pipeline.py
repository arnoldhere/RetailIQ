from data.load_data import load_customer_data
from data.preprocess import clean_data
from features.build_features import build_features
from models.train import train_model
from models.evaluate import evaluate_model
from dotenv import load_dotenv
import os

load_dotenv()  # loads variables from .env into environment

DB_URL = os.getenv("DB_URL")


def run_pipeline():
    df = load_customer_data(DB_URL)
    df = clean_data(df)
    df = build_features(df)

    X = df.drop("total_order_value", axis=1)
    y = df["total_order_value"]

    model = train_model(X, y, config)
    metrics = evaluate_model(model, X, y)
    print("Evaluation Metrics:", metrics)
    # save_model(model)
    # log_metrics(metrics)

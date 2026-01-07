from sklearn.metrics import mean_absolute_error, r2_score


def evaluate_model(model, X, y):
    preds = model.predict(X)
    return {"mae": mean_absolute_error(y, preds), "r2": r2_score(y, preds)}

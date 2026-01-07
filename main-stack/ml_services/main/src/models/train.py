from sklearn.ensemble import RandomForestRegressor

def train_model(X, y, config):
    model = RandomForestRegressor(
        n_estimators=config["n_estimators"],
        random_state=42
    )
    model.fit(X, y)
    return model

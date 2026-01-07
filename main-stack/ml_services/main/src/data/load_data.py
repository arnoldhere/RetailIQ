import pandas as pd
from sqlalchemy import create_engine


def load_customer_data(db_url: str) -> pd.DataFrame:
    engine = create_engine(db_url)
    query = """
    SELECT cust_id,
        SUM(total_amount) AS total_order_value,
        COUNT(id) AS total_orders
    FROM customer_orders
    GROUP BY cust_id
    """
    return pd.read_sql(query, engine)

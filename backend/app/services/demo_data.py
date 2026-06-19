import pandas as pd
import numpy as np
import io
from typing import Dict, Any

def generate_perfect_dataset() -> pd.DataFrame:
    data = {
        "order_id": [f"ORD-{i:05d}" for i in range(1, 11)],
        "transaction_date": ["2023-10-01", "2023-10-02", "2023-10-03", "2023-10-04", "2023-10-05", "2023-10-06", "2023-10-07", "2023-10-08", "2023-10-09", "2023-10-10"],
        "customer_name": ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy"],
        "phone_number": ["+1-202-555-0101", "+44-1632-960000", "+65-6123-4567", "+91-9876543210", "+1-202-555-0105", "+44-1632-960006", "+65-6123-4568", "+91-9876543211", "+1-202-555-0109", "+44-1632-960010"],
        "country": ["USA", "UK", "Singapore", "India", "USA", "UK", "Singapore", "India", "USA", "UK"],
        "amount": [150.0, 200.5, 30.0, 450.75, 10.0, 99.99, 1050.0, 15.5, 42.0, 89.0],
        "currency": ["USD", "GBP", "SGD", "INR", "USD", "GBP", "SGD", "INR", "USD", "GBP"],
        "payment_mode": ["Credit Card", "PayPal", "Bank Transfer", "Credit Card", "Debit Card", "PayPal", "Bank Transfer", "Credit Card", "PayPal", "Debit Card"]
    }
    return pd.DataFrame(data)

def generate_phone_error_dataset() -> pd.DataFrame:
    df = generate_perfect_dataset()
    df.loc[1, "phone_number"] = "1632-960000" # Missing country code
    df.loc[3, "phone_number"] = "987654321" # Missing digit
    df.loc[6, "phone_number"] = "+65-612-4568" # Invalid length
    return df

def generate_date_error_dataset() -> pd.DataFrame:
    df = generate_perfect_dataset()
    df.loc[0, "transaction_date"] = "10/01/2023" # US format instead of ISO
    df.loc[2, "transaction_date"] = "2023/10/03" # Slant instead of dash
    df.loc[5, "transaction_date"] = "2023-13-06" # Invalid month
    df.loc[8, "transaction_date"] = None # Missing date
    return df

def generate_mixed_country_dataset() -> pd.DataFrame:
    df = generate_perfect_dataset()
    return df

def generate_duplicate_dataset() -> pd.DataFrame:
    df = generate_perfect_dataset()
    df = pd.concat([df, df.iloc[[0, 3, 5]]], ignore_index=True)
    return df

def generate_large_scale_dataset() -> pd.DataFrame:
    df = generate_perfect_dataset()
    return pd.concat([df] * 10000, ignore_index=True) # 100k rows

def get_demo_dataset_csv(dataset_name: str) -> str:
    datasets = {
        "perfect": generate_perfect_dataset,
        "phone_error": generate_phone_error_dataset,
        "date_error": generate_date_error_dataset,
        "mixed_country": generate_mixed_country_dataset,
        "duplicate": generate_duplicate_dataset,
        "large_scale": generate_large_scale_dataset,
    }
    if dataset_name not in datasets:
        return ""
    df = datasets[dataset_name]()
    return df.to_csv(index=False)

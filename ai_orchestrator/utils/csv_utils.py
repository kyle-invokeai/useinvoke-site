# Parse, sanitize, and infer types from CSV files
import pandas as pd
from typing import List, Dict, Any

def load_csv(filepath: str, nrows: int = None) -> pd.DataFrame:
    return pd.read_csv(filepath, nrows=nrows)

def get_csv_columns(df: pd.DataFrame) -> List[str]:
    return list(df.columns)

def infer_column_types(df: pd.DataFrame) -> Dict[str, str]:
    return {col: str(df[col].dtype) for col in df.columns}

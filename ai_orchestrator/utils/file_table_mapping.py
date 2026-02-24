import os
import json
import logging

MAPPING_FILE = os.path.join(os.path.dirname(__file__), "file_table_mapping.json")

def load_file_table_mapping() -> dict:
    if not os.path.exists(MAPPING_FILE):
        return {}
    try:
        with open(MAPPING_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            logging.warning("file_table_mapping.json is not a dict. Reinitializing as empty.")
            return {}
        return data
    except (json.JSONDecodeError, ValueError) as e:
        logging.warning(f"Malformed file_table_mapping.json: {e}. Reinitializing as empty.")
        return {}

def save_file_table_mapping(mapping: dict) -> None:
    if not isinstance(mapping, dict):
        raise ValueError("Mapping must be a dictionary.")
    current = load_file_table_mapping()
    if current == mapping:
        return
    with open(MAPPING_FILE, "w", encoding="utf-8") as f:
        json.dump(mapping, f, indent=2)

def update_file_table_mapping(csv_filename: str, table_name: str) -> None:
    mapping = load_file_table_mapping()
    mapping[csv_filename] = table_name
    save_file_table_mapping(mapping)

def remove_file_mapping(csv_filename: str) -> None:
    mapping = load_file_table_mapping()
    if csv_filename in mapping:
        del mapping[csv_filename]
        save_file_table_mapping(mapping)

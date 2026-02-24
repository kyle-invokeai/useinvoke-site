# Shared dataclasses for session state
from dataclasses import dataclass, field
from typing import List, Dict, Any

@dataclass
class SyncState:
    csv_filename: str = ""
    base_id: str = ""
    selected_table: str = ""
    csv_columns: List[str] = field(default_factory=list)
    airtable_fields: List[str] = field(default_factory=list)
    field_mapping: Dict[str, str] = field(default_factory=dict)
    field_types: Dict[str, str] = field(default_factory=dict)
    records: List[Dict[str, Any]] = field(default_factory=list)
    preview_cache: List[Dict[str, Any]] = field(default_factory=list)

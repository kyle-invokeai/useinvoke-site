import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from ai_orchestrator.utils import csv_utils, airtable_schema, field_mapper, sync_executor, state
import os
import json
from pathlib import Path

MAPPING_CACHE_PATH = Path.home() / ".agent_orchestrator" / "mappings.json"

class CSVSyncPanel(tk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent, bg="#f0f0f0")
        self.app = app
        self.sync_state = state.SyncState()
        self._build_ui()

    def _build_ui(self):
        tk.Label(self, text="CSV-to-Airtable Sync", font=("Segoe UI", 14, "bold"), bg="#f0f0f0").pack(anchor="w", pady=(10, 0))
        main = tk.Frame(self, bg="#f0f0f0")
        main.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        file_btn = tk.Button(main, text="Select CSV File", command=self.select_file, font=("Segoe UI", 11))
        file_btn.pack(anchor="w", pady=(0, 10))
        self.file_label = tk.Label(main, text="No file selected", font=("Segoe UI", 10, "italic"), bg="#f0f0f0")
        self.file_label.pack(anchor="w")
        self.table_var = tk.StringVar()
        self.table_dropdown = ttk.Combobox(main, textvariable=self.table_var, state="readonly")
        self.table_dropdown.pack(anchor="w", pady=(10, 10))
        self.table_dropdown.bind('<<ComboboxSelected>>', self.on_table_select)
        self.mapping_frame = tk.Frame(main, bg="#f0f0f0")
        self.mapping_frame.pack(fill=tk.BOTH, expand=True)
        self.dry_run_var = tk.BooleanVar(value=False)
        dry_run_chk = tk.Checkbutton(main, text="Preview Sync (Dry Run)", variable=self.dry_run_var, bg="#f0f0f0")
        dry_run_chk.pack(anchor="w", pady=(0, 8))
        sync_btn = tk.Button(main, text="Sync", command=self.sync, font=("Segoe UI", 12, "bold"), bg="#2a7ae2", fg="white")
        sync_btn.pack(anchor="e", pady=10)
        self.summary_frame = tk.LabelFrame(main, text="Sync Result Summary", bg="#f0f0f0")
        self.summary_frame.pack(fill=tk.X, pady=(8, 0))
        self.summary_frame.pack_forget()
        self.summary_content = tk.Label(self.summary_frame, text="", bg="#f0f0f0", justify="left")
        self.summary_content.pack(anchor="w", padx=8, pady=4)
        clear_btn = tk.Button(main, text="Clear Mapping Cache", command=self.clear_mapping_cache)
        clear_btn.pack(anchor="w", pady=(0, 8))
        self.refresh_table_dropdown()

    def select_file(self):
        file_path = filedialog.askopenfilename(filetypes=[("CSV Files", "*.csv")])
        if file_path:
            self.sync_state.csv_filename = file_path
            self.file_label.config(text=os.path.basename(file_path))
            self.app.log_dev(f"Selected CSV file: {file_path}")
            self.load_csv_and_schema()
            self.load_mapping_cache()

    def refresh_table_dropdown(self):
        api_key = os.getenv("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_TOKEN")
        base_id = os.getenv("AIRTABLE_BASE_ID")
        self.sync_state.base_id = base_id
        try:
            # Get all tables in the base
            url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
            headers = {"Authorization": f"Bearer {api_key}"}
            import requests
            resp = requests.get(url, headers=headers)
            resp.raise_for_status()
            tables = resp.json().get("tables", [])
            table_names = [t["name"] for t in tables]
            self.table_dropdown['values'] = table_names
            if table_names:
                self.table_var.set(table_names[0])
        except Exception as e:
            self.table_dropdown['values'] = []
            self.table_var.set("")
            self.app.log_dev(f"Failed to refresh table dropdown: {e}")

    def on_table_select(self, event=None):
        self.sync_state.selected_table = self.table_var.get()
        self.load_csv_and_schema()

    def load_csv_and_schema(self):
        if not self.sync_state.csv_filename or not self.sync_state.selected_table:
            return
        try:
            df = csv_utils.load_csv(self.sync_state.csv_filename, nrows=100)
            self.sync_state.csv_columns = csv_utils.get_csv_columns(df)
            self.sync_state.field_types = csv_utils.infer_column_types(df)
            api_key = os.getenv("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_TOKEN")
            base_id = self.sync_state.base_id
            table = self.sync_state.selected_table
            self.sync_state.airtable_fields = airtable_schema.get_fields(api_key, base_id, table)
            self.sync_state.field_mapping = field_mapper.map_fields(self.sync_state.csv_columns, self.sync_state.airtable_fields)
            self.render_mapping()
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load CSV or Airtable schema: {e}")
            self.app.log_dev(f"Schema load error: {e}")

    def load_mapping_cache(self):
        try:
            if MAPPING_CACHE_PATH.exists():
                with open(MAPPING_CACHE_PATH, "r") as f:
                    cache = json.load(f)
                mapping = cache.get(self.sync_state.csv_filename, {})
                if mapping:
                    self.sync_state.field_mapping = mapping
                    self.app.log_dev(f"Loaded cached mapping for {self.sync_state.csv_filename}")
        except Exception as e:
            self.app.log_dev(f"Mapping cache load error: {e}")

    def save_mapping_cache(self):
        try:
            cache = {}
            if MAPPING_CACHE_PATH.exists():
                with open(MAPPING_CACHE_PATH, "r") as f:
                    cache = json.load(f)
            cache[self.sync_state.csv_filename] = self.sync_state.field_mapping
            MAPPING_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(MAPPING_CACHE_PATH, "w") as f:
                json.dump(cache, f, indent=2)
            self.app.log_dev(f"Saved mapping cache for {self.sync_state.csv_filename}")
        except Exception as e:
            self.app.log_dev(f"Mapping cache save error: {e}")

    def clear_mapping_cache(self):
        try:
            if MAPPING_CACHE_PATH.exists():
                MAPPING_CACHE_PATH.unlink()
            self.app.log_dev("Mapping cache cleared.")
        except Exception as e:
            self.app.log_dev(f"Failed to clear mapping cache: {e}")

    def render_mapping(self):
        for w in self.mapping_frame.winfo_children():
            w.destroy()
        for csv_col in self.sync_state.csv_columns:
            at_field = self.sync_state.field_mapping.get(csv_col, "")
            row = tk.Frame(self.mapping_frame, bg="#f0f0f0")
            tk.Label(row, text=csv_col, width=24, anchor="w", bg="#f0f0f0").pack(side=tk.LEFT)
            at_var = tk.StringVar(value=at_field)
            at_dropdown = ttk.Combobox(row, textvariable=at_var, values=[""] + self.sync_state.airtable_fields, width=24)
            at_dropdown.pack(side=tk.LEFT, padx=4)
            def on_link_selected(event=None, col=csv_col, var=at_var):
                val = var.get()
                if val:
                    self.sync_state.field_mapping[col] = val
                elif col in self.sync_state.field_mapping:
                    del self.sync_state.field_mapping[col]
            at_dropdown.bind("<<ComboboxSelected>>", on_link_selected)
            row.pack(fill=tk.X, pady=2)
        self.save_mapping_cache()

    def sync(self):
        api_key = os.getenv("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_TOKEN")
        dry_run = self.dry_run_var.get()
        try:
            df = csv_utils.load_csv(self.sync_state.csv_filename)
            records = []
            for _, row in df.iterrows():
                record = {}
                for csv_col, at_field in self.sync_state.field_mapping.items():
                    record[at_field] = row[csv_col]
                records.append(record)
            self.sync_state.records = records
            schema_dict = airtable_schema.get_field_types(api_key, self.sync_state.base_id, self.sync_state.selected_table)
            valid_records, skipped, errors = sync_executor.validate_records(records, schema_dict)
            summary = f"✅ {len(valid_records)} records ready\n"
            if skipped:
                summary += f"⚠️ {len(skipped)} records skipped:\n"
                for idx, reason in skipped:
                    summary += f"  - Row {idx+1}: {reason}\n"
            if dry_run:
                sample = valid_records[:3]
                summary += f"\nSample payload (first 3 records):\n{json.dumps(sample, indent=2)}"
                self.app.log_dev(f"[Dry Run] {len(valid_records)} records would be sent. Sample: {json.dumps(sample, indent=2)}")
                self.show_summary(summary)
                return
            result = sync_executor.push_to_airtable(self.sync_state, api_key, valid_records)
            if result["status_code"] in (200, 201):
                self.app.log_dev(f"Sync success: {len(valid_records)} records sent.")
                summary += f"\n✅ {len(valid_records)} records synced."
                self.show_summary(summary)
                try:
                    from ai_orchestrator.utils.agent_sync_log import AgentSyncLog
                    AgentSyncLog.trigger_post_sync_hooks(valid_records)
                except Exception as e:
                    self.app.log_dev(f"Agent hook error: {e}")
            else:
                self.app.log_dev(f"Sync error: {result['response']}")
                summary += f"\n❌ Airtable error: {result['response']}"
                self.show_summary(summary, retry=True, failed_records=valid_records)
        except Exception as e:
            self.app.log_dev(f"Sync Exception: {e}")
            messagebox.showerror("Sync Failed", f"Sync failed: {e}")

    def show_summary(self, text, retry=False, failed_records=None):
        self.summary_content.config(text=text)
        self.summary_frame.pack(fill=tk.X, pady=(8, 0))
        if retry and failed_records:
            retry_btn = tk.Button(self.summary_frame, text="Retry Failed", command=lambda: self.retry_failed(failed_records))
            retry_btn.pack(anchor="w", padx=8, pady=4)

    def retry_failed(self, failed_records):
        api_key = os.getenv("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_TOKEN")
        try:
            result = sync_executor.push_to_airtable(self.sync_state, api_key, failed_records)
            if result["status_code"] in (200, 201):
                self.app.log_dev(f"Retry success: {len(failed_records)} records sent.")
                self.show_summary(f"✅ Retry success: {len(failed_records)} records synced.")
            else:
                self.app.log_dev(f"Retry error: {result['response']}")
                self.show_summary(f"❌ Retry failed: {result['response']}")
        except Exception as e:
            self.app.log_dev(f"Retry Exception: {e}")
            self.show_summary(f"❌ Retry Exception: {e}")
import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import pandas as pd
from dotenv import load_dotenv
from ai_orchestrator.utils.airtable_field_mapping import (
    get_airtable_fields, create_airtable_field, VALID_AIRTABLE_TYPES, infer_field_type_from_csv
)
from ai_orchestrator.utils.file_table_mapping import (
    load_file_table_mapping, save_file_table_mapping, update_file_table_mapping, remove_file_mapping
)
from ai_orchestrator.utils.airtable_sync_log import (
    log_sync, get_recent_logs
)
import requests
import math
import json
import datetime
import threading
import time
from tkinter import simpledialog

VERSION = "v0.4.3 Unmap logging/UI/refresh fix (2025-05-03)"
VERSION_HISTORY_FILE = "version_history.json"

def log_version_history(version, description):
    entry = {
        "version": version,
        "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "description": description
    }
    try:
        with open(VERSION_HISTORY_FILE, "r", encoding="utf-8") as f:
            history = json.load(f)
    except Exception:
        history = []
    history.append(entry)
    with open(VERSION_HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

# Log the current version on startup
log_version_history(VERSION, "Unmap logging/UI/refresh fix; see code for details.")

def get_airtable_tables(api_key, base_id):
    url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
    headers = {"Authorization": f"Bearer {api_key}"}
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    tables = resp.json().get("tables", [])
    return [t["name"] for t in tables]

class CollapsibleSection(tk.Frame):
    def __init__(self, parent, title, icon, *args, **kwargs):
        super().__init__(parent, *args, **kwargs)
        self.expanded = tk.BooleanVar(value=True)
        self.header = tk.Frame(self)
        self.header.pack(fill=tk.X)
        tk.Label(self.header, text=f"{icon} {title}", font=("Segoe UI", 11, "bold")).pack(side=tk.LEFT)
        self.toggle_btn = tk.Button(self.header, text="–", width=2, command=self.toggle)
        self.toggle_btn.pack(side=tk.RIGHT)
        self.body = tk.Frame(self)
        self.body.pack(fill=tk.X)
    def toggle(self):
        if self.expanded.get():
            self.body.pack_forget()
            self.toggle_btn.config(text="+")
            self.expanded.set(False)
        else:
            self.body.pack(fill=tk.X)
            self.toggle_btn.config(text="–")
            self.expanded.set(True)

class FieldMappingRow(tk.Frame):
    FIELD_TYPE_ICONS = {
        'singleLineText': '🔤', 'longText': '📝', 'multilineText': '📝', 'number': '🔢', 'percent': '%', 'currency': '$',
        'singleSelect': '🔽', 'multipleSelects': '🏷️', 'date': '📅', 'dateTime': '⏰', 'checkbox': '☑️', 'email': '✉️',
        'phoneNumber': '📞', 'url': '🔗', 'multipleAttachments': '📎', 'rating': '⭐', 'richText': '📝', 'duration': '⏱️',
        'autoNumber': '#', 'barcode': '🏷️', 'createdTime': '🕒', 'lastModifiedTime': '🕒', 'button': '🔘',
        'createdBy': '👤', 'lastModifiedBy': '👤', 'externalSyncSource': '🌐', 'aiText': '🤖'
    }
    def __init__(self, parent, csv_col, csv_type, at_fields, mapping, on_create, on_link, error_msg=None, at_types=None):
        super().__init__(parent, bg="#f9f9f9", pady=2)
        self.csv_col = csv_col
        self.csv_type = csv_type
        self.at_fields = at_fields
        self.mapping = mapping
        self.on_create = on_create
        self.on_link = on_link
        self.error_msg = error_msg
        self.at_types = at_types or {}
        self._build()
    def _build(self):
        lbl_csv = tk.Label(self, text=self.csv_col, font=("Segoe UI", 10), bg="#f9f9f9")
        lbl_csv.grid(row=0, column=0, sticky="w", padx=4)
        lbl_type = tk.Label(self, text=f"({self.csv_type})", font=("Segoe UI", 9, "italic"), fg="#888", bg="#f9f9f9")
        lbl_type.grid(row=0, column=1, sticky="w")
        at_var = tk.StringVar(value=self.mapping.get(self.csv_col, ""))
        at_dropdown = ttk.Combobox(self, textvariable=at_var, values=[""] + self.at_fields, width=20)
        at_dropdown.grid(row=0, column=2, padx=4)
        at_type = self.at_types.get(at_var.get(), "singleLineText")
        icon = self.FIELD_TYPE_ICONS.get(at_type, '')
        lbl_at_type = tk.Label(self, text=f"{icon} {at_type}", font=("Segoe UI", 9), fg="#555", bg="#f9f9f9")
        lbl_at_type.grid(row=0, column=3, sticky="w", padx=4)
        def on_link_selected(event=None):
            val = at_var.get()
            if val == "":
                self.on_link(self.csv_col, None, log_action=True)
            else:
                self.on_link(self.csv_col, val, log_action=True)
        at_dropdown.bind("<<ComboboxSelected>>", on_link_selected)
        btn_unmap = tk.Button(self, text="❌ Unmap", command=lambda: (at_var.set(""), on_link_selected()))
        btn_unmap.grid(row=0, column=4, padx=2)
        btn_create = tk.Button(self, text="+ New Field", command=lambda: self.on_create(self.csv_col, self.csv_type))
        btn_create.grid(row=0, column=5, padx=2)
        if self.error_msg:
            tk.Label(self, text=self.error_msg, fg="red", bg="#f9f9f9").grid(row=1, column=0, columnspan=6, sticky="w", padx=4)

class CSVSyncFrame(tk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent, bg="#f0f0f0")
        self.app = app
        self.status = tk.StringVar(value="Ready")
        self.test_mode = tk.BooleanVar(value=False)
        self.file_path = None
        self.table_name = None
        self.csv_cols = []
        self.csv_types = {}
        self.at_fields = []
        self.mapping = {}
        self.errors = {}
        self._build_main()
    def _build_main(self):
        tk.Label(self, text="CSV-to-Airtable Sync", font=("Segoe UI", 14, "bold"), bg="#f0f0f0").pack(anchor="w", pady=(10, 0))
        tk.Label(self, text="(Legacy sync tool UI here)", font=("Segoe UI", 10, "italic"), bg="#f0f0f0").pack(anchor="w", pady=(0, 10))
        main = tk.Frame(self, bg="#f0f0f0")
        main.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        # File picker
        file_btn = tk.Button(main, text="Select CSV File", command=self.select_file, font=("Segoe UI", 11))
        file_btn.pack(anchor="w", pady=(0, 10))
        self.file_label = tk.Label(main, text="No file selected", font=("Segoe UI", 10, "italic"), bg="#f0f0f0")
        self.file_label.pack(anchor="w")
        # Table dropdown
        self.table_var = tk.StringVar()
        table_frame = tk.Frame(main, bg="#f0f0f0")
        table_frame.pack(anchor="w", pady=(10, 10))
        self.table_dropdown = ttk.Combobox(table_frame, textvariable=self.table_var, state="readonly")
        self.table_dropdown.pack(side=tk.LEFT)
        refresh_btn = tk.Button(table_frame, text="Refresh Tables", command=self.refresh_table_dropdown, font=("Segoe UI", 9))
        refresh_btn.pack(side=tk.LEFT, padx=(8, 0))
        self.table_dropdown.bind('<<ComboboxSelected>>', self.on_table_select)
        # --- Field Intelligence Panel ---
        self.intel_panel = CollapsibleSection(main, "Field Intelligence Panel", "🧠")
        self.intel_panel.pack(fill=tk.X, pady=6)
        analyze_btn = tk.Button(self.intel_panel.body, text="Analyze Field Conflicts", command=self.analyze_fields, bg="#e0e0ff")
        analyze_btn.pack(anchor="w", pady=4)
        self.intel_results_frame = tk.Frame(self.intel_panel.body, bg="#f8f8ff")
        self.intel_results_frame.pack(fill=tk.X, pady=2)
        # Preview toggle
        self.preview_var = tk.BooleanVar(value=False)
        preview_toggle = tk.Checkbutton(self.intel_panel.body, text="Preview Record Injection", variable=self.preview_var, command=self.show_preview)
        preview_toggle.pack(anchor="w", pady=2)
        self.preview_frame = tk.Frame(self.intel_panel.body, bg="#f8f8ff")
        self.preview_frame.pack(fill=tk.X, pady=2)
        # Scrollable mapping area
        mapping_outer = tk.Frame(main, bg="#f0f0f0")
        mapping_outer.pack(fill=tk.BOTH, expand=True)
        self.mapping_canvas = tk.Canvas(mapping_outer, bg="#f0f0f0", highlightthickness=0)
        self.mapping_scroll = ttk.Scrollbar(mapping_outer, orient="vertical", command=self.mapping_canvas.yview)
        self.mapping_canvas.configure(yscrollcommand=self.mapping_scroll.set)
        self.mapping_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        self.mapping_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.mapping_frame = tk.Frame(self.mapping_canvas, bg="#f0f0f0")
        self.mapping_canvas.create_window((0, 0), window=self.mapping_frame, anchor="nw")
        self.mapping_frame.bind("<Configure>", lambda e: self.mapping_canvas.configure(scrollregion=self.mapping_canvas.bbox("all")))
        # Sync button (fixed below mapping area)
        sync_btn = tk.Button(main, text="Sync", command=self.sync, font=("Segoe UI", 12, "bold"), bg="#2a7ae2", fg="white")
        sync_btn.pack(anchor="e", pady=10)
        self.refresh_table_dropdown()
    def analyze_fields(self):
        # Clear previous results
        for w in self.intel_results_frame.winfo_children():
            w.destroy()
        if not self.file_path or not self.table_var.get():
            tk.Label(self.intel_results_frame, text="Select a CSV file and Airtable table first.", fg="red").pack(anchor="w")
            return
        try:
            df = pd.read_csv(self.file_path, nrows=100)
            csv_cols = list(df.columns)
            csv_types = {col: str(df[col].dtype) for col in csv_cols}
            api_key = os.getenv("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_TOKEN")
            base_id = os.getenv("AIRTABLE_BASE_ID")
            from ai_orchestrator.utils.airtable_field_mapping import get_airtable_fields_and_types
            at_fields, at_types = get_airtable_fields_and_types(api_key, base_id, self.table_var.get())
            # --- Matched Fields ---
            matched = [(c, f) for c in csv_cols for f in at_fields if c.lower() == f.lower()]
            unmatched_csv = [c for c in csv_cols if not any(c.lower() == f.lower() for f in at_fields)]
            unused_at = [f for f in at_fields if not any(f.lower() == c.lower() for c in csv_cols)]
            # Section: Matched
            tk.Label(self.intel_results_frame, text="✅ Matched Fields", font=("Segoe UI", 10, "bold"), fg="#008800").pack(anchor="w", pady=(4,0))
            for csv_col, at_field in matched:
                tags = []
                at_type = at_types.get(at_field, "singleLineText")
                # Computed
                if at_type in ("formula", "rollup", "lookup", "count", "multipleLookupValues"):
                    tags.append("🚫 Computed")
                # Text format conflict
                if csv_types[csv_col] == "object" and at_type in ("singleLineText", "multilineText", "longText"):
                    # Heuristic: pandas 'object' is ambiguous, but if CSV has newlines, it's multiline
                    sample = df[csv_col].dropna().astype(str)
                    if not sample.empty and any("\n" in v for v in sample.head(10)):
                        if at_type == "singleLineText":
                            tags.append("⚠️ Text Format Conflict")
                # Select mismatch
                if at_type in ("singleSelect", "multipleSelects"):
                    # Check if CSV values are not in select options (not available here, but could be extended)
                    tags.append("❗Missing Select Options")
                # Suggest linked
                if at_type == "singleLineText" and any(x in csv_col.lower() for x in ["name", "owner", "project"]):
                    tags.append("🤖 Suggest as Linked")
                tag_str = " ".join(tags)
                tk.Label(self.intel_results_frame, text=f"{csv_col} → {at_field}  {tag_str}", bg="#eaffea").pack(anchor="w", padx=12)
            # Section: Unmatched CSV
            tk.Label(self.intel_results_frame, text="⚠️ Unmatched CSV Columns", font=("Segoe UI", 10, "bold"), fg="#e67e22").pack(anchor="w", pady=(8,0))
            for c in unmatched_csv:
                # Suggest type
                suggested_type = infer_field_type_from_csv(c, df)
                tk.Label(self.intel_results_frame, text=f"{c}  (suggest: {suggested_type})", bg="#fffbe6").pack(anchor="w", padx=12)
            # Section: Unused Airtable
            tk.Label(self.intel_results_frame, text="🗑️ Unused Airtable Fields", font=("Segoe UI", 10, "bold"), fg="#c0392b").pack(anchor="w", pady=(8,0))
            for f in unused_at:
                at_type = at_types.get(f, "singleLineText")
                tag = "🚫 Computed" if at_type in ("formula", "rollup", "lookup", "count", "multipleLookupValues") else ""
                tk.Label(self.intel_results_frame, text=f"{f} {tag}", bg="#ffeaea").pack(anchor="w", padx=12)
            # Bulk fix buttons
            btns_frame = tk.Frame(self.intel_results_frame, bg="#f8f8ff")
            btns_frame.pack(anchor="w", pady=8)
            tk.Button(btns_frame, text="Bulk Unmap Computed Fields", command=self.bulk_unmap_computed, bg="#fbeee6").pack(side=tk.LEFT, padx=2)
            tk.Button(btns_frame, text="Bulk Create Missing Fields", command=self.bulk_create_missing, bg="#e6fbe9").pack(side=tk.LEFT, padx=2)
        except Exception as e:
            tk.Label(self.intel_results_frame, text=f"Analysis failed: {e}", fg="red").pack(anchor="w")
    def bulk_unmap_computed(self):
        # Unmap all computed fields
        api_key = os.getenv("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_TOKEN")
        base_id = os.getenv("AIRTABLE_BASE_ID")
        from ai_orchestrator.utils.airtable_field_mapping import get_airtable_fields_and_types
        at_fields, at_types = get_airtable_fields_and_types(api_key, base_id, self.table_var.get())
        computed_types = ("formula", "rollup", "lookup", "count", "multipleLookupValues")
        to_unmap = [csv_col for csv_col, at_field in self.mapping.items() if at_types.get(at_field) in computed_types]
        for col in to_unmap:
            self.link_field(col, None, log_action=True)
        self.app.log_dev(f"Bulk unmapped computed fields: {to_unmap}")
        self.analyze_fields()
    def bulk_create_missing(self):
        # Create all missing fields in Airtable for unmatched CSV columns
        if not self.file_path or not self.table_var.get():
            return
        try:
            df = pd.read_csv(self.file_path, nrows=100)
            csv_cols = list(df.columns)
            api_key = os.getenv("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_TOKEN")
            base_id = os.getenv("AIRTABLE_BASE_ID")
            from ai_orchestrator.utils.airtable_field_mapping import get_airtable_fields_and_types
            at_fields, _ = get_airtable_fields_and_types(api_key, base_id, self.table_var.get())
            unmatched_csv = [c for c in csv_cols if not any(c.lower() == f.lower() for f in at_fields)]
            for c in unmatched_csv:
                suggested_type = infer_field_type_from_csv(c, df)
                create_airtable_field(api_key, base_id, self.table_var.get(), c, suggested_type, df)
                self.app.log_dev(f"Created field '{c}' ({suggested_type}) in Airtable.")
            self.load_csv_and_schema()
            self.analyze_fields()
        except Exception as e:
            messagebox.showerror("Bulk Create Failed", f"Failed to create missing fields: {e}")
    def show_preview(self):
        for w in self.preview_frame.winfo_children():
            w.destroy()
        if not self.preview_var.get() or not self.file_path or not self.table_var.get():
            return
        try:
            df = pd.read_csv(self.file_path)
            preview_rows = df.head(3)
            api_key = os.getenv("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_TOKEN")
            base_id = os.getenv("AIRTABLE_BASE_ID")
            from ai_orchestrator.utils.airtable_field_mapping import get_airtable_fields_and_types
            _, at_types = get_airtable_fields_and_types(api_key, base_id, self.table_var.get())
            tk.Label(self.preview_frame, text="Preview: First 3 CSV rows as Airtable records", font=("Segoe UI", 10, "bold"), fg="#2a7ae2").pack(anchor="w")
            for idx, row in preview_rows.iterrows():
                record = {}
                for col in self.csv_cols:
                    if col in self.mapping and self.mapping[col]:
                        at_field = self.mapping[col]
                        value = row[col]
                        at_type = at_types.get(at_field, "singleLineText")
                        if at_type == "multipleRecordLinks":
                            record[at_field] = str(value)
                        else:
                            record[at_field] = value
                tk.Label(self.preview_frame, text=f"Row {idx+2}: {record}", bg="#f0f8ff").pack(anchor="w", padx=12)
        except Exception as e:
            tk.Label(self.preview_frame, text=f"Preview failed: {e}", fg="red").pack(anchor="w")
    def sync(self):
        # Validate mapping
        if not self.mapping:
            messagebox.showerror("Sync Error", "No fields mapped. Please map at least one field.")
            return
        api_key = os.getenv("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_TOKEN")
        base_id = os.getenv("AIRTABLE_BASE_ID")
        table_name = self.table_var.get()
        try:
            df = pd.read_csv(self.file_path)
            records = []
            from ai_orchestrator.utils.airtable_field_mapping import get_airtable_fields_and_types
            _, at_types = get_airtable_fields_and_types(api_key, base_id, table_name)
            for idx, row in df.iterrows():
                record = {}
                for col in self.csv_cols:
                    if col in self.mapping and self.mapping[col]:
                        at_field = self.mapping[col]
                        value = row[col]
                        at_type = at_types.get(at_field, "singleLineText")
                        if at_type == "multipleRecordLinks":
                            if pd.isna(value) or value == "":
                                record[at_field] = []
                            elif isinstance(value, list):
                                record[at_field] = value
                            else:
                                items = [v.strip() for v in str(value).split(",") if v.strip()]
                                if all(i.startswith("rec") for i in items):
                                    record[at_field] = items
                                else:
                                    record[at_field] = items
                        else:
                            if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
                                record[at_field] = None
                            else:
                                record[at_field] = value
                records.append(record)
            # Use backend batching logic
            from ai_orchestrator.utils import sync_executor
            class DummyState:
                pass
            state = DummyState()
            state.base_id = base_id
            state.selected_table = table_name
            state.records = records
            result = sync_executor.push_to_airtable(state, api_key, records)
            # Summarize results
            success = sum(1 for r in result["results"] if r["status_code"] == 200)
            failed = sum(1 for r in result["results"] if r["status_code"] != 200)
            self.app.log_dev(f"[Sync] {success} batches succeeded, {failed} failed.")
            if failed == 0:
                messagebox.showinfo("Sync Success", f"All {success} batches synced successfully.")
            else:
                messagebox.showerror("Sync Error", f"{failed} batch(es) failed. See developer log for details.")
        except Exception as e:
            self.app.log_dev(f"Sync Exception: {e}")
            messagebox.showerror("Sync Failed", f"Sync failed: {e}")
        # After sync, log AgentSyncLog
        try:
            from ai_orchestrator.utils.airtable_field_mapping import get_airtable_fields_and_types
            api_key = os.getenv("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_TOKEN")
            base_id = os.getenv("AIRTABLE_BASE_ID")
            at_fields, at_types = get_airtable_fields_and_types(api_key, base_id, self.table_var.get())
            computed_types = ("formula", "rollup", "lookup", "count", "multipleLookupValues")
            mapped_fields = [c for c in self.mapping if at_types.get(self.mapping[c], "") not in computed_types]
            skipped_fields = [c for c in self.mapping if at_types.get(self.mapping[c], "") in computed_types]
            log_sync(
                table=self.table_var.get(),
                file_path=self.file_path,
                record_count=len(mapped_fields),
                status="success",
                error=None
            )
            self.app.log_dev(f"AgentSyncLog: mapped={mapped_fields}, skipped={skipped_fields}")
        except Exception as e:
            self.app.log_dev(f"AgentSyncLog failed: {e}")
    def show_sync_summary(self, created, failed_rows):
        summary_win = tk.Toplevel(self)
        summary_win.title("Sync Summary")
        msg = f"✅ {created} records synced successfully."
        if failed_rows:
            msg += f"\n⚠️ {len(failed_rows)} failed – view logs or download."
        tk.Label(summary_win, text=msg, font=("Segoe UI", 11, "bold")).pack(pady=8)
        if failed_rows:
            def download_failed():
                import csv
                from tkinter import filedialog
                file_path = filedialog.asksaveasfilename(defaultextension=".csv", filetypes=[("CSV Files", "*.csv")])
                if file_path:
                    with open(file_path, "w", newline='', encoding="utf-8") as f:
                        writer = csv.DictWriter(f, fieldnames=failed_rows[0].keys())
                        writer.writeheader()
                        writer.writerows(failed_rows)
            tk.Button(summary_win, text="Download Failed Rows as CSV", command=download_failed).pack(pady=8)
        tk.Button(summary_win, text="Close", command=summary_win.destroy).pack(pady=8)
    def select_file(self):
        file_path = filedialog.askopenfilename(filetypes=[("CSV Files", "*.csv")])
        if file_path:
            self.file_path = file_path
            self.file_label.config(text=os.path.basename(file_path))
            self.app.log_dev(f"Selected CSV file: {file_path}")
            self.refresh_table_dropdown()
            self.load_csv_and_schema()
    def on_table_select(self, event=None):
        # Only update mapping if a table is selected
        if self.file_path:
            csv_name = os.path.basename(self.file_path)
            update_file_table_mapping(csv_name, self.table_var.get())
            self.app.log_dev(f"Selected Airtable table: {self.table_var.get()} for file: {csv_name}")
        # Show Airtable columns even if no CSV is selected
        self.show_airtable_columns_popup(self.table_var.get())
        self.load_csv_and_schema()
    def show_airtable_columns_popup(self, table_name):
        api_key = os.getenv("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_TOKEN")
        base_id = os.getenv("AIRTABLE_BASE_ID")
        try:
            columns = get_airtable_fields(api_key, base_id, table_name)
            popup = tk.Toplevel(self)
            popup.title(f"Airtable Columns: {table_name}")
            tk.Label(popup, text=f"Columns in '{table_name}':", font=("Segoe UI", 11, "bold")).pack(pady=8)
            for col in columns:
                tk.Label(popup, text=col, font=("Segoe UI", 10)).pack(anchor="w", padx=16)
            tk.Button(popup, text="Close", command=popup.destroy).pack(pady=8)
        except Exception as e:
            messagebox.showerror("Airtable Columns", f"Failed to fetch columns: {e}")
    def load_csv_and_schema(self):
        try:
            df = pd.read_csv(self.file_path, nrows=100)
            self.csv_cols = list(df.columns)
            self.csv_types = {col: str(df[col].dtype) for col in self.csv_cols}
            api_key = os.getenv("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_TOKEN")
            base_id = os.getenv("AIRTABLE_BASE_ID")
            from ai_orchestrator.utils.airtable_field_mapping import get_airtable_fields_and_types
            self.at_fields, self.at_types = get_airtable_fields_and_types(api_key, base_id, self.table_var.get())
            self.mapping = {}
            for col in self.csv_cols:
                match = next((f for f in self.at_fields if f.lower() == col.lower()), None)
                if match:
                    self.mapping[col] = match
            self.render_mapping()
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load CSV or Airtable schema: {e}")
    def render_mapping(self):
        for w in self.mapping_frame.winfo_children():
            w.destroy()
        mapped_section = CollapsibleSection(self.mapping_frame, "Mapped Fields", "✅")
        mapped_section.pack(fill=tk.X, pady=4)
        unlinked_section = CollapsibleSection(self.mapping_frame, "Unlinked CSV Fields", "🟡")
        unlinked_section.pack(fill=tk.X, pady=4)
        unused_section = CollapsibleSection(self.mapping_frame, "Unused Airtable Fields", "🔴")
        unused_section.pack(fill=tk.X, pady=4)
        mapped = [(c, self.mapping[c]) for c in self.mapping]
        for csv_col, at_field in mapped:
            row = FieldMappingRow(mapped_section.body, csv_col, self.csv_types[csv_col], self.at_fields, self.mapping, self.create_field, self.link_field, at_types=self.at_types)
            row.pack(fill=tk.X, pady=1)
        unlinked = [c for c in self.csv_cols if c not in self.mapping]
        for csv_col in unlinked:
            row = FieldMappingRow(unlinked_section.body, csv_col, self.csv_types[csv_col], self.at_fields, self.mapping, self.create_field, self.link_field, at_types=self.at_types)
            row.pack(fill=tk.X, pady=1)
        # Unused = all Airtable fields not mapped to any CSV col
        used_fields = set(self.mapping.values())
        unused = [f for f in self.at_fields if f not in used_fields]
        for at_field in unused:
            row = tk.Frame(unused_section.body, bg="#f9f9f9", pady=2)
            tk.Label(row, text=at_field, font=("Segoe UI", 10), bg="#f9f9f9").pack(side=tk.LEFT, padx=4)
            at_type = self.at_types.get(at_field, "singleLineText")
            icon = FieldMappingRow.FIELD_TYPE_ICONS.get(at_type, '')
            tk.Label(row, text=f"{icon} {at_type}", font=("Segoe UI", 9), fg="#555", bg="#f9f9f9").pack(side=tk.LEFT, padx=4)
            tk.Label(row, text="(delete recommended)", fg="red", bg="#f9f9f9").pack(side=tk.LEFT, padx=4)
            row.pack(fill=tk.X, pady=1)
    def create_field(self, csv_col, csv_type):
        api_key = os.getenv("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_TOKEN")
        base_id = os.getenv("AIRTABLE_BASE_ID")
        df = pd.read_csv(self.file_path, nrows=100)
        type_win = tk.Toplevel(self)
        type_win.title(f"Create Field: {csv_col}")
        tk.Label(type_win, text=f"Field name: {csv_col}").pack(pady=4)
        tk.Label(type_win, text="Field type:").pack()
        inferred_type = infer_field_type_from_csv(csv_col, df)
        type_var = tk.StringVar(value=inferred_type)
        type_dropdown = ttk.Combobox(type_win, textvariable=type_var, values=VALID_AIRTABLE_TYPES, state="readonly")
        type_dropdown.pack(pady=4)
        options_var = tk.StringVar()
        options_label = tk.Label(type_win, text="Options (comma-separated, for select fields):")
        options_entry = tk.Entry(type_win, textvariable=options_var)
        def on_type_change(event=None):
            if type_var.get() in ("singleSelect", "multipleSelects"):
                options_label.pack()
                options_entry.pack()
            else:
                options_label.pack_forget()
                options_entry.pack_forget()
        type_dropdown.bind('<<ComboboxSelected>>', on_type_change)
        on_type_change()
        def on_create():
            field_type = type_var.get()
            options = None
            if field_type in ("singleSelect", "multipleSelects"):
                opts = [o.strip() for o in options_var.get().split(",") if o.strip()]
                if not opts:
                    messagebox.showerror("Options Required", "You must provide options for select fields.")
                    return
                options = {"choices": [{"name": o} for o in opts]}
            try:
                create_airtable_field(api_key, base_id, self.table_var.get(), csv_col, field_type, df, options)
                messagebox.showinfo("Field Created", f"Field '{csv_col}' ({field_type}) created in Airtable.")
                type_win.destroy()
                self.load_csv_and_schema()
            except Exception as e:
                self.app.log_dev(f"Field Create Error: {e}")
                messagebox.showerror("Create Field Failed", f"Failed to create field '{csv_col}': {e}")
        tk.Button(type_win, text="Create Field", command=on_create).pack(pady=8)
    def link_field(self, csv_col, at_field, log_action=False):
        # Always log mapping/unmapping actions
        if at_field:
            self.mapping[csv_col] = at_field
            if log_action:
                self.app.log_dev(f"Mapped CSV column '{csv_col}' to Airtable field '{at_field}'")
        else:
            removed_field = self.mapping.get(csv_col, None)
            if csv_col in self.mapping:
                del self.mapping[csv_col]
            if log_action:
                self.app.log_dev(f"Unmapped CSV column '{csv_col}' from Airtable field '{removed_field}'")
        self.render_mapping()
        self.update_idletasks()
    def refresh_table_dropdown(self):
        """
        Refresh the Airtable table dropdown with the latest table names from Airtable.
        """
        api_key = os.getenv("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_TOKEN")
        base_id = os.getenv("AIRTABLE_BASE_ID")
        try:
            tables = get_airtable_tables(api_key, base_id)
            self.table_dropdown['values'] = tables
            # If a file is selected, try to auto-select the mapped table
            if self.file_path:
                from ai_orchestrator.utils.file_table_mapping import load_file_table_mapping
                csv_name = os.path.basename(self.file_path)
                mapping = load_file_table_mapping()
                mapped_table = mapping.get(csv_name)
                if mapped_table and mapped_table in tables:
                    self.table_var.set(mapped_table)
                else:
                    self.table_var.set("")
            else:
                self.table_var.set("")
        except Exception as e:
            self.table_dropdown['values'] = []
            self.table_var.set("")
            self.app.log_dev(f"Failed to refresh table dropdown: {e}")

AGENT_REGISTRY_FILE = os.path.join(os.path.dirname(__file__), "agents.json")

class AgentSpaceFrame(tk.Frame):
    COLUMNS = ("agent_name", "trigger", "last_run", "status", "result")
    COL_LABELS = {
        "agent_name": "Agent Name",
        "trigger": "Trigger Type",
        "last_run": "Last Run",
        "status": "Status",
        "result": "Result/Output Summary"
    }
    def __init__(self, parent, app):
        super().__init__(parent, bg="#f8faff")
        self.app = app
        self.agents = []
        self._load_agents()
        tk.Label(self, text="AI Agent Space", font=("Segoe UI", 14, "bold"), bg="#f8faff").pack(anchor="w", pady=(10, 0))
        btns = tk.Frame(self, bg="#f8faff")
        btns.pack(anchor="w", pady=4)
        tk.Button(btns, text="+ Add Agent", command=self.add_agent_popup, width=14).pack(side=tk.LEFT, padx=2)
        tk.Button(btns, text="Run Selected Agent", command=self.run_selected_agent, width=18).pack(side=tk.LEFT, padx=2)
        tk.Button(btns, text="View Logs", command=self.view_logs_popup, width=14).pack(side=tk.LEFT, padx=2)
        tk.Button(btns, text="Run Airtable Task by Record ID", command=self.run_airtable_task_by_id, width=26).pack(side=tk.LEFT, padx=2)
        self.table = ttk.Treeview(self, columns=self.COLUMNS, show="headings", height=8)
        for col in self.COLUMNS:
            self.table.heading(col, text=self.COL_LABELS[col])
            self.table.column(col, width=160)
        self.table.pack(fill=tk.X, pady=8)
        self.refresh_table()
    def _load_agents(self):
        try:
            if os.path.exists(ENT_REGISTRY_FILE):
                with open(AGENT_REGISTRY_FILE, "r", encoding="utf-8") as f:
                    self.agents = json.load(f)
            else:
                self.agents = []
        except Exception as e:
            self.app.log_dev(f"Failed to load agents.json: {e}")
            self.agents = []
    def _save_agents(self):
        try:
            with open(AGENT_REGISTRY_FILE, "w", encoding="utf-8") as f:
                json.dump(self.agents, f, indent=2)
        except Exception as e:
            self.app.log_dev(f"Failed to save agents.json: {e}")
    def refresh_table(self):
        for row in self.table.get_children():
            self.table.delete(row)
        for agent in self.agents:
            self.table.insert("", tk.END, values=(
                agent.get("agent_name", ""),
                agent.get("trigger", ""),
                agent.get("last_run", ""),
                agent.get("status", "idle"),
                agent.get("result", "")
            ))
    def add_agent_popup(self):
        popup = tk.Toplevel(self)
        popup.title("Add Agent")
        popup.geometry("320x220")
        tk.Label(popup, text="Agent Name:").pack(anchor="w", padx=12, pady=(12,2))
        name_var = tk.StringVar()
        tk.Entry(popup, textvariable=name_var).pack(fill=tk.X, padx=12)
        tk.Label(popup, text="Trigger Type:").pack(anchor="w", padx=12, pady=(8,2))
        trigger_var = tk.StringVar(value="manual")
        trigger_opts = ttk.Combobox(popup, textvariable=trigger_var, values=["manual", "schedule", "on change"], state="readonly")
        trigger_opts.pack(fill=tk.X, padx=12)
        tk.Label(popup, text="Function (stub):").pack(anchor="w", padx=12, pady=(8,2))
        func_var = tk.StringVar(value="stub_function")
        tk.Entry(popup, textvariable=func_var).pack(fill=tk.X, padx=12)
        def on_add():
            agent = {
                "agent_name": name_var.get().strip() or f"Agent{len(self.agents)+1}",
                "trigger": trigger_var.get(),
                "function": func_var.get().strip() or "stub_function",
                "status": "idle",
                "last_run": "",
                "result": ""
            }
            self.agents.append(agent)
            self._save_agents()
            self.refresh_table()
            self.app.log_dev(f"Added agent: {agent['agent_name']}")
            popup.destroy()
        tk.Button(popup, text="Add", command=on_add).pack(pady=16)
    def run_selected_agent(self):
        selected = self.table.selection()
        if not selected:
            self.app.log_dev("No agent selected to run.")
            return
        idx = self.table.index(selected[0])
        agent = self.agents[idx]
        def run():
            self.app.log_dev(f"Running agent: {agent['agent_name']}")
            self.agents[idx]["status"] = "running"
            self.refresh_table()
            time.sleep(1.5)
            # Simulate result
            result = f"Success: {agent['agent_name']} completed at {time.strftime('%H:%M:%S')}"
            self.agents[idx]["status"] = "idle"
            self.agents[idx]["last_run"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            self.agents[idx]["result"] = result
            self._save_agents()
            self.refresh_table()
            self.app.log_dev(result)
        threading.Thread(target=run, daemon=True).start()
    def view_logs_popup(self):
        popup = tk.Toplevel(self)
        popup.title("Agent Logs")
        popup.geometry("600x400")
        log_text = tk.Text(popup, bg="#222", fg="#eee", font=("Consolas", 10))
        log_text.pack(fill=tk.BOTH, expand=True)
        for line in self.app.dev_log[-50:]:
            log_text.insert(tk.END, line + "\n")
        log_text.config(state=tk.DISABLED)
    def run_airtable_task_by_id(self):
        def on_submit():
            record_id = entry.get().strip()
            popup.destroy()
            if not record_id:
                self.app.log_dev("No Airtable Task ID entered.")
                return
            self._run_airtable_task(record_id)
        popup = tk.Toplevel(self)
        popup.title("Run Airtable Task")
        popup.geometry("320x120")
        tk.Label(popup, text="Enter Airtable Task Record ID:").pack(pady=(12, 4))
        entry = tk.Entry(popup)
        entry.pack(padx=12, pady=4)
        tk.Button(popup, text="Run Task", command=on_submit).pack(pady=12)

    def _run_airtable_task(self, record_id):
        def run():
            try:
                from agents.task_runner_agent import AirtableClient, TaskRunnerAgent
                client = AirtableClient(
                    api_token=os.getenv('AIRTABLE_API_TOKEN'),
                    base_id=os.getenv('AIRTABLE_BASE_ID'),
                    table_name=os.getenv('AIRTABLE_TABLE_TASKS', 'Tasks')
                )
                url = f"https://api.airtable.com/v0/{client.base_id}/{client.table_name}/{record_id}"
                import requests
                resp = requests.get(url, headers=client.headers)
                resp.raise_for_status()
                task = resp.json()
                agent = TaskRunnerAgent(dry_run=False)
                agent.airtable = client
                agent.run_task(task)
                self.app.log_dev(f"Task {record_id} executed successfully.")
                # Optionally update UI or table here
                from tkinter import messagebox
                messagebox.showinfo("Task Complete", f"Task {record_id} executed successfully.")
            except Exception as e:
                self.app.log_dev(f"Error running task: {e}")
                from tkinter import messagebox
                messagebox.showerror("Task Error", f"Error running task: {e}")
        import threading
        threading.Thread(target=run, daemon=True).start()

class WebTabIngestFrame(tk.Frame):
    DUMMY_TABS = [
        {"title": "OpenAI - ChatGPT", "url": "https://chat.openai.com/", "domain": "openai.com", "tags": "AI,Chat", "notes": "Main chat UI"},
        {"title": "Python Docs", "url": "https://docs.python.org/3/", "domain": "python.org", "tags": "Docs,Python", "notes": "Reference"},
        {"title": "Airtable", "url": "https://airtable.com/", "domain": "airtable.com", "tags": "Database", "notes": ""},
    ]
    def __init__(self, parent, app):
        super().__init__(parent, bg="#f8fff8")
        self.app = app
        tk.Label(self, text="Web Tab Collector", font=("Segoe UI", 14, "bold"), bg="#f8fff8").pack(anchor="w", pady=(10, 0))
        btns = tk.Frame(self, bg="#f8fff8")
        btns.pack(anchor="w", pady=4)
        tk.Button(btns, text="Import All Open Tabs", command=self.simulate_import, width=20).pack(side=tk.LEFT, padx=2)
        tk.Button(btns, text="Sync to Airtable", state=tk.DISABLED, width=20).pack(side=tk.LEFT, padx=2)
        self.table = ttk.Treeview(self, columns=("title", "url", "domain", "tags", "notes"), show="headings", height=6)
        for col in ("title", "url", "domain", "tags", "notes"):
            self.table.heading(col, text=col.title())
            self.table.column(col, width=160)
        self.table.pack(fill=tk.X, pady=8)
        self.simulate_import()
    def simulate_import(self):
        for row in self.table.get_children():
            self.table.delete(row)
        for tab in self.DUMMY_TABS:
            self.table.insert("", tk.END, values=(tab["title"], tab["url"], tab["domain"], tab["tags"], tab["notes"]))

class OrchestratorApp(tk.Tk):
    MODULES = [
        ("CSV Sync", CSVSyncFrame),
        ("AI Agent Space", AgentSpaceFrame),
        ("Web Tab Ingest", WebTabIngestFrame),
    ]
    def __init__(self):
        super().__init__()
        self.title(f"AI Orchestrator Platform {VERSION}")
        self.configure(bg="#e9e9e9")
        self.geometry("1200x850")
        self.module_settings = {}  # Persist settings per module
        self.current_module = None
        self.status = tk.StringVar(value="Ready")
        self._build_header()
        self._build_nav()
        self._build_main_panel()
        self._build_dev_log_panel()
        self.show_module(0)
    def _build_header(self):
        header = tk.Frame(self, bg="#e9e9e9", pady=8)
        header.pack(fill=tk.X)
        tk.Label(header, text=f"AI Orchestrator", font=("Segoe UI", 16, "bold"), bg="#e9e9e9").pack(side=tk.LEFT, padx=12)
        tk.Label(header, text=f"Version: {VERSION}", font=("Segoe UI", 10), fg="#2a7ae2", bg="#e9e9e9").pack(side=tk.LEFT, padx=12)
        tk.Label(header, textvariable=self.status, font=("Segoe UI", 10, "bold"), fg="#008800", bg="#e9e9e9").pack(side=tk.LEFT, padx=12)
        self.pin_var = tk.BooleanVar(value=True)
        pin_check = tk.Checkbutton(header, text="Pin to screen (always on top)", variable=self.pin_var, command=self.toggle_pin, bg="#e9e9e9")
        pin_check.pack(side=tk.RIGHT, padx=12)
    def _build_nav(self):
        nav = tk.Frame(self, bg="#f4f4f4", height=40)
        nav.pack(fill=tk.X)
        self.nav_buttons = []
        for idx, (name, _) in enumerate(self.MODULES):
            btn = tk.Button(nav, text=name, font=("Segoe UI", 11, "bold"), command=lambda i=idx: self.show_module(i), width=18, relief=tk.RAISED)
            btn.pack(side=tk.LEFT, padx=2, pady=2)
            self.nav_buttons.append(btn)
    def _build_main_panel(self):
        self.main_panel = tk.Frame(self, bg="#f0f0f0")
        self.main_panel.pack(fill=tk.BOTH, expand=True)
    def _build_dev_log_panel(self):
        self.dev_log = []
        self.dev_log_frame = tk.Frame(self, bg="#222", height=120)
        self.dev_log_toggle = tk.Button(self.dev_log_frame, text="Show Developer Log ▼", command=self.toggle_dev_log)
        self.dev_log_toggle.pack(side=tk.TOP, fill=tk.X)
        self.dev_log_text = tk.Text(self.dev_log_frame, height=8, bg="#222", fg="#eee", font=("Consolas", 9))
        self.dev_log_text.pack(fill=tk.BOTH, expand=True)
        self.dev_log_frame.pack(side=tk.BOTTOM, fill=tk.X)
        self.dev_log_visible = tk.BooleanVar(value=False)
    def toggle_dev_log(self):
        if self.dev_log_visible.get():
            self.dev_log_text.pack_forget()
            self.dev_log_toggle.config(text="Show Developer Log ▼")
            self.dev_log_visible.set(False)
        else:
            self.refresh_dev_log()
            self.dev_log_text.pack(fill=tk.BOTH, expand=True)
            self.dev_log_toggle.config(text="Hide Developer Log ▲")
            self.dev_log_visible.set(True)
    def log_dev(self, msg):
        from datetime import datetime
        ts = datetime.now().strftime("%H:%M:%S")
        self.dev_log.append(f"[{ts}] {msg}")
        if len(self.dev_log) > 100:
            self.dev_log = self.dev_log[-100:]
        self.refresh_dev_log()
    def refresh_dev_log(self):
        self.dev_log_text.config(state=tk.NORMAL)
        self.dev_log_text.delete(1.0, tk.END)
        for line in self.dev_log[-20:]:
            self.dev_log_text.insert(tk.END, line + "\n")
        self.dev_log_text.config(state=tk.DISABLED)
    def toggle_pin(self):
        self.attributes('-topmost', self.pin_var.get())
        # Persist per module
        if self.current_module is not None:
            self.module_settings.setdefault(self.current_module, {})['pin'] = self.pin_var.get()
    def show_module(self, idx):
        # Save settings for current module
        if self.current_module is not None:
            self.module_settings.setdefault(self.current_module, {})['pin'] = self.pin_var.get()
        # Clear main panel
        for w in self.main_panel.winfo_children():
            w.destroy()
        # Load new module
        name, FrameClass = self.MODULES[idx]
        self.current_module = name
        frame = FrameClass(self.main_panel, self)
        frame.pack(fill=tk.BOTH, expand=True)
        # Restore settings
        pin = self.module_settings.get(name, {}).get('pin', True)
        self.pin_var.set(pin)
        self.toggle_pin()
        self.status.set(f"{name} loaded.")
        self.log_dev(f"Switched to module: {name}")

if __name__ == "__main__":
    load_dotenv()
    app = OrchestratorApp()
    app.mainloop()

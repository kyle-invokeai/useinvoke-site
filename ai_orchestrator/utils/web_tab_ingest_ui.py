import tkinter as tk
from tkinter import ttk, messagebox
from ai_orchestrator.utils import web_tab_collector, web_tab_storage
import os

class WebTabIngestPanel(tk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent, bg="#f0f0f0")
        self.app = app
        self.tabs = []
        self._build_ui()

    def _build_ui(self):
        tk.Label(self, text="Web Tab Ingest", font=("Segoe UI", 14, "bold"), bg="#f0f0f0").pack(anchor="w", pady=(10, 0))
        main = tk.Frame(self, bg="#f0f0f0")
        main.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        import_btn = tk.Button(main, text="\U0001F4E5 Import Open Tabs", command=self.import_tabs)
        import_btn.pack(anchor="w", pady=(0, 10))
        self.table = ttk.Treeview(main, columns=("title", "url", "favicon"), show="headings", height=8)
        self.table.heading("title", text="Tab Title")
        self.table.heading("url", text="URL")
        self.table.heading("favicon", text="Favicon")
        self.table.column("title", width=220)
        self.table.column("url", width=320)
        self.table.column("favicon", width=80)
        self.table.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        send_btn = tk.Button(main, text="\U0001F9E0 Send to Agent Space", command=self.send_to_agent)
        send_btn.pack(anchor="e", pady=4)

    def import_tabs(self):
        try:
            tabs = web_tab_collector.get_open_tabs()
            if not tabs:
                messagebox.showinfo("No Tabs", "No open browser tabs found.")
                return
            self.tabs = tabs
            self.refresh_table()
            web_tab_storage.save_tabs(tabs)
            self.app.log_dev(f"Imported {len(tabs)} tabs. Saved to {web_tab_storage.TABS_PATH}")
        except Exception as e:
            self.app.log_dev(f"Tab import failed: {e}")
            messagebox.showerror("Import Failed", f"Failed to import tabs: {e}")

    def refresh_table(self):
        self.table.delete(*self.table.get_children())
        for tab in self.tabs:
            self.table.insert("", "end", values=(tab.get("title", ""), tab.get("url", ""), tab.get("favicon", "")))

    def send_to_agent(self):
        if not self.tabs:
            messagebox.showinfo("No Tabs", "No tabs to send.")
            return
        payload = {
            "agent": "link_recommender",
            "input": {"tabs": self.tabs}
        }
        self.app.log_dev(f"Tabs sent to AgentSpace: {payload}")
        messagebox.showinfo("Sent", "Tabs sent to Agent Space (simulated).")
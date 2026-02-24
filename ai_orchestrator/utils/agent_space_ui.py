import tkinter as tk
from tkinter import ttk, messagebox
import json
import csv
import pyperclip
import threading
import time
from utils.summary_exporter import show_summary_results
from utils.web_tab_storage import load_recent_tabs
from agents.summary.summarize_agent import TabSummarizerAgent
from agents.task_runner_agent import AirtableClient, TaskRunnerAgent
import os

class AgentSpacePanel(tk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent, bg="#f8faff")
        self.app = app
        self.test_mode_var = tk.BooleanVar(value=True)  # Default to test mode
        tk.Label(self, text="AI Agent Space", font=("Segoe UI", 14, "bold"), bg="#f8faff").pack(anchor="w", pady=(10, 0))
        # Add Test/Live mode checkbox
        mode_frame = tk.Frame(self, bg="#f8faff")
        mode_frame.pack(anchor="w", pady=(0, 6))
        tk.Checkbutton(mode_frame, text="Test Mode", variable=self.test_mode_var, bg="#f8faff").pack(side=tk.LEFT)
        tk.Label(mode_frame, text="(Uncheck for Live Mode)", bg="#f8faff", fg="#888").pack(side=tk.LEFT, padx=(8,0))
        btn_frame = tk.Frame(self, bg="#f8faff")
        btn_frame.pack(anchor="w", pady=(10, 0))
        run_btn = tk.Button(btn_frame, text="Run Tab Summarizer", command=self.run_tab_summarizer)
        run_btn.pack(side=tk.LEFT, padx=4)
        run_task_btn = tk.Button(btn_frame, text="Run Selected Airtable Task", command=self.run_selected_airtable_task)
        run_task_btn.pack(side=tk.LEFT, padx=4)

    def display_tab_summaries(self, summaries):
        win = tk.Toplevel(self)
        win.title("Tab Summaries")
        win.geometry("700x400")
        frame = tk.Frame(win)
        frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        tree = ttk.Treeview(frame, columns=("summary", "value", "next_action"), show="headings")
        tree.heading("summary", text="Summary")
        tree.heading("value", text="Value")
        tree.heading("next_action", text="Next Action")
        tree.column("summary", width=320)
        tree.column("value", width=180)
        tree.column("next_action", width=180)
        tree.pack(fill=tk.BOTH, expand=True)
        for s in summaries:
            tree.insert("", "end", values=(s["summary"], s["value"], s["next_action"]))
        def copy_to_clipboard():
            text = "\n".join([f"{s['summary']} | {s['value']} | {s['next_action']}" for s in summaries])
            pyperclip.copy(text)
            messagebox.showinfo("Copied", "Summaries copied to clipboard.")
        def save_as_csv():
            from tkinter.filedialog import asksaveasfilename
            path = asksaveasfilename(defaultextension=".csv", filetypes=[("CSV Files", "*.csv")])
            if path:
                with open(path, "w", newline='', encoding="utf-8") as f:
                    writer = csv.DictWriter(f, fieldnames=["summary", "value", "next_action"])
                    writer.writeheader()
                    writer.writerows(summaries)
                messagebox.showinfo("Saved", f"Summaries saved to {path}")
        btn_frame = tk.Frame(win)
        btn_frame.pack(fill=tk.X, pady=6)
        tk.Button(btn_frame, text="Copy to Clipboard", command=copy_to_clipboard).pack(side=tk.LEFT, padx=4)
        tk.Button(btn_frame, text="Save as CSV", command=save_as_csv).pack(side=tk.LEFT, padx=4)

    def run_tab_summarizer(self):
        tabs = load_recent_tabs()
        if not tabs:
            messagebox.showinfo("No Tabs", "No tabs found in cache.")
            return
        agent = TabSummarizerAgent()
        summaries = agent.summarize_tabs(tabs)
        # Attach title to each summary for display
        for tab, summary in zip(tabs, summaries):
            summary["title"] = tab.get("title", "")
        show_summary_results(self, summaries)

    def run_selected_airtable_task(self):
        # Prompt for Airtable Task ID
        def on_submit():
            record_id = entry.get().strip()
            popup.destroy()
            if not record_id:
                messagebox.showinfo("No ID", "No Airtable Task ID entered.")
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
                client = AirtableClient(
                    api_token=os.getenv('AIRTABLE_API_TOKEN'),
                    base_id=os.getenv('AIRTABLE_BASE_ID'),
                    table_name=os.getenv('AIRTABLE_TABLE_TASKS', 'Tasks')
                )
                # Fetch the full task record by ID
                url = f"https://api.airtable.com/v0/{client.base_id}/{client.table_name}/{record_id}"
                resp = client.headers
                import requests
                resp = requests.get(url, headers=client.headers)
                resp.raise_for_status()
                task = resp.json()
                agent = TaskRunnerAgent(dry_run=False)
                agent.airtable = client
                agent.run_task(task)
                self.app.log_dev(f"Task {record_id} executed successfully.")
                messagebox.showinfo("Task Complete", f"Task {record_id} executed successfully.")
            except Exception as e:
                self.app.log_dev(f"Error running task: {e}")
                messagebox.showerror("Task Error", f"Error running task: {e}")
        threading.Thread(target=run, daemon=True).start()
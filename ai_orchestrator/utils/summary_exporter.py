import tkinter as tk
from tkinter import ttk, messagebox
import csv
import pyperclip

def show_summary_results(parent, summaries):
    win = tk.Toplevel(parent)
    win.title("Tab Summaries")
    win.geometry("900x500")
    win.resizable(True, True)
    frame = tk.Frame(win)
    frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
    columns = ("title", "summary", "value", "next_action")
    tree = ttk.Treeview(frame, columns=columns, show="headings")
    for col, width in zip(columns, [200, 350, 180, 180]):
        tree.heading(col, text=col.replace("_", " ").title())
        tree.column(col, width=width, anchor="w")
    tree.pack(fill=tk.BOTH, expand=True)
    vsb = ttk.Scrollbar(frame, orient="vertical", command=tree.yview)
    tree.configure(yscrollcommand=vsb.set)
    vsb.pack(side="right", fill="y")
    for s in summaries:
        tree.insert("", "end", values=(s.get("title", ""), s.get("summary", ""), s.get("value", ""), s.get("next_action", "")))
    def copy_all():
        text = "\n".join([
            f"{s.get('title','')} | {s.get('summary','')} | {s.get('value','')} | {s.get('next_action','')}" for s in summaries
        ])
        pyperclip.copy(text)
        messagebox.showinfo("Copied", "All summaries copied to clipboard.")
    def export_csv():
        from tkinter.filedialog import asksaveasfilename
        path = asksaveasfilename(defaultextension=".csv", filetypes=[("CSV Files", "*.csv")])
        if path:
            with open(path, "w", newline='', encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=columns)
                writer.writeheader()
                writer.writerows(summaries)
            messagebox.showinfo("Saved", f"Summaries saved to {path}")
    btn_frame = tk.Frame(win)
    btn_frame.pack(fill=tk.X, pady=6)
    tk.Button(btn_frame, text="Copy All to Clipboard", command=copy_all).pack(side=tk.LEFT, padx=4)
    tk.Button(btn_frame, text="Export to CSV", command=export_csv).pack(side=tk.LEFT, padx=4)

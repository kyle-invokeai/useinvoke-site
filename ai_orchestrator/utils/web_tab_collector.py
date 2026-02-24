import sys
import json
try:
    import win32com.client
except ImportError:
    win32com = None

def get_open_tabs():
    # Windows/Edge/Chrome fallback: Use pywin32 to scrape open browser windows (very basic, not robust)
    tabs = []
    if win32com is not None:
        shell = win32com.client.Dispatch("Shell.Application")
        for window in shell.Windows():
            url = str(window.LocationURL)
            title = str(window.LocationName)
            if url.startswith("http"):
                tabs.append({"title": title, "url": url, "favicon": ""})
    # Fallback: return a static example if nothing found
    if not tabs:
        tabs = [
            {"title": "ChatGPT", "url": "https://chat.openai.com", "favicon": "https://chat.openai.com/favicon.ico"},
            {"title": "GitHub", "url": "https://github.com", "favicon": "https://github.com/favicon.ico"}
        ]
    return tabs

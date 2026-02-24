import json
import os
from datetime import datetime

LOG_FILE = os.path.join(os.path.dirname(__file__), 'sync_log.json')

def log_sync(table, file_path, record_count, status, error=None):
    entry = {
        'timestamp': datetime.now().isoformat(),
        'table': table,
        'file_path': file_path,
        'record_count': record_count,
        'status': status,
        'error': str(error) if error else None
    }
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            logs = json.load(f)
    else:
        logs = []
    logs.insert(0, entry)  # newest first
    with open(LOG_FILE, 'w', encoding='utf-8') as f:
        json.dump(logs, f, indent=2)

def get_recent_logs(limit=20):
    if not os.path.exists(LOG_FILE):
        return []
    with open(LOG_FILE, 'r', encoding='utf-8') as f:
        logs = json.load(f)
    return logs[:limit]

def get_previous_files():
    logs = get_recent_logs(100)
    seen = set()
    files = []
    for log in logs:
        fp = log['file_path']
        if fp and fp not in seen:
            files.append(fp)
            seen.add(fp)
    return files

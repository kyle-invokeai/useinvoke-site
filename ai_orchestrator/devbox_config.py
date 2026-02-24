import json
import os

def get_config():
    config_path = os.path.join(os.path.dirname(__file__), '..', 'devbox.config.json')
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

"""
Launcher script for AI Agent Orchestrator Web Interface
"""

import sys
import os
import traceback
from pathlib import Path
import uvicorn

# Add parent directory to path
parent_dir = str(Path(__file__).resolve().parent.parent)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

if __name__ == "__main__":
    print("="*50)
    print("Starting AI Agent Orchestrator Web Interface...")
    print("Python version:", sys.version)
    print("Parent directory added to path:", parent_dir)
    print("Current working directory:", os.getcwd())
    print("sys.path contains:")
    for p in sys.path:
        print(f"  - {p}")
    print("="*50)
    
    # Run the FastAPI app directly with Uvicorn
    try:
        # Force debug mode for more verbose output
        os.environ['DEBUG'] = 'True'
        
        uvicorn.run(
            "web_interface.main:app", 
            host="127.0.0.1",  # Using localhost instead of 0.0.0.0
            port=8000, 
            reload=True,
            log_level="debug"
        )
    except Exception as e:
        print(f"ERROR: Failed to start web server: {e}")
        print("Traceback:")
        traceback.print_exc()
        input("Press Enter to exit...")

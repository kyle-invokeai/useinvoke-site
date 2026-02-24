@echo off
echo Starting AI Agent Orchestrator Web Interface...
cd %~dp0
python -m web_interface.run

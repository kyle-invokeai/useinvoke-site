from utils.airtable_exporter import export_all_tables_and_metadata
from agents.airtable_logger.utils.milestone_updater import update_milestone_status

def orchestrator_agent(prompt):
    if "build orchestration router" in prompt.lower():
        # Mark the milestone as done in Airtable
        update_milestone_status("Build orchestration router", status="Done", done=True)
        return f"Orchestrator agent completed: {prompt}"
    return f"Orchestrator agent responding to: {prompt}"

def handle_airtable_export_command():
    """Orchestrator command to export all Airtable tables and metadata."""
    print("Starting Airtable export...")
    summary, metadata_csv, field_metadata_csv = export_all_tables_and_metadata()
    print(f"\nTable metadata exported to {metadata_csv}")
    print(f"Field metadata exported to {field_metadata_csv}")
    print("\nSummary Report:")
    for table_name, count, path in summary:
        print(f"- {table_name}: {count} records exported to {path}")
    return {
        'summary': summary,
        'table_metadata': metadata_csv,
        'field_metadata': field_metadata_csv
    }
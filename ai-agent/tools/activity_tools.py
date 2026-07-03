"""
search_activity_logs — ADMIN POLICE ONLY.

ActivityLog schema key fields:
  performedBy (ObjectId ref Police),
  action (enum — long list),
  targetType, targetId, details, metadata,
  metadata.performedBy (String — officer name),
  status, severity, category, createdAt
"""
from db.mongo import activity_logs
from tools.helpers import to_ist, get_date_filter


async def search_activity_logs(params: dict, is_admin: bool = False) -> list[dict] | str:
    if not is_admin:
        return "Access denied. This tool is available to Admin Police only."

    query: dict = {}

    # Officer name is stored as a string in metadata.performedBy
    if params.get("officer_name"):
        query["metadata.performedBy"] = {
            "$regex": params["officer_name"], "$options": "i"
        }

    # Action type — schema field is "action" not "actionType"
    if params.get("action_type"):
        query["action"] = {"$regex": params["action_type"], "$options": "i"}

    # Severity enum: low / medium / high / critical
    if params.get("severity"):
        query["severity"] = params["severity"]

    # Date filter
    df = get_date_filter(params.get("period"))
    if df:
        query["createdAt"] = {"$gte": df}

    # Exclude internal system noise
    query["action"] = {"$ne": "logging_failed"}

    limit = min(int(params.get("limit", 20)), 50)

    cursor = activity_logs().find(query).sort("createdAt", -1).limit(limit)
    results = []

    async for doc in cursor:
        # Officer name: try metadata.performedBy (string) first
        officer_name = (
            doc.get("metadata", {}).get("performedBy")
            or str(doc.get("performedBy", "System"))
        )

        results.append({
            "officer":     officer_name,
            "action":      doc.get("action", "N/A"),           # schema field is "action"
            "target_type": doc.get("targetType", "N/A"),
            "description": str(doc.get("details", {}) or "")[:80],
            "severity":    doc.get("severity", "medium"),
            "status":      doc.get("status", "success"),
            "category":    doc.get("category", "N/A"),
            "timestamp":   to_ist(doc.get("createdAt")),
        })

    return results if results else "No activity logs found matching those criteria."
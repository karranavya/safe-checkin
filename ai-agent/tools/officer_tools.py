"""
search_officers — returns sub-police officers within the requesting
officer's jurisdiction (their own team if admin, or their teammates if
sub-police — both resolve to the same admin's managedBy group).
"""
from bson import ObjectId
from db.mongo import police
from tools.helpers import to_ist


async def search_officers(
    params: dict,
    requesting_police_id: str | None = None,
    requesting_role: str | None = None,
) -> dict | str:

    if not requesting_police_id:
        return "Could not determine your officer identity."

    # Resolve which admin's team we're scoped to
    if requesting_role == "admin_police":
        admin_id = requesting_police_id
    else:
        requester_doc = await police().find_one({"_id": ObjectId(requesting_police_id)})
        if not requester_doc or not requester_doc.get("managedBy"):
            return "Could not determine your managing admin."
        admin_id = str(requester_doc["managedBy"])

    query: dict = {"managedBy": ObjectId(admin_id)}

    if params.get("active_only", True):
        query["isActive"] = True

    if params.get("name"):
        query["name"] = {"$regex": params["name"], "$options": "i"}

    cursor = police().find(query).sort("name", 1)
    results = []

    async for doc in cursor:
        results.append({
            "name":              doc.get("name", "Unknown"),
            "badge_number":      doc.get("badgeNumber", "N/A"),
            "rank":              doc.get("rank", "N/A"),
            "station":           doc.get("station", "N/A"),
            "is_active":         doc.get("isActive", True),
            "last_activity":     to_ist(doc.get("lastActivityAt")) if doc.get("lastActivityAt") else "N/A",
            "total_activities":  doc.get("totalActivities", 0),
        })

    return {
        "total_officers": len(results),
        "officers": results,
    } if results else "No officers found in this jurisdiction."
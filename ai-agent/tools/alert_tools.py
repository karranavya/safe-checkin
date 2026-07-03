"""
search_alerts — now jurisdiction-scoped for police callers.

Important: an explicit hotel_name lookup is ALSO checked against jurisdiction
membership. Without this check, an officer could bypass scoping just by
naming a specific hotel outside their zone.
"""
from db.mongo import alerts, hotels, guests
from tools.helpers import to_ist, get_date_filter, str_to_object_id
from tools.jurisdiction_utils import get_jurisdiction_hotel_ids


async def search_alerts(
    params: dict,
    hotel_id: str | None = None,
    is_police: bool = False,
    police_id: str | None = None,
    police_role: str | None = None,
) -> list[dict] | str:

    query: dict = {}

    if hotel_id:
        oid = str_to_object_id(hotel_id)
        query["hotelId"] = oid if oid else hotel_id

    if is_police:
        if params.get("hotel_name"):
            hotel_doc = await hotels().find_one(
                {"name": {"$regex": params["hotel_name"], "$options": "i"}}
            )
            if not hotel_doc:
                return f"No hotel found matching '{params['hotel_name']}'."

            # ⭐ Jurisdiction check even for an explicit named lookup
            if police_id:
                jurisdiction_ids = await get_jurisdiction_hotel_ids(police_id, police_role)
                if jurisdiction_ids is None:
                    return "Your jurisdiction has not been configured yet — no alerts to show."
                if hotel_doc["_id"] not in jurisdiction_ids:
                    return f"'{params['hotel_name']}' is outside your jurisdiction."

            query["hotelId"] = hotel_doc["_id"]

        elif police_id:
            # ⭐ No specific hotel named — default-scope to jurisdiction
            jurisdiction_ids = await get_jurisdiction_hotel_ids(police_id, police_role)
            if jurisdiction_ids is None:
                return "Your jurisdiction has not been configured yet — no alerts to show."
            query["hotelId"] = {"$in": jurisdiction_ids}

    status = params.get("status", "all")
    if status and status != "all":
        query["status"] = status

    priority = params.get("priority", "all")
    if priority and priority != "all":
        query["priority"] = priority

    alert_type = params.get("type", "all")
    if alert_type and alert_type != "all":
        query["type"] = alert_type

    df = get_date_filter(params.get("period"))
    if df:
        query["createdAt"] = {"$gte": df}

    limit = min(int(params.get("limit", 10)), 25)

    cursor = alerts().find(query).sort("createdAt", -1).limit(limit)
    results = []

    async for doc in cursor:
        room = doc.get("location", {}).get("roomNumber", "N/A")

        row = {
            "status":      doc.get("status", "N/A"),
            "priority":    doc.get("priority", "Medium"),
            "type":        doc.get("type", "N/A"),
            "title":       doc.get("title", "N/A"),
            "description": (doc.get("description") or "")[:120],
            "room":        room,
            "raised_at":   to_ist(doc.get("createdAt")),
        }

        if doc.get("guestId"):
            guest_doc = await guests().find_one(
                {"_id": doc["guestId"]}, {"name": 1}
            )
            if guest_doc:
                row["guest"] = guest_doc.get("name", "Unknown")

        if is_police and doc.get("hotelId"):
            hotel_doc = await hotels().find_one(
                {"_id": doc["hotelId"]}, {"name": 1}
            )
            row["hotel"] = hotel_doc.get("name", "Unknown Hotel") if hotel_doc else "Unknown Hotel"

        results.append(row)

    return results if results else "No alerts found in your jurisdiction matching those criteria."
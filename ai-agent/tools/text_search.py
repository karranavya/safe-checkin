"""
text_search — keyword search across alerts and guests.
Now jurisdiction-scoped for police callers.
"""
from db.mongo import alerts, guests, hotels
from tools.helpers import to_ist, mask_aadhaar
from tools.jurisdiction_utils import get_jurisdiction_hotel_ids


async def text_search(
    params: dict,
    is_police: bool = False,
    police_id: str | None = None,
    police_role: str | None = None,
) -> dict | str:
    query_text = params.get("query", "").strip()
    if not query_text:
        return "Please provide a search query."

    search_in = params.get("search_in", "all")
    results: dict = {}

    # ⭐ Resolve jurisdiction once, reuse for both alerts and guests
    jurisdiction_ids = None
    if is_police and police_id:
        jurisdiction_ids = await get_jurisdiction_hotel_ids(police_id, police_role)
        if jurisdiction_ids is None:
            return "Your jurisdiction has not been configured yet — nothing to search."

    jurisdiction_filter = {"hotelId": {"$in": jurisdiction_ids}} if jurisdiction_ids is not None else {}

    if search_in in ("alerts", "all"):
        try:
            cursor = (
                alerts()
                .find(
                    {"$text": {"$search": query_text}, **jurisdiction_filter},
                    {"score": {"$meta": "textScore"}},
                )
                .sort([("score", {"$meta": "textScore"})])
                .limit(10)
            )
        except Exception:
            rx = {"$regex": query_text, "$options": "i"}
            cursor = (
                alerts()
                .find({"$or": [{"description": rx}, {"title": rx}], **jurisdiction_filter})
                .sort("createdAt", -1)
                .limit(10)
            )

        alert_results = []
        async for doc in cursor:
            row = {
                "status":      doc.get("status", "N/A"),
                "priority":    doc.get("priority", "Medium"),
                "title":       doc.get("title", "N/A"),
                "description": (doc.get("description") or "")[:150],
                "room":        doc.get("location", {}).get("roomNumber", "N/A"),
                "raised_at":   to_ist(doc.get("createdAt")),
            }
            if doc.get("hotelId"):
                hotel_doc = await hotels().find_one(
                    {"_id": doc["hotelId"]}, {"name": 1}
                )
                row["hotel"] = hotel_doc.get("name", "Unknown") if hotel_doc else "Unknown"
            alert_results.append(row)

        results["alerts"] = alert_results if alert_results else "No matching alerts found in your jurisdiction."

    if search_in in ("guests", "all"):
        try:
            cursor = (
                guests()
                .find(
                    {"$text": {"$search": query_text}, **jurisdiction_filter},
                    {"score": {"$meta": "textScore"}},
                )
                .sort([("score", {"$meta": "textScore"})])
                .limit(10)
            )
        except Exception:
            rx = {"$regex": query_text, "$options": "i"}
            cursor = (
                guests()
                .find({"$or": [{"name": rx}, {"nationality": rx}], **jurisdiction_filter})
                .sort("checkInTime", -1)
                .limit(10)
            )

        guest_results = []
        async for doc in cursor:
            aadhaar_display = "N/A"
            for g in doc.get("guests", []):
                if g.get("isPrimary") or True:
                    if g.get("idNumber"):
                        aadhaar_display = mask_aadhaar(g["idNumber"])
                    break

            row = {
                "name":        doc.get("name", "Unknown"),
                "room":        doc.get("roomNumber", "N/A"),
                "status":      doc.get("status", "N/A"),
                "nationality": doc.get("nationality", "N/A"),
                "aadhaar":     aadhaar_display,
                "checked_in":  to_ist(doc.get("checkInTime")),
            }
            if is_police and doc.get("hotelId"):
                hotel_doc = await hotels().find_one(
                    {"_id": doc["hotelId"]}, {"name": 1}
                )
                row["hotel"] = hotel_doc.get("name", "Unknown") if hotel_doc else "Unknown"
            guest_results.append(row)

        results["guests"] = guest_results if guest_results else "No matching guests found in your jurisdiction."

    return results if results else "Nothing found."
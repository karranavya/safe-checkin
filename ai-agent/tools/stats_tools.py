"""
get_stats and get_top_hotels_by_alerts — both now jurisdiction-scoped
for police callers.
"""
import asyncio
from db.mongo import guests, alerts, hotels
from tools.helpers import get_date_filter, str_to_object_id
from tools.jurisdiction_utils import get_jurisdiction_hotel_ids


async def get_stats(
    params: dict,
    hotel_id: str | None = None,
    is_police: bool = False,
    police_id: str | None = None,
    police_role: str | None = None,
) -> dict:

    period = params.get("period", "all")
    df = get_date_filter(period)

    hotel_filter: dict = {}
    jurisdiction_ids: list | None = None

    if hotel_id:
        oid = str_to_object_id(hotel_id)
        hotel_filter["hotelId"] = oid if oid else hotel_id

    if is_police:
        if params.get("hotel_name"):
            hotel_doc = await hotels().find_one(
                {"name": {"$regex": params["hotel_name"], "$options": "i"}}
            )
            if hotel_doc:
                if police_id:
                    jurisdiction_ids = await get_jurisdiction_hotel_ids(police_id, police_role)
                    if jurisdiction_ids is None:
                        return {"error": "Your jurisdiction has not been configured yet."}
                    if hotel_doc["_id"] not in jurisdiction_ids:
                        return {"error": f"'{params['hotel_name']}' is outside your jurisdiction."}
                hotel_filter["hotelId"] = hotel_doc["_id"]
        elif police_id:
            jurisdiction_ids = await get_jurisdiction_hotel_ids(police_id, police_role)
            if jurisdiction_ids is None:
                return {"error": "Your jurisdiction has not been configured yet."}
            hotel_filter["hotelId"] = {"$in": jurisdiction_ids}

    date_q = {"checkInTime": {"$gte": df}} if df else {}

    (
        total_guests,
        checked_in,
        checked_out,
        flagged,
        pending_alerts,
        total_alerts,
    ) = await asyncio.gather(
        guests().count_documents({**hotel_filter, **date_q}),
        guests().count_documents({**hotel_filter, "status": "checked-in"}),
        guests().count_documents({**hotel_filter, "status": "checked-out", **date_q}),
        guests().count_documents({**hotel_filter, "status": {"$in": ["flagged", "reported"]}}),
        alerts().count_documents({**hotel_filter, "status": "Pending",
                                   **({"createdAt": {"$gte": df}} if df else {})}),
        alerts().count_documents({**hotel_filter,
                                   **({"createdAt": {"$gte": df}} if df else {})}),
    )

    result = {
        "period":                  period,
        "total_guests_ever":       total_guests,
        "currently_checked_in":    checked_in,
        "checked_out":             checked_out,
        "flagged_or_reported":     flagged,
        "pending_alerts":          pending_alerts,
        "total_alerts":            total_alerts,
    }

    if is_police:
        if police_id:
            # Already resolved above if no specific hotel was named; resolve
            # fresh here only if we haven't yet (e.g. a hotel_name path was taken)
            if jurisdiction_ids is None:
                jurisdiction_ids = await get_jurisdiction_hotel_ids(police_id, police_role)
            result["registered_hotels"] = len(jurisdiction_ids) if jurisdiction_ids is not None else 0
        else:
            result["registered_hotels"] = await hotels().count_documents({})

    return result


async def get_top_hotels_by_alerts(
    params: dict,
    police_id: str | None = None,
    police_role: str | None = None,
) -> list[dict] | str:
    """
    Ranks hotels by alert count — jurisdiction-scoped for police callers.
    """
    limit = min(int(params.get("limit", 5)), 20)

    match_stage: dict = {}
    if police_id:
        jurisdiction_ids = await get_jurisdiction_hotel_ids(police_id, police_role)
        if jurisdiction_ids is None:
            return "Your jurisdiction has not been configured yet — no alert data to show."
        match_stage["hotelId"] = {"$in": jurisdiction_ids}

    pipeline = []
    if match_stage:
        pipeline.append({"$match": match_stage})
    pipeline += [
        {"$group": {"_id": "$hotelId", "alert_count": {"$sum": 1}}},
        {"$sort": {"alert_count": -1}},
        {"$limit": limit},
    ]

    results = []
    async for doc in alerts().aggregate(pipeline):
        hotel_doc = await hotels().find_one({"_id": doc["_id"]}, {"name": 1})
        results.append({
            "hotel":       hotel_doc.get("name", "Unknown Hotel") if hotel_doc else "Unknown Hotel",
            "alert_count": doc["alert_count"],
        })

    return results if results else "No alert data available in your jurisdiction."
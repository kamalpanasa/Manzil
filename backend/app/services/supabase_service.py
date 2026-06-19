import json
from typing import List, Optional

from app.dependencies import get_supabase_admin


def save_itinerary(
    user_id: str,
    source: Optional[str],
    destination: str,
    days: int,
    budget: float,
    interests: List[str],
    itinerary: List[dict],
) -> str:
    supabase = get_supabase_admin()

    total_cost = sum(float(day.get("estimated_cost", 0)) for day in itinerary)

    trip_result = (
        supabase.table("trips")
        .insert(
            {
                "user_id": user_id,
                "source": source,
                "destination": destination,
                "days": days,
                "budget": budget,
                "total_estimated_cost": total_cost,
                "interests": interests,
            }
        )
        .execute()
    )

    trip_id = trip_result.data[0]["id"]

    day_rows = []
    for day in itinerary:
        row = {
            "trip_id": trip_id,
            "day_number": day["day"],
            "title": day["title"],
            "location": day["location"],
            "description": day["description"],
            "start_time": day["start_time"],
            "estimated_cost": day["estimated_cost"],
        }
        activities = day.get("activities")
        if activities:
            row["activities"] = json.dumps(activities)
        day_rows.append(row)

    supabase.table("itinerary_days").insert(day_rows).execute()

    return trip_id


def _parse_day(d: dict) -> dict:
    activities_raw = d.get("activities")
    if isinstance(activities_raw, str):
        try:
            d["activities"] = json.loads(activities_raw)
        except Exception:
            d["activities"] = []
    elif not isinstance(activities_raw, list):
        d["activities"] = []
    return d


def get_latest_trip(user_id: str) -> Optional[dict]:
    supabase = get_supabase_admin()

    trip_result = (
        supabase.table("trips")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not trip_result.data:
        return None

    trip = trip_result.data[0]

    days_result = (
        supabase.table("itinerary_days")
        .select("*")
        .eq("trip_id", trip["id"])
        .order("day_number", desc=False)
        .execute()
    )

    trip["itinerary_days"] = [_parse_day(d) for d in days_result.data]
    return trip


def get_user_trips(user_id: str) -> List[dict]:
    supabase = get_supabase_admin()

    trips_result = (
        supabase.table("trips")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    trips = trips_result.data
    for trip in trips:
        days_result = (
            supabase.table("itinerary_days")
            .select("*")
            .eq("trip_id", trip["id"])
            .order("day_number", desc=False)
            .execute()
        )
        trip["itinerary_days"] = [_parse_day(d) for d in days_result.data]

    return trips


def update_trip_itinerary(user_id: str, trip_id: str, itinerary: List[dict]) -> dict:
    supabase = get_supabase_admin()

    trip_result = (
        supabase.table("trips")
        .select("*")
        .eq("id", trip_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not trip_result.data:
        raise ValueError("Trip not found or access denied")

    total_cost = sum(float(day.get("estimated_cost", 0)) for day in itinerary)
    num_days = len(itinerary)

    supabase.table("itinerary_days").delete().eq("trip_id", trip_id).execute()

    day_rows = []
    for day in itinerary:
        row = {
            "trip_id": trip_id,
            "day_number": day["day"],
            "title": day["title"],
            "location": day["location"],
            "description": day["description"],
            "start_time": day["start_time"],
            "estimated_cost": day["estimated_cost"],
        }
        activities = day.get("activities")
        if activities:
            row["activities"] = json.dumps(activities) if isinstance(activities, list) else activities
        day_rows.append(row)

    if day_rows:
        supabase.table("itinerary_days").insert(day_rows).execute()

    updated_trip_result = (
        supabase.table("trips")
        .update({"days": num_days, "total_estimated_cost": total_cost})
        .eq("id", trip_id)
        .execute()
    )

    trip = updated_trip_result.data[0]
    trip["itinerary_days"] = [_parse_day(d) for d in day_rows]
    return trip


def delete_trip(user_id: str, trip_id: str) -> None:
    supabase = get_supabase_admin()

    trip_result = (
        supabase.table("trips")
        .select("*")
        .eq("id", trip_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not trip_result.data:
        raise ValueError("Trip not found or access denied")

    supabase.table("trips").delete().eq("id", trip_id).execute()


def get_profile_stats(user_id: str) -> dict:
    supabase = get_supabase_admin()

    trips_result = (
        supabase.table("trips")
        .select("days, total_estimated_cost")
        .eq("user_id", user_id)
        .execute()
    )

    trips_data = trips_result.data or []
    trips_planned = len(trips_data)
    total_days = sum(t.get("days", 0) for t in trips_data)
    total_budget = sum(float(t.get("total_estimated_cost", 0)) for t in trips_data)

    favorites_count = 0
    try:
        fav_result = (
            supabase.table("favorites")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        favorites_count = fav_result.count or 0
    except Exception:
        favorites_count = 0

    return {
        "trips_planned": trips_planned,
        "total_days": total_days,
        "total_budget_managed": total_budget,
        "favorites_count": favorites_count,
        "saved_trips": trips_planned,
    }

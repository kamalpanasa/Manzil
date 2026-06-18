from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.models.schemas import ItineraryRequest, ItineraryResponse, ItineraryDay, ItineraryActivity
from app.services.groq_service import generate_itinerary
from app.services.supabase_service import (
    save_itinerary,
    get_latest_trip,
    get_user_trips,
    update_trip_itinerary,
    delete_trip,
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/itinerary", tags=["itinerary"])


def _build_day(d: dict) -> ItineraryDay:
    activities_raw = d.get("activities") or []
    activities = []
    for a in activities_raw:
        if isinstance(a, dict):
            activities.append(ItineraryActivity(
                time=a.get("time", ""),
                period=a.get("period", ""),
                name=a.get("name", ""),
                description=a.get("description", ""),
                category=a.get("category"),
                cost=a.get("cost"),
            ))

    return ItineraryDay(
        day=d.get("day_number", d.get("day", 1)),
        title=d["title"],
        location=d["location"],
        description=d["description"],
        start_time=d["start_time"],
        estimated_cost=d["estimated_cost"],
        activities=activities,
    )


@router.post("/generate", response_model=ItineraryResponse)
async def generate(request: ItineraryRequest, user=Depends(get_current_user)):
    try:
        raw_days = generate_itinerary(
            source=request.source,
            destination=request.destination,
            days=request.days,
            budget=request.budget,
            interests=request.interests,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Groq request failed: {exc}",
        )

    total_cost = sum(float(d.get("estimated_cost", 0)) for d in raw_days)

    try:
        trip_id = save_itinerary(
            user_id=user.id,
            source=request.source,
            destination=request.destination,
            days=request.days,
            budget=request.budget if request.budget is not None else total_cost,
            interests=request.interests,
            itinerary=raw_days,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generated itinerary but failed to save it: {exc}",
        )

    return ItineraryResponse(
        trip_id=trip_id,
        source=request.source,
        destination=request.destination,
        days=request.days,
        budget=request.budget if request.budget is not None else total_cost,
        total_estimated_cost=total_cost,
        interests=request.interests,
        itinerary=[_build_day(d) for d in raw_days],
    )


@router.get("/latest", response_model=ItineraryResponse)
async def latest(user=Depends(get_current_user)):
    trip = get_latest_trip(user.id)
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No trips found")

    return ItineraryResponse(
        trip_id=trip["id"],
        source=trip.get("source"),
        destination=trip["destination"],
        days=trip["days"],
        budget=trip["budget"],
        total_estimated_cost=trip["total_estimated_cost"],
        interests=trip.get("interests") or [],
        itinerary=[_build_day(d) for d in trip["itinerary_days"]],
    )


@router.get("/list", response_model=List[ItineraryResponse])
async def list_trips(user=Depends(get_current_user)):
    trips = get_user_trips(user.id)
    out = []
    for trip in trips:
        out.append(ItineraryResponse(
            trip_id=trip["id"],
            source=trip.get("source"),
            destination=trip["destination"],
            days=trip["days"],
            budget=trip["budget"],
            total_estimated_cost=trip["total_estimated_cost"],
            interests=trip.get("interests") or [],
            itinerary=[_build_day(d) for d in trip["itinerary_days"]],
        ))
    return out


@router.put("/{trip_id}", response_model=ItineraryResponse)
async def update(trip_id: str, request: List[ItineraryDay], user=Depends(get_current_user)):
    try:
        updated_itinerary = [
            {
                "day": d.day,
                "title": d.title,
                "location": d.location,
                "description": d.description,
                "start_time": d.start_time,
                "estimated_cost": d.estimated_cost,
                "activities": [a.model_dump() for a in (d.activities or [])],
            }
            for d in request
        ]
        trip = update_trip_itinerary(user.id, trip_id, updated_itinerary)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update itinerary: {exc}",
        )

    return ItineraryResponse(
        trip_id=trip["id"],
        source=trip.get("source"),
        destination=trip["destination"],
        days=trip["days"],
        budget=trip["budget"],
        total_estimated_cost=trip["total_estimated_cost"],
        interests=trip.get("interests") or [],
        itinerary=[_build_day(d) for d in trip["itinerary_days"]],
    )


@router.delete("/{trip_id}")
async def delete(trip_id: str, user=Depends(get_current_user)):
    try:
        delete_trip(user.id, trip_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete trip: {exc}",
        )
    return {"status": "ok", "deleted_trip_id": trip_id}

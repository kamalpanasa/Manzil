from typing import List, Optional, Any
from pydantic import BaseModel, Field


class ItineraryActivity(BaseModel):
    time: str
    period: str
    name: str
    description: str
    category: Optional[str] = None
    cost: Optional[float] = None


class ItineraryRequest(BaseModel):
    source: Optional[str] = Field(default=None)
    destination: str = Field(..., min_length=1)
    days: int = Field(..., ge=1, le=30)
    budget: Optional[float] = Field(default=None)
    interests: List[str] = Field(default_factory=list)


class ItineraryDay(BaseModel):
    day: int
    title: str
    location: str
    description: str
    start_time: str
    estimated_cost: float
    activities: Optional[List[ItineraryActivity]] = Field(default_factory=list)


class ItineraryResponse(BaseModel):
    trip_id: str
    source: Optional[str] = None
    destination: str
    days: int
    budget: Optional[float] = None
    total_estimated_cost: float
    interests: List[str]
    itinerary: List[ItineraryDay]


class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    reply: ChatMessageOut


class ProfileStats(BaseModel):
    trips_planned: int
    total_days: int
    total_budget_managed: float
    favorites_count: int
    saved_trips: int

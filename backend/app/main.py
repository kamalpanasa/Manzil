from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import itinerary, chat, profile

app = FastAPI(title="Manzil Travel Planner API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(itinerary.router)
app.include_router(chat.router)
app.include_router(profile.router)


@app.get("/health")
async def health():
    return {"status": "ok"}

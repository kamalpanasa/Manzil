from fastapi import APIRouter, Depends

from app.models.schemas import ProfileStats
from app.services.supabase_service import get_profile_stats
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("/stats", response_model=ProfileStats)
async def profile_stats(user=Depends(get_current_user)):
    stats = get_profile_stats(user.id)
    return ProfileStats(**stats)

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.schemas import ChatRequest, ChatResponse, ChatMessageOut
from app.services.chat_service import send_message, get_history
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _serialize(row: dict) -> ChatMessageOut:
    return ChatMessageOut(
        id=row["id"],
        role=row["role"],
        content=row["content"],
        created_at=row["created_at"],
    )


@router.get("/history", response_model=List[ChatMessageOut])
async def history(user=Depends(get_current_user)):
    """Returns the user's full saved conversation, oldest first."""
    rows = get_history(user.id)
    return [_serialize(r) for r in rows]


@router.post("/send", response_model=ChatResponse)
async def send(request: ChatRequest, user=Depends(get_current_user)):
    """Saves the user's message, gets a travel-aware Groq reply, saves and returns it."""
    try:
        reply_row = send_message(user.id, request.message)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Groq request failed: {exc}"
        )

    return ChatResponse(reply=_serialize(reply_row))

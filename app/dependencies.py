from fastapi import Header, HTTPException, status
from supabase import create_client, Client

from app.config import settings

supabase_admin: Client | None = None
if settings.SUPABASE_URL and settings.SUPABASE_KEY:
    try:
        supabase_admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception as e:
        print(f"[Manzil] WARNING: Failed to initialize Supabase client: {e}")
else:
    print("[Manzil] WARNING: SUPABASE_URL or SUPABASE_KEY not set — database features disabled.")


async def get_current_user(authorization: str = Header(default=None)):
    """
    Validates the Supabase JWT from `Authorization: Bearer <token>`.
    Returns the authenticated user object or raises 401/503.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header",
        )

    if supabase_admin is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Backend not connected to Supabase. Set SUPABASE_URL and SUPABASE_KEY environment variables.",
        )

    token = authorization.split(" ", 1)[1]

    try:
        result = supabase_admin.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
        ) from exc

    user = getattr(result, "user", None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
        )

    return user


def get_supabase_admin() -> Client:
    if supabase_admin is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Backend not connected to Supabase. Set SUPABASE_URL and SUPABASE_KEY environment variables.",
        )
    return supabase_admin

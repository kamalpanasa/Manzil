from typing import List, Dict, Optional

from groq import Groq

from app.config import settings
from app.dependencies import get_supabase_admin

_client = Groq(api_key=settings.GROQ_API_KEY)

SYSTEM_PROMPT = (
    "You are Manzil's AI travel assistant. You help users plan trips, build itineraries, "
    "estimate budgets, suggest destinations, and answer travel-related questions such as "
    "visas, weather, safety, local culture, transport, and packing. "
    "Keep replies concise, friendly, and practical — use short paragraphs or bullet points "
    "where that helps readability. If the user asks about something unrelated to travel, "
    "politely steer the conversation back to how you can help plan their trip. "
    "Whenever you recommend a specific spot, accommodation, restaurant, or activity that the user can do, "
    "you MUST also provide a structured recommendation block in valid JSON format enclosed within a markdown code block labeled `json-recommendation`. "
    "This allows the UI to display it as an interactive card. The JSON MUST look like this:\n"
    "```json-recommendation\n"
    "{\n"
    "  \"type\": \"hotel\" | \"restaurant\" | \"activity\" | \"destination\",\n"
    "  \"title\": \"Name of the recommendation\",\n"
    "  \"location\": \"Location/City\",\n"
    "  \"cost\": estimated_cost_number,\n"
    "  \"description\": \"1-2 sentence description\"\n"
    "}\n"
    "```\n"
    "Provide only one json-recommendation block per message if possible, or up to two if comparing choices."
)

# How many previous turns to feed back to Groq for context. Keeps the prompt
# small while still giving the model real conversational memory.
HISTORY_LIMIT = 20


def get_history(user_id: str) -> List[Dict]:
    """Returns the user's full saved chat thread, oldest first."""
    supabase = get_supabase_admin()
    result = (
        supabase.table("chat_messages")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=False)
        .execute()
    )
    return result.data


def _save_message(user_id: str, role: str, content: str) -> Dict:
    supabase = get_supabase_admin()
    result = (
        supabase.table("chat_messages")
        .insert({"user_id": user_id, "role": role, "content": content})
        .execute()
    )
    return result.data[0]


def send_message(user_id: str, message: str, groq_key: Optional[str] = None) -> Dict:
    """
    Saves the user's message, asks Groq for a reply using recent
    conversation history as context, saves that reply, and returns it.
    """
    _save_message(user_id, "user", message)

    # Re-fetch so the just-saved user message is included, then trim to the
    # most recent N turns for context awareness without an unbounded prompt.
    recent = get_history(user_id)[-HISTORY_LIMIT:]

    # Fetch active trip context
    from app.services.supabase_service import get_latest_trip
    active_trip = None
    try:
        active_trip = get_latest_trip(user_id)
    except Exception:
        pass # Fallback if no tables exist yet or error

    trip_context = ""
    if active_trip:
        trip_context = (
            f"\n\nCURRENT TRIP CONTEXT:\n"
            f"The user has an active trip planned. Destination: {active_trip['destination']}. "
            f"Departure City: {active_trip.get('source') or 'unknown'}. "
            f"Duration: {active_trip['days']} days. Budget: {active_trip['budget']}. "
            f"Interests: {', '.join(active_trip.get('interests') or [])}.\n"
            f"Itinerary Days planned:\n"
        )
        for d in active_trip.get("itinerary_days", []):
            trip_context += f"- Day {d['day_number']}: {d['title']} (Location: {d['location']}, Cost: {d['estimated_cost']}, Description: {d['description']})\n"

    sys_content = SYSTEM_PROMPT
    if trip_context:
        sys_content += trip_context

    groq_messages = [{"role": "system", "content": sys_content}]
    for m in recent:
        groq_messages.append({"role": m["role"], "content": m["content"]})

    client = Groq(api_key=groq_key) if groq_key else _client
    completion = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=groq_messages,
        temperature=0.7,
        max_tokens=800,
    )

    reply_text = completion.choices[0].message.content
    return _save_message(user_id, "assistant", reply_text)


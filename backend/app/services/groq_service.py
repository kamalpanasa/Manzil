import json
from typing import List, Optional

from groq import Groq

from app.config import settings

_client = Groq(api_key=settings.GROQ_API_KEY)

SYSTEM_PROMPT = (
    "You are an expert travel planner with deep local knowledge of real-world destinations. "
    "You generate realistic, hyper-specific, time-aware itineraries using ONLY actual, verifiable "
    "attraction names, restaurant names, and landmarks — NEVER placeholders like 'Local Museum', "
    "'Nearby Restaurant', 'Famous Temple', or any generic name. "
    "You respond with a single valid JSON object only — no markdown, no code fences, no commentary. "
    "Every day MUST have activities in all four periods: Morning (07:00–12:00), "
    "Afternoon (12:00–17:00), Evening (17:00–20:00), Night (20:00+). "
    "Minimum 5 activities per day; maximum 7. "
    "Group activities by geographic proximity to minimize unnecessary travel within a day. "
    "All costs are realistic, in INR, plain integers — no currency symbols."
)


def _budget_tier(budget: Optional[float], days: int) -> str:
    if not budget:
        return (
            "Budget: unspecified. Use mid-range estimates. "
            "Per activity cost: up to ₹500. Daily food budget: ₹800–₹1,200. "
            "Accommodation: mid-range (₹1,500–₹3,000/night)."
        )
    per_day = budget / days
    if per_day < 2500:
        return (
            f"BUDGET TIER: Budget traveler (total ₹{int(budget)}, ≈₹{int(per_day)}/day). "
            "Prioritize free/low-cost attractions, street food, shared transport, and hostels. "
            "Per activity cost ceiling: ₹200. Daily food budget: ₹300–₹500. "
            "Skip expensive ticketed attractions — use free public spaces, markets, viewpoints instead."
        )
    elif per_day < 6000:
        return (
            f"BUDGET TIER: Mid-range (total ₹{int(budget)}, ≈₹{int(per_day)}/day). "
            "Mix paid attractions with free ones. Include one sit-down restaurant per day. "
            "Per activity cost ceiling: ₹600. Daily food budget: ₹700–₹1,000. "
            "Use auto/cab for transport. Accommodation: ₹1,500–₹2,500/night."
        )
    else:
        return (
            f"BUDGET TIER: Premium (total ₹{int(budget)}, ≈₹{int(per_day)}/day). "
            "Include premium experiences, curated dining, guided tours, and comfortable transport. "
            "Per activity cost ceiling: ₹2,500. Daily food budget: ₹1,500–₹2,500. "
            "Accommodation: ₹4,000+/night. Suggest unique/exclusive experiences where possible."
        )


def _duration_strategy(days: int) -> str:
    if days <= 3:
        return (
            f"DURATION STRATEGY ({days}-day short trip): Focus on the destination's absolute must-see "
            "iconic highlights only — no niche or off-beat spots. Pack days tightly. "
            "Every activity slot must be a top-rated attraction. Start days early (07:00 AM)."
        )
    elif days <= 7:
        return (
            f"DURATION STRATEGY ({days}-day medium trip): Days 1–2 cover iconic highlights. "
            "Days 3+ progressively explore less-touristed neighbourhoods, local markets, day-trip villages, "
            "and hidden gems. Vary activity types across days — avoid repeating the same category "
            "two days in a row."
        )
    else:
        return (
            f"DURATION STRATEGY ({days}-day extended trip): Cover all major highlights in days 1–3. "
            "Days 4–7 explore distinct neighbourhoods, themed experiences (food trails, heritage walks, "
            "craft villages). Days 8+ include day trips to nearby towns, slow-travel experiences, "
            "cooking classes, local workshops. Each week should feel like a distinct chapter."
        )


def _interest_directives(interests: List[str]) -> str:
    mapping = {
        "adventure": "Include at least one outdoor adventure activity per day (trekking, water sports, cycling, rappelling, zip-lining, etc.).",
        "food": "Include 2 food-specific activities per day: one street-food stop (name the stall/market) and one sit-down meal at a named local restaurant. Name the must-try dish.",
        "culture": "Prioritize museums, heritage sites, temples, local festivals, and traditional art/craft experiences. Include cultural context in descriptions.",
        "history": "Each day must include at least one historical monument, fort, palace, or heritage site with a brief historical fact in the description.",
        "nature": "Prioritize national parks, wildlife sanctuaries, waterfalls, lakes, and scenic viewpoints. Include best time of day to visit each.",
        "shopping": "Include at least one local market, bazaar, or shopping district per day. Name the specific market and what it's known for (e.g. spices, textiles, handicrafts).",
        "nightlife": "Evening and Night slots must include vibrant local nightlife — live music venues, rooftop bars, night markets, or cultural performances. Name specific venues.",
        "wellness": "Include spa, yoga, Ayurveda, or meditation retreat experiences. Prefer morning wellness slots for yoga/meditation.",
        "photography": "Flag the top 2 photography spots per day with the best time of day for lighting. Use the category field as 'photography'.",
        "family": "All activities must be family-friendly and suitable for children. Avoid bars/nightlife. Include interactive museums, nature walks, and hands-on experiences.",
        "beach": "Prioritize beach activities — sunrise walks, water sports, beach shacks, snorkelling. Specify which exact beach by name.",
        "art": "Include galleries, street art districts, craft studios, and local artisan workshops. Name specific galleries or art spaces.",
        "religion": "Include temples, mosques, churches, gurudwaras, or monasteries relevant to the destination. Add visiting etiquette notes in descriptions.",
        "budget": "Maximize free or very low-cost activities. Mention free entry days/times for paid attractions. Prioritize self-guided walks over paid tours.",
        "relaxation": "Balance active sightseeing with leisure time. Include cafes, garden walks, scenic spots, and leisure activities. Avoid over-packing the schedule.",
        "solo": "Suggest solo-travel-friendly activities: walking tours, hostel common areas, solo dining spots, group tours, meetup activities.",
        "couple": "Include romantic spots: sunset viewpoints, candlelit restaurants, scenic boat rides, private tours, couple-friendly resorts.",
        "friends": "Include group-friendly activities: group tours, sports, nightlife, street food crawls, adventure sports.",
        "luxury": "Feature five-star hotels, Michelin-level restaurants, private tours, premium spa, helicopter rides, exclusive experiences.",
    }
    directives = []
    for interest in interests:
        key = interest.lower().strip()
        matched = False
        for k, v in mapping.items():
            if k in key:
                directives.append(f"- {v}")
                matched = True
                break
        if not matched and len(key) > 2:
            directives.append(f"- Incorporate '{interest}' themed activities where authentic local options genuinely exist.")
    return "\n".join(directives) if directives else "- Include a balanced mix of sightseeing, food, and local culture."


def _build_user_prompt(
    source: Optional[str], destination: str, days: int, budget: Optional[float], interests: List[str]
) -> str:
    source_text = f"The traveler departs from {source}. " if source else ""
    interest_text = ", ".join(interests) if interests else "general sightseeing, food, culture"

    return (
        f"Plan a detailed {days}-day trip to {destination}. {source_text}\n\n"
        f"TRAVELER INTERESTS: {interest_text}\n\n"
        f"{_budget_tier(budget, days)}\n\n"
        f"{_duration_strategy(days)}\n\n"
        "INTEREST-SPECIFIC RULES:\n"
        f"{_interest_directives(interests)}\n\n"
        "ABSOLUTE RULES (violations will be rejected):\n"
        "1. Every day MUST have activities in Morning, Afternoon, Evening, AND Night — all four periods.\n"
        "2. Minimum 5 activities per day; maximum 7.\n"
        "3. Use ONLY real, specific, named attractions (e.g. 'Baga Beach', 'Fort Aguada', 'Café Mondegar'). NEVER generic names.\n"
        "4. Within each day, sort activities by geographic proximity — cluster nearby places together to minimize travel time.\n"
        "5. Lunch (Afternoon) and Dinner (Night) food stops are MANDATORY each day — use real restaurant/dhaba/stall names.\n"
        "6. 'estimated_cost' per day = accommodation + food + transport + all activity costs combined (realistic total).\n"
        "7. Activity 'cost' must respect the per-activity budget ceiling specified above.\n"
        "8. Include travel tips in activity descriptions (best entry time, what to wear, what to order, etc.).\n\n"
        "Return ONLY a JSON object with exactly this shape:\n"
        "{\n"
        '  "categories": ["Category 1", "Category 2", "Category 3"],\n'
        '  "itinerary": [\n'
        "    {\n"
        '      "day": 1,\n'
        '      "title": "Vivid descriptive title reflecting the day\'s theme and key places",\n'
        '      "location": "Primary area/neighbourhood visited",\n'
        '      "description": "2-3 sentence overview of the full day arc including travel flow",\n'
        '      "start_time": "7:00 AM",\n'
        '      "estimated_cost": 3200,\n'
        '      "activities": [\n'
        '        {"time": "7:00 AM", "period": "Morning", "name": "Exact Real Attraction Name", "description": "Specific detail with tip", "category": "sightseeing", "cost": 0},\n'
        '        {"time": "9:30 AM", "period": "Morning", "name": "Second Nearby Attraction", "description": "Specific detail", "category": "culture", "cost": 150},\n'
        '        {"time": "12:30 PM", "period": "Afternoon", "name": "Named Local Restaurant", "description": "Must-try dish here and why", "category": "food", "cost": 400},\n'
        '        {"time": "2:30 PM", "period": "Afternoon", "name": "Afternoon Attraction", "description": "Specific detail with tip", "category": "sightseeing", "cost": 200},\n'
        '        {"time": "6:00 PM", "period": "Evening", "name": "Evening Viewpoint or Activity", "description": "Specific detail", "category": "leisure", "cost": 100},\n'
        '        {"time": "8:30 PM", "period": "Night", "name": "Dinner Restaurant Name", "description": "Must-try dish and ambiance", "category": "food", "cost": 600}\n'
        "      ]\n"
        "    }\n"
        "  ]\n"
        "}\n\n"
        f"The 'itinerary' array must contain exactly {days} day entries, ordered day 1 through {days}. "
        "All costs are plain integers in INR — no symbols, no strings."
    )


def generate_itinerary(
    source: Optional[str],
    destination: str,
    days: int,
    budget: Optional[float],
    interests: List[str],
    groq_key: Optional[str] = None,
) -> List[dict]:
    client = Groq(api_key=groq_key) if groq_key else _client
    completion = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": _build_user_prompt(source, destination, days, budget, interests),
            },
        ],
        temperature=0.2,
        max_tokens=8000,
        response_format={"type": "json_object"},
    )

    raw = completion.choices[0].message.content

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Groq returned invalid JSON: {exc}") from exc

    itinerary = parsed.get("itinerary")
    if not isinstance(itinerary, list) or len(itinerary) == 0:
        raise ValueError("Groq response missing a non-empty 'itinerary' array")

    required_keys = {"day", "title", "location", "description", "start_time", "estimated_cost"}
    period_order = {"Morning": 0, "Afternoon": 1, "Evening": 2, "Night": 3}

    for entry in itinerary:
        if not required_keys.issubset(entry.keys()):
            raise ValueError(f"Groq itinerary entry missing required fields: {entry}")
        activities = entry.get("activities") or []
        activities.sort(key=lambda a: period_order.get(a.get("period", ""), 99))
        entry["activities"] = activities

    return itinerary

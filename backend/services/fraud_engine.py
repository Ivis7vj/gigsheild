"""
Advanced Fraud Detection Engine for GigShield
Implements multi-signal fraud detection:
1. GPS Spoofing Detection (impossible travel, coordinate clustering, location validation)
2. Weather Verification (Open-Meteo historical API)
3. Behavioral Anomaly Detection (pattern analysis, claim bursts)
"""
import os
import httpx
from datetime import datetime, timedelta
from database import workers_collection, claims_collection
import math

# India bounding box for basic location validation
INDIA_BOUNDS = {
    "min_lat": 6.0, "max_lat": 37.0,
    "min_lon": 68.0, "max_lon": 98.0
}

# Known water body bounding boxes (simplified for demo)
WATER_BODIES = [
    {"name": "Arabian Sea", "min_lat": 8.0, "max_lat": 22.0, "min_lon": 68.0, "max_lon": 74.0},
    {"name": "Bay of Bengal", "min_lat": 8.0, "max_lat": 22.0, "min_lon": 80.0, "max_lon": 92.0},
]

# Highway corridors (simplified)
HIGHWAY_CORRIDORS = [
    {"name": "NH44 North-South", "min_lat": 12.0, "max_lat": 34.0, "min_lon": 76.0, "max_lon": 78.0},
]


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two GPS coordinates in kilometers."""
    R = 6371  # Earth's radius in km
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def is_in_bounds(lat, lon, bounds):
    """Check if coordinates fall within a bounding box."""
    return (bounds["min_lat"] <= lat <= bounds["max_lat"] and
            bounds["min_lon"] <= lon <= bounds["max_lon"])


def is_in_water_body(lat, lon):
    """Check if coordinates fall in a known water body."""
    for water in WATER_BODIES:
        if is_in_bounds(lat, lon, water):
            return True, water["name"]
    return False, None


def is_on_highway(lat, lon):
    """Check if coordinates fall on a known highway corridor."""
    for highway in HIGHWAY_CORRIDORS:
        if is_in_bounds(lat, lon, highway):
            return True, highway["name"]
    return False, None


async def detect_gps_spoofing(worker_id: str, new_lat: float, new_lon: float, timestamp: datetime) -> dict:
    """
    GPS Spoofing Detection:
    1. Impossible travel speed check
    2. Coordinate clustering detection
    3. Water body/highway location check
    """
    score = 0
    factors = []

    # Basic bounds check - must be in India
    if not is_in_bounds(new_lat, new_lon, INDIA_BOUNDS):
        score += 40
        factors.append("GPS coordinates outside India boundaries (+40)")
        return {"score": score, "factors": factors, "gps_verified": False}

    # Check if in water body
    in_water, water_name = is_in_water_body(new_lat, new_lon)
    if in_water:
        score += 35
        factors.append(f"Coordinates in {water_name} (+35)")

    # Check if on highway (suspicious for stationary claims)
    on_highway, highway_name = is_on_highway(new_lat, new_lon)
    if on_highway:
        score += 15
        factors.append(f"Coordinates on {highway_name} corridor (+15)")

    # Get worker's last 5 claims for pattern analysis
    recent_claims = await claims_collection.find(
        {"worker_id": worker_id}
    ).sort("triggered_at", -1).limit(5).to_list(length=5)

    if recent_claims:
        # Check for coordinate clustering (same exact location)
        exact_matches = 0
        for claim in recent_claims:
            claim_lat = claim.get("gps_lat")
            claim_lon = claim.get("gps_lon")
            if claim_lat and claim_lon:
                if abs(claim_lat - new_lat) < 0.0001 and abs(claim_lon - new_lon) < 0.0001:
                    exact_matches += 1

        if exact_matches >= 3:
            score += 30
            factors.append(f"Exact coordinate clustering ({exact_matches} identical locations) (+30)")

        # Impossible travel speed check
        last_claim = recent_claims[0]
        last_lat = last_claim.get("gps_lat")
        last_lon = last_claim.get("gps_lon")
        last_time = last_claim.get("triggered_at")

        if last_lat and last_lon and last_time:
            distance = haversine_distance(last_lat, last_lon, new_lat, new_lon)
            time_diff = (timestamp - last_time).total_seconds() / 3600  # hours

            if time_diff > 0:
                speed = distance / time_diff  # km/h
                if speed > 120:  # Impossible for delivery worker
                    score += 40
                    factors.append(f"Impossible travel speed: {speed:.0f} km/h (+40)")
                elif speed > 60:  # Suspicious but possible
                    score += 15
                    factors.append(f"High travel speed: {speed:.0f} km/h (+15)")

    gps_verified = score < 30
    return {
        "score": score,
        "factors": factors,
        "gps_verified": gps_verified,
        "gps_fraud_score": min(score, 100)
    }


async def verify_weather_claim(
    city: str,
    pincode: str,
    trigger_type: str,
    claim_timestamp: datetime
) -> dict:
    """
    Weather Verification using Open-Meteo Historical API.
    Cross-references claimed weather with actual historical data.

    Returns: VERIFIED, MISMATCH, or UNVERIFIABLE
    """
    # City coordinates for Open-Meteo
    CITY_COORDS = {
        "Mumbai": {"lat": 19.0760, "lon": 72.8777},
        "Delhi": {"lat": 28.7041, "lon": 77.1025},
        "Bengaluru": {"lat": 12.9716, "lon": 77.5946},
        "Chennai": {"lat": 13.0827, "lon": 80.2707},
        "Hyderabad": {"lat": 17.3850, "lon": 78.4867},
    }

    coords = CITY_COORDS.get(city)
    if not coords:
        return {"result": "UNVERIFIABLE", "reason": "City not in database", "confidence": 0}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Fetch historical weather data from Open-Meteo
            start_date = claim_timestamp.strftime("%Y-%m-%d")
            end_date = start_date

            resp = await client.get(
                "https://archive-api.open-meteo.com/v1/archive",
                params={
                    "latitude": coords["lat"],
                    "longitude": coords["lon"],
                    "start_date": start_date,
                    "end_date": end_date,
                    "daily": "precipitation_sum,rain_sum,showers_sum",
                    "timezone": "Asia/Kolkata"
                }
            )

            if resp.status_code != 200:
                return {"result": "UNVERIFIABLE", "reason": f"API error: {resp.status_code}", "confidence": 0}

            data = resp.json()
            daily = data.get("daily", {})
            precip_sum = daily.get("precipitation_sum", [0])[0] if daily.get("precipitation_sum") else 0
            rain_sum = daily.get("rain_sum", [0])[0] if daily.get("rain_sum") else 0
            showers_sum = daily.get("showers_sum", [0])[0] if daily.get("showers_sum") else 0

            total_precip = precip_sum + rain_sum + showers_sum

            # Verify based on trigger type
            if trigger_type in ["Heavy Rainfall", "Severe Weather Alert"]:
                if total_precip > 20:  # mm
                    return {
                        "result": "VERIFIED",
                        "reason": f"High precipitation recorded: {total_precip:.1f}mm",
                        "confidence": 0.9,
                        "precipitation_mm": round(total_precip, 1)
                    }
                elif total_precip > 5:
                    return {
                        "result": "VERIFIED",
                        "reason": f"Moderate precipitation recorded: {total_precip:.1f}mm",
                        "confidence": 0.7,
                        "precipitation_mm": round(total_precip, 1)
                    }
                else:
                    return {
                        "result": "MISMATCH",
                        "reason": f"Low precipitation: {total_precip:.1f}mm (claimed heavy rain)",
                        "confidence": 0.85,
                        "precipitation_mm": round(total_precip, 1)
                    }

            elif trigger_type == "Extreme Heat":
                # Fetch temperature data
                temp_resp = await client.get(
                    "https://archive-api.open-meteo.com/v1/archive",
                    params={
                        "latitude": coords["lat"],
                        "longitude": coords["lon"],
                        "start_date": start_date,
                        "end_date": end_date,
                        "daily": "temperature_2m_max",
                        "timezone": "Asia/Kolkata"
                    }
                )

                if temp_resp.status_code == 200:
                    temp_data = temp_resp.json()
                    max_temp = temp_data.get("daily", {}).get("temperature_2m_max", [0])[0] if temp_data.get("daily") else 0

                    if max_temp > 42:
                        return {
                            "result": "VERIFIED",
                            "reason": f"Extreme temperature recorded: {max_temp:.1f}°C",
                            "confidence": 0.9,
                            "max_temperature_c": round(max_temp, 1)
                        }
                    else:
                        return {
                            "result": "MISMATCH",
                            "reason": f"Normal temperature: {max_temp:.1f}°C (claimed extreme heat)",
                            "confidence": 0.85,
                            "max_temperature_c": round(max_temp, 1)
                        }

            return {
                "result": "UNVERIFIABLE",
                "reason": "No matching weather pattern found",
                "confidence": 0.5
            }

    except httpx.TimeoutException:
        return {"result": "UNVERIFIABLE", "reason": "API timeout", "confidence": 0}
    except Exception as e:
        print(f"Weather verification error: {e}")
        return {"result": "UNVERIFIABLE", "reason": f"Error: {str(e)}", "confidence": 0}


async def detect_behavioral_anomalies(worker_id: str, claim_timestamp: datetime) -> dict:
    """
    Behavioral Anomaly Detection:
    1. Same day-of-week pattern (too regular = suspicious)
    2. Maximum amount claims (always claiming cap)
    3. Claim bursts (>3 claims in 7 days)
    """
    score = 0
    factors = []

    # Get all historical claims for this worker
    all_claims = await claims_collection.find(
        {"worker_id": worker_id}
    ).sort("triggered_at", -1).to_list(length=100)

    if not all_claims:
        return {"score": 0, "factors": [], "behavioral_risk": "LOW"}

    # 1. Day-of-week pattern analysis
    day_of_week_counts = {}
    for claim in all_claims:
        claim_date = claim.get("triggered_at")
        if claim_date:
            if isinstance(claim_date, datetime):
                dow = claim_date.weekday()
            else:
                dow = datetime.fromisoformat(str(claim_date)).weekday()
            day_of_week_counts[dow] = day_of_week_counts.get(dow, 0) + 1

    # Check if claims cluster on same day
    if day_of_week_counts:
        max_day_claims = max(day_of_week_counts.values())
        total_claims = len(all_claims)
        if max_day_claims >= 3 and max_day_claims / total_claims > 0.7:
            score += 25
            day_name = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][max(day_of_week_counts, key=day_of_week_counts.get)]
            factors.append(f"Same-day pattern: {max_day_claims}/{total_claims} claims on {day_name} (+25)")

    # 2. Maximum amount claims pattern
    payout_amounts = [c.get("payout_amount", 0) for c in all_claims if c.get("payout_amount")]
    if payout_amounts:
        max_amount = max(payout_amounts)
        max_amount_count = payout_amounts.count(max_amount)
        if max_amount_count >= 3 and max_amount_count / len(payout_amounts) > 0.6:
            score += 20
            factors.append(f"Max-amount pattern: {max_amount_count}/{len(payout_amounts)} claims at ₹{max_amount} (+20)")

    # 3. Claim burst detection (>3 claims in 7 days)
    seven_days_ago = claim_timestamp - timedelta(days=7)
    recent_claims = [
        c for c in all_claims
        if c.get("triggered_at") and c["triggered_at"] >= seven_days_ago
    ]

    if len(recent_claims) > 3:
        score += 35
        factors.append(f"Claim burst: {len(recent_claims)} claims in 7 days (+35)")
    elif len(recent_claims) > 2:
        score += 15
        factors.append(f"Elevated frequency: {len(recent_claims)} claims in 7 days (+15)")

    # 4. Claim frequency overall
    if len(all_claims) > 10:
        score += 10
        factors.append(f"High lifetime claims: {len(all_claims)} total (+10)")

    behavioral_risk = "LOW"
    if score >= 40:
        behavioral_risk = "HIGH"
    elif score >= 20:
        behavioral_risk = "MEDIUM"

    return {
        "score": score,
        "factors": factors,
        "behavioral_risk": behavioral_risk,
        "total_historical_claims": len(all_claims)
    }


async def calculate_fraud_score(
    worker_id: str,
    triggered_zone: str,
    trigger_type: str,
    gps_lat: float = None,
    gps_lon: float = None,
    claim_timestamp: datetime = None
) -> dict:
    """
    Comprehensive Fraud Risk Scoring.
    Combines GPS, weather, and behavioral signals into weighted score.

    Returns fraud_score (0-100) and detailed factors.
    """
    if claim_timestamp is None:
        claim_timestamp = datetime.utcnow()

    all_factors = []
    gps_score = 0
    weather_score = 0
    behavioral_score = 0

    # Get worker info
    worker = await workers_collection.find_one({"worker_id": worker_id})
    if not worker:
        return {
            "score": 100,
            "factors": ["Worker not found (Critical)"],
            "status": "Flagged",
            "gps_fraud_score": 100,
            "weather_verification": "UNVERIFIABLE",
            "behavioral_risk": "HIGH"
        }

    # 1. GPS Spoofing Detection (if coordinates provided)
    if gps_lat is not None and gps_lon is not None:
        gps_result = await detect_gps_spoofing(worker_id, gps_lat, gps_lon, claim_timestamp)
        gps_score = gps_result.get("gps_fraud_score", 0)
        all_factors.extend(gps_result.get("factors", []))

    # 2. Weather Verification (for weather-related triggers)
    weather_triggers = ["Heavy Rainfall", "Extreme Heat", "Severe Air Pollution", "Severe Weather Alert"]
    if trigger_type in weather_triggers:
        city = worker.get("city", "Mumbai")
        pincode = worker.get("pincode", "")
        weather_result = await verify_weather_claim(city, pincode, trigger_type, claim_timestamp)

        if weather_result["result"] == "MISMATCH":
            weather_score = 50
            all_factors.append(f"Weather MISMATCH: {weather_result['reason']} (+50)")
        elif weather_result["result"] == "VERIFIED":
            weather_score = 0
            all_factors.append(f"Weather VERIFIED: {weather_result['reason']}")
        else:
            weather_score = 10
            all_factors.append(f"Weather UNVERIFIABLE: {weather_result['reason']} (+10)")

    # 3. Behavioral Anomaly Detection
    behavioral_result = await detect_behavioral_anomalies(worker_id, claim_timestamp)
    behavioral_score = behavioral_result.get("score", 0)
    all_factors.extend(behavioral_result.get("factors", []))

    # 4. Original fraud signals (zone mismatch, new account, etc.)
    original_score = 0

    # New account risk
    created_at = worker.get("created_at")
    if created_at and (datetime.utcnow() - created_at) < timedelta(days=7):
        original_score += 30
        all_factors.append("New account risk (+30)")

    # Zone mismatch
    if worker.get("zone") != triggered_zone and triggered_zone != "All":
        original_score += 25
        all_factors.append("Operating zone mismatch (+25)")

    # Recent claims (7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_claims = await claims_collection.count_documents({
        "worker_id": worker_id,
        "triggered_at": {"$gte": seven_days_ago},
        "status": "Paid"
    })
    if recent_claims > 3:
        original_score += 20
        all_factors.append("Frequent recent payouts (+20)")

    # Shared UPI check
    upi_count = await workers_collection.count_documents({"upi_id": worker.get("upi_id")})
    if upi_count > 1:
        original_score += 15
        all_factors.append("Shared UPI ID detected (+15)")

    # Combine all scores with weights
    # GPS: 35%, Weather: 30%, Behavioral: 20%, Original: 15%
    final_score = (
        gps_score * 0.35 +
        weather_score * 0.30 +
        behavioral_score * 0.20 +
        original_score * 0.15
    )

    final_score = min(round(final_score), 100)

    # Determine status
    status = "Initiated"
    if final_score > 60:
        status = "Flagged"
    elif final_score > 40:
        status = "Review"

    return {
        "score": final_score,
        "factors": all_factors,
        "status": status,
        "gps_fraud_score": gps_score,
        "weather_verification": weather_result.get("result", "N/A") if trigger_type in weather_triggers else "N/A",
        "behavioral_risk": behavioral_result.get("behavioral_risk", "LOW"),
        "breakdown": {
            "gps": gps_score,
            "weather": weather_score,
            "behavioral": behavioral_score,
            "original": original_score
        }
    }

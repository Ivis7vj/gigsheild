import os
import httpx
from datetime import datetime
import json

OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")

# Hardcoded zone risks (Mocking the "Hyper-local ML adjustment")
ZONE_RISK_TABLE = {
    "Mumbai": {"Zone 1": "Flood-prone", "Zone 2": "Safe", "Zone 3": "Medium", "Zone 4": "Flood-prone", "Zone 5": "Safe"},
    "Delhi": {"Zone 1": "Safe", "Zone 2": "Medium", "Zone 3": "Safe", "Zone 4": "Medium", "Zone 5": "Safe"},
    "Bengaluru": {"Zone 1": "Medium", "Zone 2": "Flood-prone", "Zone 3": "Safe", "Zone 4": "Medium", "Zone 5": "Safe"},
    "Chennai": {"Zone 1": "Flood-prone", "Zone 2": "Medium", "Zone 3": "Flood-prone", "Zone 4": "Safe", "Zone 5": "Safe"},
    "Hyderabad": {"Zone 1": "Safe", "Zone 2": "Medium", "Zone 3": "Safe", "Zone 4": "Safe", "Zone 5": "Medium"},
}

CITY_COORDS = {
    "Mumbai": {"lat": 19.0760, "lon": 72.8777},
    "Delhi": {"lat": 28.7041, "lon": 77.1025},
    "Bengaluru": {"lat": 12.9716, "lon": 77.5946},
    "Chennai": {"lat": 13.0827, "lon": 80.2707},
    "Hyderabad": {"lat": 17.3850, "lon": 78.4867},
}

async def fetch_weather_risk(city: str) -> dict:
    if not OPENWEATHERMAP_API_KEY or OPENWEATHERMAP_API_KEY == "your_api_key_here":
        # Mock response mostly clear if no API key
        return {"factor": -0.04, "name": "Weather Discount (Clear)"}
    
    coords = CITY_COORDS.get(city, {"lat": 20.0, "lon": 77.0}) # default
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.openweathermap.org/data/2.5/forecast?lat={coords['lat']}&lon={coords['lon']}&appid={OPENWEATHERMAP_API_KEY}&units=metric"
            )
            resp.raise_for_status()
            data = resp.json()
            # check for extreme rain or heat
            max_temp = 0
            total_rain = 0
            for item in data.get("list", [])[:28]: # roughly 7 days
                if "main" in item and "temp_max" in item["main"]:
                    max_temp = max(max_temp, item["main"]["temp_max"])
                if "rain" in item and "3h" in item["rain"]:
                    total_rain += item["rain"]["3h"]
                    
            if total_rain > 40:
                return {"factor": 0.08, "name": "Heavy Rain Risk"}
            elif max_temp > 43:
                return {"factor": 0.05, "name": "Extreme Heat Risk"}
            else:
                return {"factor": -0.04, "name": "Clear Weather Discount"}
    except Exception as e:
        print(f"Weather fetch failed: {e}")
        return {"factor": 0, "name": "Weather Data Unavailable"}

async def fetch_aqi_risk(city: str) -> dict:
    if not OPENWEATHERMAP_API_KEY or OPENWEATHERMAP_API_KEY == "your_api_key_here":
        return {"factor": 0.0, "name": "AQI Data Unavailable"}
        
    coords = CITY_COORDS.get(city, {"lat": 20.0, "lon": 77.0})
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"http://api.openweathermap.org/data/2.5/air_pollution?lat={coords['lat']}&lon={coords['lon']}&appid={OPENWEATHERMAP_API_KEY}"
            )
            resp.raise_for_status()
            data = resp.json()
            aqi = data["list"][0]["main"]["aqi"]
            if aqi in [4, 5]:
                return {"factor": 0.10, "name": "Severe Pollution Risk"}
            elif aqi == 3:
                return {"factor": 0.03, "name": "Moderate Pollution Risk"}
            elif aqi in [1, 2]:
                return {"factor": -0.05, "name": "Good AQI Discount"}
            return {"factor": 0, "name": "AQI Neutral"}
    except Exception as e:
        print(f"AQI fetch failed: {e}")
        return {"factor": 0, "name": "AQI Data Unavailable"}

async def calculate_premium(worker: dict) -> dict:
    city = worker.get("city", "Mumbai")
    zone = worker.get("zone", "Zone 1")
    days_per_week = worker.get("days_per_week", 0)
    experience_years = worker.get("experience_years", 0)
    claims_count_30d = worker.get("claims_count_30d", 0)
    platform = worker.get("platform", "Delivery")
    
    # 0. Platform Risk Variance (Actuarial baseline)
    platform_risks = {
        "Delivery": 0.02,
        "Ride-hailing": 0.025, # Higher risk for passenger transport
        "Handyman": 0.015,
        "Other": 0.02
    }
    earnings = worker.get("weekly_earnings", 0)
    base_rate = platform_risks.get(platform, 0.02)
    base_premium = earnings * base_rate
    current_premium = base_premium
    factors = []
    
    # 1. Weather
    weather_data = await fetch_weather_risk(city)
    impact = base_premium * weather_data["factor"]
    current_premium += impact
    factors.append({"name": weather_data["name"], "impact": round(impact, 2), "type": "addition" if impact > 0 else "subtraction"})
    
    # 2. AQI
    aqi_data = await fetch_aqi_risk(city)
    impact = base_premium * aqi_data["factor"]
    current_premium += impact
    factors.append({"name": aqi_data["name"], "impact": round(impact, 2), "type": "addition" if impact > 0 else "subtraction"})
    
    # 3. Zone Risk
    zone_risk = ZONE_RISK_TABLE.get(city, {}).get(zone, "Medium")
    if zone_risk == "Flood-prone":
        impact = base_premium * 0.12
        current_premium += impact
        factors.append({"name": "Zone High Risk Surcharge", "impact": round(impact, 2), "type": "addition"})
    elif zone_risk == "Safe":
        impact = base_premium * -0.08
        current_premium += impact
        factors.append({"name": "Zone Safety Discount", "impact": round(impact, 2), "type": "subtraction"})
        
    # 4. Seasonal
    month = datetime.now().month
    if month in [6, 7, 8, 9]:
        impact = base_premium * 0.06
        current_premium += impact
        factors.append({"name": "Monsoon Risk Factor", "impact": round(impact, 2), "type": "addition"})
    elif month in [10, 11, 12, 1, 2]:
        impact = base_premium * -0.02
        current_premium += impact
        factors.append({"name": "Winter Discount", "impact": round(impact, 2), "type": "subtraction"})
    else:
        impact = base_premium * 0.04
        current_premium += impact
        factors.append({"name": "Summer Risk Factor", "impact": round(impact, 2), "type": "addition"})
        
    # 5. Platform Factor
    if days_per_week > 6:
        impact = base_premium * -0.03
        current_premium += impact
        factors.append({"name": "Loyalty Discount", "impact": round(impact, 2), "type": "subtraction"})
        
    if earnings > 6000:
        impact = base_premium * -0.02
        current_premium += impact
        factors.append({"name": "Premium Tier Discount", "impact": round(impact, 2), "type": "subtraction"})
        
    # 6. Experience Factor (Actuarial refinement)
    if experience_years >= 2:
        impact = base_premium * -0.05
        current_premium += impact
        factors.append({"name": "Professional Experience Discount", "impact": round(impact, 2), "type": "subtraction"})
    
    # 7. Claim History Penalty (Actuarial refinement)
    if claims_count_30d > 0:
        impact = base_premium * 0.15 * claims_count_30d
        current_premium += impact
        factors.append({"name": "Recent Claim History Surcharge", "impact": round(impact, 2), "type": "addition"})
        
    # Final clamping
    final_premium = round(current_premium)
    if final_premium < 49:
        final_premium = 49
    elif final_premium > 299:
        final_premium = 299
        
    return {
        "base_premium": round(base_premium, 2),
        "final_premium": final_premium,
        "factors": factors
    }

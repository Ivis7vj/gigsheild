from fastapi import APIRouter, Depends
from services.trigger_engine import check_triggers
from deps import get_current_worker
from datetime import datetime
import httpx

router = APIRouter()

# City coordinates for weather forecast
CITY_COORDS = {
    "Mumbai": {"lat": 19.0760, "lon": 72.8777},
    "Delhi": {"lat": 28.7041, "lon": 77.1025},
    "Bengaluru": {"lat": 12.9716, "lon": 77.5946},
    "Chennai": {"lat": 13.0827, "lon": 80.2707},
    "Hyderabad": {"lat": 17.3850, "lon": 78.4867},
}

@router.post("/run-all")
async def run_all_triggers():
    result = await check_triggers()
    return result


@router.get("/forecast")
async def get_weather_forecast(worker: dict = Depends(get_current_worker)):
    """
    Returns today's weather forecast for the worker's city/zone.
    Used by the Worker Dashboard to show proactive weather alert banners.
    Uses Open-Meteo free forecast API with fallback to mock data.
    """
    city = worker.get("city", "Mumbai")
    zone = worker.get("zone", "Zone 1")
    coords = CITY_COORDS.get(city, CITY_COORDS["Mumbai"])

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": coords["lat"],
                    "longitude": coords["lon"],
                    "daily": "precipitation_sum,temperature_2m_max,weathercode",
                    "timezone": "Asia/Kolkata",
                    "forecast_days": 1
                }
            )

            if resp.status_code == 200:
                data = resp.json()
                daily = data.get("daily", {})
                precip = (daily.get("precipitation_sum") or [0])[0]
                max_temp = (daily.get("temperature_2m_max") or [30])[0]
                weather_code = (daily.get("weathercode") or [0])[0]

                high_risk = False
                trigger_type = None
                severity = "low"

                # Heavy rain: precipitation > 15mm or weather codes 61-67, 80-82, 95-99
                if precip > 15 or weather_code in [61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]:
                    high_risk = True
                    trigger_type = "Heavy Rainfall"
                    severity = "high" if precip > 30 else "moderate"

                # Extreme heat: > 42°C
                elif max_temp > 42:
                    high_risk = True
                    trigger_type = "Extreme Heat"
                    severity = "high" if max_temp > 45 else "moderate"

                # Thunderstorm codes
                elif weather_code in [95, 96, 99]:
                    high_risk = True
                    trigger_type = "Severe Weather Alert"
                    severity = "high"

                return {
                    "high_risk_today": high_risk,
                    "trigger_type": trigger_type,
                    "severity": severity,
                    "city": city,
                    "zone": zone,
                    "precipitation_mm": precip,
                    "max_temperature_c": max_temp,
                    "weather_code": weather_code,
                    "forecast_date": datetime.utcnow().strftime("%Y-%m-%d")
                }

    except Exception as e:
        print(f"Weather forecast error: {e}")

    # Fallback mock response
    return {
        "high_risk_today": False,
        "trigger_type": None,
        "severity": "low",
        "city": city,
        "zone": zone,
        "precipitation_mm": 2.0,
        "max_temperature_c": 32,
        "weather_code": 1,
        "forecast_date": datetime.utcnow().strftime("%Y-%m-%d")
    }

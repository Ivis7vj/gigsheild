@echo off
cd /d "%~dp0backend"
echo Starting FastAPI Backend...
call .\venv\Scripts\activate.bat
python -m uvicorn main:app --port 8000 --reload
pause

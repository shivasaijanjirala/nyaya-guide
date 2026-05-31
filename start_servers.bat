@echo off
echo Starting NyayaGuide Backend Server...
start cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo Starting NyayaGuide Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo Both servers are starting! You can close this window.
echo The frontend will be available at http://localhost:3000

"""
NyayaGuide – FastAPI Main Application

WHY FastAPI?
- Async-first → great for AI/LLM calls and MongoDB
- Auto-generates OpenAPI docs at /docs
- Pydantic integration → request/response validation
- High performance (rivaling Go/Node.js)

This file:
1. Creates the FastAPI app
2. Configures CORS, rate limiting
3. Registers all API routers
4. Connects to MongoDB on startup
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.db.database import init_db
from app.api.auth_routes import router as auth_router
from app.api.user_routes import router as user_router
from app.api.chat_routes import router as chat_router
from app.api.resource_routes import (
    doc_router, notes_router, timeline_router,
    calendar_router, trends_router, admin_router,
)

# ── Rate Limiter ──
limiter = Limiter(key_func=get_remote_address)


# ── Lifespan: Connect to MongoDB on startup ──
@asynccontextmanager
async def lifespan(app):
    await init_db()
    yield


# ── Create App ──
app = FastAPI(
    title="NyayaGuide API",
    description="AI-Powered Indian Legal Assistant - Backend API",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Register Routers ──
# All routes are prefixed with /api
app.include_router(auth_router,     prefix="/api")
app.include_router(user_router,     prefix="/api")
app.include_router(chat_router,     prefix="/api")
app.include_router(doc_router,      prefix="/api")
app.include_router(notes_router,    prefix="/api")
app.include_router(timeline_router, prefix="/api")
app.include_router(calendar_router, prefix="/api")
app.include_router(trends_router,   prefix="/api")
app.include_router(admin_router,    prefix="/api")


# ── Health Check ──
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "NyayaGuide API", "version": "1.0.0"}

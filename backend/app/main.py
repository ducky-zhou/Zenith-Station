from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import ai, auth, comments, events, interactions, mcp, posts, profile, security_games, stats
from app.core.config import get_settings
from app.seed import ensure_seed_data


settings = get_settings()
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.validate_runtime_security()
    ensure_seed_data()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"ok": True, "app": settings.app_name, "environment": settings.environment}


@app.get("/api")
@app.get("/api/")
def api_index():
    return {
        "app": settings.app_name,
        "message": "API is running. Use the links below to explore available endpoints.",
        "docs": "/docs",
        "health": "/api/health",
        "posts": "/api/posts",
        "profile": "/api/profile",
        "security_games": "/api/security-games",
        "ai": "/api/ai/enabled",
        "mcp": "/api/mcp",
    }


app.include_router(auth.router, prefix="/api")
app.include_router(posts.router, prefix="/api")
app.include_router(comments.router, prefix="/api")
app.include_router(interactions.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(security_games.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(mcp.router, prefix="/api")

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, comments, events, interactions, posts, profile, security_games
from app.core.config import get_settings
from app.seed import ensure_seed_data


settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.validate_runtime_security()
    ensure_seed_data()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

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


app.include_router(auth.router, prefix="/api")
app.include_router(posts.router, prefix="/api")
app.include_router(comments.router, prefix="/api")
app.include_router(interactions.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(security_games.router, prefix="/api")

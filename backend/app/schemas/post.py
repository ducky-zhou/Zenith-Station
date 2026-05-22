from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.auth import UserRead


class PostBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    summary: str = Field(default="", max_length=500)
    content: str = Field(min_length=1)
    cover_url: str | None = Field(default=None, max_length=500)
    status: str = Field(default="published", pattern="^(draft|published)$")


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    summary: str | None = Field(default=None, max_length=500)
    content: str | None = Field(default=None, min_length=1)
    cover_url: str | None = Field(default=None, max_length=500)
    status: str | None = Field(default=None, pattern="^(draft|published)$")


class PostRead(BaseModel):
    id: int
    title: str
    summary: str
    content: str
    cover_url: str | None = None
    status: str
    author_id: int
    created_at: datetime
    updated_at: datetime
    likes_count: int = 0
    favorites_count: int = 0
    comments_count: int = 0

    model_config = {"from_attributes": True}


class PostDetail(PostRead):
    author: UserRead

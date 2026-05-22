from pydantic import BaseModel, EmailStr, Field


class ProfileRead(BaseModel):
    id: int
    name: str
    bio: str
    avatar_url: str | None = None
    interests: str = ""
    experiences: str = ""
    github_url: str | None = None
    email: EmailStr | None = None

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    bio: str | None = None
    avatar_url: str | None = Field(default=None, max_length=500)
    interests: str | None = None
    experiences: str | None = None
    github_url: str | None = Field(default=None, max_length=500)
    email: EmailStr | None = None

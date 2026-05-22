from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserRead(BaseModel):
    id: int
    username: str
    email: EmailStr
    avatar_url: str | None = None
    role: str

    model_config = {"from_attributes": True}


class TokenRead(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead

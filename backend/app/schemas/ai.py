from pydantic import BaseModel, Field


class AiStatusRead(BaseModel):
    enabled: bool
    provider: str = "deepseek"
    model: str


class AiSummaryRequest(BaseModel):
    text: str = Field(min_length=20, max_length=20000)
    style: str = Field(default="concise", max_length=50)


class AiPostSummaryRequest(BaseModel):
    post_id: int = Field(ge=1)
    style: str = Field(default="concise", max_length=50)


class AiDraftRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    keywords: list[str] = Field(default_factory=list, max_length=12)
    tone: str = Field(default="technical notebook", max_length=80)


class AiSecurityQuestionRequest(BaseModel):
    topic: str = Field(default="phishing", min_length=1, max_length=80)
    difficulty: str = Field(default="easy", pattern="^(easy|medium|hard)$")


class AiDigestRequest(BaseModel):
    source_text: str = Field(default="", max_length=20000)
    focus: str = Field(default="Web security and AI engineering", max_length=120)


class AiTextRead(BaseModel):
    provider: str = "deepseek"
    model: str
    text: str

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import ValidationError
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.api.posts import with_counts, with_counts_many
from app.db.session import get_db
from app.models import Comment, Event, Favorite, Like, Post, Profile, User
from app.schemas.post import PostCreate, PostUpdate
from app.services import deepseek


router = APIRouter(prefix="/mcp", tags=["mcp"])


def tool_schema(
    name: str,
    description: str,
    properties: dict[str, Any] | None = None,
    required: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "name": name,
        "description": description,
        "inputSchema": {
            "type": "object",
            "properties": properties or {},
            "required": required or [],
            "additionalProperties": False,
        },
    }


TOOLS = [
    tool_schema(
        "blog.profile.get",
        "Read the public profile shown on the blog.",
    ),
    tool_schema(
        "blog.posts.list",
        "List blog posts. Drafts require an admin token.",
        {
            "q": {"type": "string", "description": "Optional keyword search."},
            "include_drafts": {"type": "boolean", "default": False},
            "limit": {"type": "integer", "minimum": 1, "maximum": 50, "default": 10},
        },
    ),
    tool_schema(
        "blog.posts.get",
        "Read one blog post by id.",
        {"post_id": {"type": "integer", "minimum": 1}},
        ["post_id"],
    ),
    tool_schema(
        "blog.posts.create",
        "Create a blog post. Requires an admin token.",
        {
            "title": {"type": "string", "minLength": 1, "maxLength": 200},
            "summary": {"type": "string", "maxLength": 500, "default": ""},
            "content": {"type": "string", "minLength": 1},
            "cover_url": {"type": ["string", "null"], "maxLength": 500},
            "status": {"type": "string", "enum": ["draft", "published"], "default": "draft"},
        },
        ["title", "content"],
    ),
    tool_schema(
        "blog.posts.update",
        "Update a blog post. Requires an admin token.",
        {
            "post_id": {"type": "integer", "minimum": 1},
            "title": {"type": "string", "minLength": 1, "maxLength": 200},
            "summary": {"type": "string", "maxLength": 500},
            "content": {"type": "string", "minLength": 1},
            "cover_url": {"type": ["string", "null"], "maxLength": 500},
            "status": {"type": "string", "enum": ["draft", "published"]},
        },
        ["post_id"],
    ),
    tool_schema(
        "blog.posts.delete",
        "Delete a blog post. Requires an admin token.",
        {"post_id": {"type": "integer", "minimum": 1}},
        ["post_id"],
    ),
    tool_schema(
        "blog.stats.get",
        "Read blog analytics summary. Requires an admin token.",
    ),
    tool_schema(
        "blog.ai.summarize_text",
        "Summarize arbitrary text with DeepSeek. Requires an admin token.",
        {
            "text": {"type": "string", "minLength": 20, "maxLength": 20000},
            "style": {"type": "string", "default": "concise"},
        },
        ["text"],
    ),
    tool_schema(
        "blog.ai.summarize_post",
        "Summarize a blog post with DeepSeek. Requires an admin token.",
        {
            "post_id": {"type": "integer", "minimum": 1},
            "style": {"type": "string", "default": "concise"},
        },
        ["post_id"],
    ),
    tool_schema(
        "blog.ai.draft_post",
        "Draft a Markdown blog post with DeepSeek. Requires an admin token.",
        {
            "title": {"type": "string", "minLength": 1, "maxLength": 200},
            "keywords": {"type": "array", "items": {"type": "string"}, "default": []},
            "tone": {"type": "string", "default": "technical notebook"},
        },
        ["title"],
    ),
    tool_schema(
        "blog.ai.generate_security_question",
        "Generate a Security Lab challenge question with DeepSeek. Requires an admin token.",
        {
            "topic": {"type": "string", "default": "phishing"},
            "difficulty": {"type": "string", "enum": ["easy", "medium", "hard"], "default": "easy"},
        },
    ),
    tool_schema(
        "blog.ai.generate_digest",
        "Generate an AI automation digest with DeepSeek. Requires an admin token.",
        {
            "kind": {
                "type": "string",
                "enum": ["daily-news", "github-trending", "papers", "llm-security"],
                "default": "daily-news",
            },
            "source_text": {"type": "string", "default": ""},
            "focus": {"type": "string", "default": "Web security and AI engineering"},
        },
    ),
]


def rpc_error(request_id: Any, code: int, message: str, data: Any | None = None) -> dict[str, Any]:
    error: dict[str, Any] = {"code": code, "message": message}
    if data is not None:
        error["data"] = data
    return {"jsonrpc": "2.0", "id": request_id, "error": error}


def rpc_result(request_id: Any, result: Any) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": request_id, "result": result}


def text_result(data: Any, is_error: bool = False) -> dict[str, Any]:
    return {
        "content": [
            {
                "type": "text",
                "text": json.dumps(data, ensure_ascii=False, default=str),
            }
        ],
        "isError": is_error,
    }


def require_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin permission required")


def validation_error(error: ValidationError) -> dict[str, Any]:
    return text_result({"error": "Invalid arguments", "details": error.errors()}, is_error=True)


def serialize_profile(profile: Profile | None) -> dict[str, Any] | None:
    if profile is None:
        return None
    return {
        "id": profile.id,
        "name": profile.name,
        "bio": profile.bio,
        "avatar_url": profile.avatar_url,
        "interests": profile.interests,
        "experiences": profile.experiences,
        "github_url": profile.github_url,
        "email": profile.email,
    }


async def run_tool(name: str, arguments: dict[str, Any], user: User, db: Session) -> dict[str, Any]:
    if name == "blog.profile.get":
        return text_result(serialize_profile(db.get(Profile, 1)))

    if name == "blog.posts.list":
        include_drafts = bool(arguments.get("include_drafts", False))
        if include_drafts:
            require_admin(user)
        limit = int(arguments.get("limit", 10))
        limit = max(1, min(limit, 50))
        q = arguments.get("q")
        stmt = select(Post).order_by(Post.created_at.desc()).limit(limit)
        if not include_drafts:
            stmt = stmt.where(Post.status == "published")
        if q:
            like_q = f"%{q}%"
            stmt = stmt.where(or_(Post.title.like(like_q), Post.summary.like(like_q), Post.content.like(like_q)))
        posts = with_counts_many(list(db.scalars(stmt).all()), db)
        return text_result([post.model_dump(mode="json") for post in posts])

    if name == "blog.posts.get":
        post_id = int(arguments.get("post_id", 0))
        post = db.scalar(select(Post).options(joinedload(Post.author)).where(Post.id == post_id))
        if post is None or (post.status != "published" and user.role != "admin"):
            return text_result({"error": "Post not found"}, is_error=True)
        data = with_counts(post, db).model_dump(mode="json")
        data["author"] = {"id": post.author.id, "username": post.author.username, "email": post.author.email, "avatar_url": post.author.avatar_url}
        return text_result(data)

    if name == "blog.posts.create":
        require_admin(user)
        try:
            payload = PostCreate(**arguments)
        except ValidationError as error:
            return validation_error(error)
        post = Post(**payload.model_dump(), author_id=user.id)
        db.add(post)
        db.commit()
        db.refresh(post)
        return text_result(with_counts(post, db).model_dump(mode="json"))

    if name == "blog.posts.update":
        require_admin(user)
        post_id = int(arguments.get("post_id", 0))
        post = db.get(Post, post_id)
        if post is None:
            return text_result({"error": "Post not found"}, is_error=True)
        payload_data = {key: value for key, value in arguments.items() if key != "post_id"}
        try:
            payload = PostUpdate(**payload_data)
        except ValidationError as error:
            return validation_error(error)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(post, field, value)
        db.commit()
        db.refresh(post)
        return text_result(with_counts(post, db).model_dump(mode="json"))

    if name == "blog.posts.delete":
        require_admin(user)
        post_id = int(arguments.get("post_id", 0))
        post = db.get(Post, post_id)
        if post is None:
            return text_result({"error": "Post not found"}, is_error=True)
        db.delete(post)
        db.commit()
        return text_result({"deleted": True, "post_id": post_id})

    if name == "blog.stats.get":
        require_admin(user)
        total_posts = db.scalar(select(func.count(Post.id))) or 0
        total_users = db.scalar(select(func.count(User.id))) or 0
        total_comments = db.scalar(select(func.count(Comment.id))) or 0
        total_page_views = db.scalar(select(func.count(Event.id)).where(Event.event == "page_view")) or 0
        total_likes = db.scalar(select(func.count(Like.id))) or 0
        total_favorites = db.scalar(select(func.count(Favorite.id))) or 0
        return text_result(
            {
                "metrics": {
                    "posts": total_posts,
                    "users": total_users,
                    "comments": total_comments,
                    "page_views": total_page_views,
                    "likes": total_likes,
                    "favorites": total_favorites,
                }
            }
        )

    if name == "blog.ai.summarize_text":
        require_admin(user)
        text = str(arguments.get("text", ""))
        style = str(arguments.get("style", "concise"))
        return text_result({"summary": await deepseek.summarize_text(text, style)})

    if name == "blog.ai.summarize_post":
        require_admin(user)
        post_id = int(arguments.get("post_id", 0))
        post = db.get(Post, post_id)
        if post is None:
            return text_result({"error": "Post not found"}, is_error=True)
        style = str(arguments.get("style", "concise"))
        content = f"# {post.title}\n\n{post.summary}\n\n{post.content}"
        return text_result({"post_id": post_id, "summary": await deepseek.summarize_text(content, style)})

    if name == "blog.ai.draft_post":
        require_admin(user)
        title = str(arguments.get("title", ""))
        keywords = arguments.get("keywords") or []
        if not isinstance(keywords, list):
            return text_result({"error": "keywords must be an array"}, is_error=True)
        tone = str(arguments.get("tone", "technical notebook"))
        return text_result({"draft": await deepseek.draft_post(title, [str(item) for item in keywords], tone)})

    if name == "blog.ai.generate_security_question":
        require_admin(user)
        topic = str(arguments.get("topic", "phishing"))
        difficulty = str(arguments.get("difficulty", "easy"))
        return text_result({"question": await deepseek.generate_security_question(topic, difficulty)})

    if name == "blog.ai.generate_digest":
        require_admin(user)
        kind = str(arguments.get("kind", "daily-news"))
        source_text = str(arguments.get("source_text", ""))
        focus = str(arguments.get("focus", "Web security and AI engineering"))
        return text_result({"digest": await deepseek.generate_digest(kind, source_text, focus)})

    return text_result({"error": f"Unknown tool: {name}"}, is_error=True)


@router.get("")
def mcp_info():
    return {
        "name": "SecBlog MCP Server",
        "endpoint": "/api/mcp",
        "transport": "HTTP JSON-RPC",
        "auth": "Authorization: Bearer <token>",
        "tools": [tool["name"] for tool in TOOLS],
    }


@router.post("")
async def mcp_rpc(
    payload: dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request_id = payload.get("id")
    method = payload.get("method")
    params = payload.get("params") or {}

    if request_id is None and method == "notifications/initialized":
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    if method == "initialize":
        return rpc_result(
            request_id,
            {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "SecBlog MCP Server", "version": "1.0.0"},
            },
        )

    if method == "tools/list":
        return rpc_result(request_id, {"tools": TOOLS})

    if method == "tools/call":
        name = params.get("name")
        arguments = params.get("arguments") or {}
        if not isinstance(name, str):
            return rpc_error(request_id, -32602, "tools/call requires params.name")
        if not isinstance(arguments, dict):
            return rpc_error(request_id, -32602, "tools/call params.arguments must be an object")
        return rpc_result(request_id, await run_tool(name, arguments, current_user, db))

    return rpc_error(request_id, -32601, f"Method not found: {method}")

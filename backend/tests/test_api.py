from fastapi.testclient import TestClient

from app.main import app


def test_health_check():
    with TestClient(app) as client:
        response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_posts_are_public():
    with TestClient(app) as client:
        response = client.get("/api/posts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_public_ai_summary_uses_deepseek_config():
    with TestClient(app) as client:
        posts = client.get("/api/posts")
        post_id = posts.json()[0]["id"]
        response = client.get(f"/api/ai/posts/{post_id}/summary")
    assert response.status_code == 503
    assert response.json()["detail"] == "DeepSeek API is not configured"


def test_security_questions_do_not_expose_answers():
    with TestClient(app) as client:
        response = client.get("/api/security-games/phishing-detective/questions")
    assert response.status_code == 200
    assert "answer" not in response.json()[0]


def test_security_games_include_extended_missions():
    with TestClient(app) as client:
        response = client.get("/api/security-games")
    assert response.status_code == 200
    names = set(response.json())
    assert "xss-hunter" in names
    assert "vulnerability-scan" in names
    assert "packet-detective" in names


def test_arcade_score_requires_login_and_updates_leaderboard():
    with TestClient(app) as client:
        unauthenticated = client.post(
            "/api/security-games/web-firewall-interceptor/score",
            json={"score": 420, "correct_count": 4, "total_count": 5, "duration_seconds": 30},
        )
        assert unauthenticated.status_code == 401

        login = client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "ChangeMe123!"},
        )
        token = login.json()["access_token"]
        response = client.post(
            "/api/security-games/web-firewall-interceptor/score",
            headers={"Authorization": f"Bearer {token}"},
            json={"score": 420, "correct_count": 4, "total_count": 5, "duration_seconds": 30},
        )
        leaderboard = client.get("/api/security-games/web-firewall-interceptor/leaderboard")

    assert response.status_code == 201
    assert response.json()["score"] == 420
    assert leaderboard.status_code == 200
    assert any(row["score"] == 420 for row in leaderboard.json())


def test_admin_can_create_security_question():
    payload = {
        "game_name": "xss-hunter",
        "question": "Which payload should be blocked by output encoding?",
        "options": ["plain text", "<script>alert(1)</script>", "normal search", "static asset"],
        "answer": "1",
        "explanation": "script tags in user-controlled output are an XSS signal.",
        "difficulty": "medium",
        "category": "xss",
    }
    with TestClient(app) as client:
        unauthenticated = client.post("/api/security-games/questions", json=payload)
        login = client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "ChangeMe123!"},
        )
        token = login.json()["access_token"]
        created = client.post(
            "/api/security-games/questions",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
        )
        questions = client.get("/api/security-games/xss-hunter/questions")

    assert unauthenticated.status_code == 401
    assert created.status_code == 201
    assert created.json()["game_name"] == "xss-hunter"
    assert questions.status_code == 200
    assert any(item["question"] == payload["question"] for item in questions.json())


def test_security_game_requires_all_answers():
    with TestClient(app) as client:
        login = client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "ChangeMe123!"},
        )
        assert login.status_code == 200
        token = login.json()["access_token"]

        questions = client.get("/api/security-games/phishing-detective/questions")
        assert questions.status_code == 200
        question_id = questions.json()[0]["id"]

        response = client.post(
            "/api/security-games/phishing-detective/submit",
            headers={"Authorization": f"Bearer {token}"},
            json={"answers": [{"question_id": question_id, "answer": "1"}], "duration_seconds": 10},
        )
    assert response.status_code == 400
    assert response.json()["detail"] == "All questions must be answered"


def test_github_login_is_disabled_without_config():
    with TestClient(app) as client:
        response = client.get("/api/auth/github/enabled")
    assert response.status_code == 200
    assert response.json() == {"enabled": False}


def test_github_login_start_requires_config():
    with TestClient(app) as client:
        response = client.get("/api/auth/github/start", follow_redirects=False)
    assert response.status_code == 503


def test_deepseek_ai_is_disabled_without_config():
    with TestClient(app) as client:
        response = client.get("/api/ai/enabled")
    assert response.status_code == 200
    assert response.json()["enabled"] is False


def test_deepseek_ai_requires_admin_and_config():
    with TestClient(app) as client:
        unauthenticated = client.post("/api/ai/summarize", json={"text": "x" * 30})
        assert unauthenticated.status_code == 401

        login = client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "ChangeMe123!"},
        )
        token = login.json()["access_token"]
        response = client.post(
            "/api/ai/summarize",
            headers={"Authorization": f"Bearer {token}"},
            json={"text": "This is a long enough note about web security and AI tooling."},
        )
    assert response.status_code == 503
    assert response.json()["detail"] == "DeepSeek API is not configured"


def test_mcp_requires_authentication():
    with TestClient(app) as client:
        response = client.post("/api/mcp", json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"})
    assert response.status_code == 401


def test_mcp_lists_and_calls_tools():
    with TestClient(app) as client:
        login = client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "ChangeMe123!"},
        )
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        initialized = client.post("/api/mcp", headers=headers, json={"jsonrpc": "2.0", "id": 1, "method": "initialize"})
        assert initialized.status_code == 200
        assert initialized.json()["result"]["serverInfo"]["name"] == "SecBlog MCP Server"

        tools = client.post("/api/mcp", headers=headers, json={"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
        assert tools.status_code == 200
        tool_names = [tool["name"] for tool in tools.json()["result"]["tools"]]
        assert "blog.posts.list" in tool_names
        assert "blog.posts.create" in tool_names
        assert "blog.ai.summarize_post" in tool_names
        assert "blog.ai.generate_digest" in tool_names

        posts = client.post(
            "/api/mcp",
            headers=headers,
            json={
                "jsonrpc": "2.0",
                "id": 3,
                "method": "tools/call",
                "params": {"name": "blog.posts.list", "arguments": {"limit": 2}},
            },
        )
        assert posts.status_code == 200
        assert posts.json()["result"]["content"][0]["type"] == "text"


def test_admin_stats_are_available():
    with TestClient(app) as client:
        login = client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "ChangeMe123!"},
        )
        token = login.json()["access_token"]
        response = client.get("/api/stats", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert "metrics" in response.json()


def test_avatar_upload_rejects_non_image():
    with TestClient(app) as client:
        login = client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "ChangeMe123!"},
        )
        token = login.json()["access_token"]
        response = client.post(
            "/api/profile/avatar",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": ("avatar.txt", b"not an image", "text/plain")},
        )
    assert response.status_code == 400

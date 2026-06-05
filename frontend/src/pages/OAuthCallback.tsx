import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { api, storeSession } from "../api/client";
import { StatusMessage } from "../components/StatusMessage";

export function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setError("登录回调缺少 token。");
      return;
    }
    localStorage.setItem("security_blog_token", token);
    api
      .me()
      .then((user) => {
        storeSession(token, user);
        navigate("/");
      })
      .catch((err: Error) => setError(err.message));
  }, [navigate, params]);

  if (error) return <StatusMessage tone="error" message={error} />;
  return <StatusMessage message="正在完成 GitHub 登录..." />;
}

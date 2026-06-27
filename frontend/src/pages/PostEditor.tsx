import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../api/client";
import { StatusMessage } from "../components/StatusMessage";

export function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.post(id, true)
      .then((post) => {
        setTitle(post.title);
        setSummary(post.summary);
        setContent(post.content);
        setStatus(post.status);
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const payload = { title, summary, content, status };
    try {
      if (id) {
        await api.updatePost(id, payload);
      } else {
        await api.createPost(payload);
      }
      navigate("/admin/posts");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="page-stack editor-page">
      <h1>{id ? "编辑文章" : "新建文章"}</h1>
      {error && <StatusMessage tone="error" message={error} />}
      <form className="editor-form" onSubmit={submit}>
        <label>
          标题
          <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={200} />
        </label>
        <label>
          摘要
          <input value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={500} />
        </label>
        <label>
          状态
          <select value={status} onChange={(event) => setStatus(event.target.value as "published" | "draft")}>
            <option value="published">发布</option>
            <option value="draft">草稿</option>
          </select>
        </label>
        <label>
          正文
          <textarea value={content} onChange={(event) => setContent(event.target.value)} required rows={18} />
        </label>
        <button type="submit">{status === "published" ? "发布文章" : "保存草稿"}</button>
      </form>
    </section>
  );
}

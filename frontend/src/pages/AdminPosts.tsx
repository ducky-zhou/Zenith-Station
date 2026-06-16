import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { StatusMessage } from "../components/StatusMessage";
import type { Post } from "../types";

export function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");

  const load = () => api.posts("", true).then(setPosts).catch((err: Error) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: number) => {
    if (!confirm("确认删除这篇文章？")) return;
    await api.deletePost(id);
    load();
  };

  return (
    <section className="page-stack">
      <div className="section-heading">
        <h1>文章后台</h1>
        <Link to="/admin/posts/new" className="primary-button compact">
          <Plus aria-hidden="true" /> 新建文章
        </Link>
      </div>
      {error && <StatusMessage tone="error" message={error} />}
      <div className="table-list">
        {posts.map((post) => (
          <div className="table-row" key={post.id}>
            <div>
              <strong>{post.title}</strong>
              <span>{post.status}</span>
            </div>
            <div className="row-actions">
              <Link to={`/admin/posts/${post.id}/edit`} className="icon-button" title="编辑">
                <Edit aria-hidden="true" />
              </Link>
              <button type="button" onClick={() => remove(post.id)} className="icon-button danger" title="删除">
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

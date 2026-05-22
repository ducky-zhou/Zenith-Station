import { Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { api } from "../api/client";
import { PostCard } from "../components/PostCard";
import { StatusMessage } from "../components/StatusMessage";
import type { Post } from "../types";

export function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const load = (q = "") => {
    api.posts(q).then(setPosts).catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    api.track("page_view", "/posts");
    load();
  }, []);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    load(query.trim());
  };

  return (
    <section className="page-stack">
      <div className="section-heading">
        <h1>文章</h1>
      </div>
      <form className="search-form" onSubmit={onSearch}>
        <Search aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索关键词" />
        <button type="submit">搜索</button>
      </form>
      {error && <StatusMessage tone="error" message={error} />}
      <div className="post-list">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

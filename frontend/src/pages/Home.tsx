import { ArrowRight, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { PostCard } from "../components/PostCard";
import { StatusMessage } from "../components/StatusMessage";
import type { Post, Profile } from "../types";

export function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.track("page_view", "/");
    Promise.all([api.posts(), api.profile()])
      .then(([postData, profileData]) => {
        setPosts(postData.slice(0, 3));
        setProfile(profileData);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <section className="page-stack">
      <div className="hero-band">
        <div>
          <div className="eyebrow">
            <ShieldCheck aria-hidden="true" />
            信息安全 · 全栈博客
          </div>
          <h1>{profile?.name ?? "Security Personal Blog"}</h1>
          <p>{profile?.bio ?? "记录 Web 开发、信息安全和 AI 自动化实践。"}</p>
          <div className="hero-actions">
            <Link to="/posts" className="primary-button">
              读文章 <ArrowRight aria-hidden="true" />
            </Link>
            <Link to="/security-game" className="secondary-button">
              安全闯关
            </Link>
          </div>
        </div>
      </div>
      {error && <StatusMessage tone="error" message={error} />}
      <section>
        <div className="section-heading">
          <h2>最近文章</h2>
          <Link to="/posts">全部文章</Link>
        </div>
        <div className="post-grid">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </section>
  );
}

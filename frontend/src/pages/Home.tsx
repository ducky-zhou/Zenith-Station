import { ArrowRight, ShieldCheck, Terminal, UserRound } from "lucide-react";
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
        <div className="terminal-window">
          <div className="terminal-topbar">
            <span />
            <span />
            <span />
            <strong>~/secblog/lab</strong>
          </div>
          <div className="terminal-body">
            <div className="terminal-line muted">$ whoami</div>
            <div className="terminal-identity">
              <div className="hero-profile">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} />
                ) : (
                  <UserRound aria-hidden="true" />
                )}
              </div>
              <div>
                <div className="eyebrow">
                  <ShieldCheck aria-hidden="true" />
                  Web & Security Lab
                </div>
                <h1>{profile?.name ?? "Security Personal Blog"}</h1>
                <p>{profile?.bio ?? "记录 Web 开发、信息安全和 AI 自动化实践。"}</p>
              </div>
            </div>
            <div className="terminal-line muted">$ cat interests.txt</div>
            <div className="terminal-tags">
              <span>Web Dev</span>
              <span>CTF</span>
              <span>AI Tools</span>
              <span>Projects</span>
            </div>
            <div className="terminal-line muted">$ ./enter_lab --mode reader</div>
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
        <aside className="lab-panel">
          <div className="panel-heading">
            <Terminal aria-hidden="true" />
            <span>Status</span>
          </div>
          <dl>
            <div>
              <dt>focus</dt>
              <dd>Web Security</dd>
            </div>
            <div>
              <dt>stack</dt>
              <dd>React / FastAPI</dd>
            </div>
            <div>
              <dt>signal</dt>
              <dd>notes, labs, writeups</dd>
            </div>
          </dl>
        </aside>
      </div>
      {error && <StatusMessage tone="error" message={error} />}
      <section className="home-grid">
        <div>
          <div className="section-heading">
            <h2>最近文章</h2>
            <Link to="/posts">全部文章</Link>
          </div>
          <div className="post-grid compact-list">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
        <aside className="side-stack">
          <section className="info-panel terminal-panel">
            <h2>Topics</h2>
            <div className="topic-list">
              <span>#web-security</span>
              <span>#ctf</span>
              <span>#ai-tools</span>
              <span>#full-stack</span>
            </div>
          </section>
          <section className="info-panel terminal-panel">
            <h2>Lab Entrance</h2>
            <p>用小题练习识别钓鱼邮件、SQL 注入和常见 Web 安全风险。</p>
            <Link to="/security-game" className="secondary-button compact">
              打开安全闯关
            </Link>
          </section>
        </aside>
      </section>
    </section>
  );
}

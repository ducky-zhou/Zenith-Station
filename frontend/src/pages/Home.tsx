import { ArrowRight, Bot, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { PostCard } from "../components/PostCard";
import { StatusMessage } from "../components/StatusMessage";
import type { Post, Profile, ScoreRow } from "../types";

export function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leaderboard, setLeaderboard] = useState<ScoreRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.track("page_view", "/");
    Promise.all([api.posts(), api.profile()])
      .then(([postData, profileData]) => {
        setPosts(postData.slice(0, 3));
        setProfile(profileData);
      })
      .catch((err: Error) => setError(err.message));
    api.leaderboard("phishing-detective").then((rows) => setLeaderboard(rows.slice(0, 5))).catch(() => undefined);
  }, []);

  return (
    <section className="page-stack">
      {error && <StatusMessage tone="error" message={error} />}
      <div className="main-home-grid">
        <div className="home-main-column">
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
                    <h1>Security Notes & Builds</h1>
                    <p>Notes on web development, security practice, AI tooling, and side projects.</p>
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
                    Explore Notes <ArrowRight aria-hidden="true" />
                  </Link>
                  <Link to="/security-game" className="secondary-button">
                    Enter Lab
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <section>
            <div className="section-heading">
              <h2>最近文章</h2>
              <Link to="/posts">全部文章</Link>
            </div>
            <div className="post-grid compact-list">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        </div>
        <aside className="home-aside-column side-stack">
          <section className="info-panel terminal-panel status-panel">
            <h2>Status</h2>
            <dl>
              <div>
                <dt>mode</dt>
                <dd>learning</dd>
              </div>
              <div>
                <dt>focus</dt>
                <dd>Web Security</dd>
              </div>
              <div>
                <dt>stack</dt>
                <dd>React / FastAPI</dd>
              </div>
              <div>
                <dt>os</dt>
                <dd>Arch Linux</dd>
              </div>
              <div>
                <dt>uptime</dt>
                <dd>7h 23m</dd>
              </div>
            </dl>
          </section>
          <section className="info-panel terminal-panel">
            <h2>Topics</h2>
            <div className="topic-list">
              <span>#web-security</span>
              <span>#ctf</span>
              <span>#ai-tools</span>
              <span>#full-stack</span>
              <span>#linux</span>
              <span>#notes</span>
            </div>
          </section>
          <section className="info-panel terminal-panel quick-panel">
            <h2>Quick Links</h2>
            <Link to="/posts">/articles <ArrowRight aria-hidden="true" /></Link>
            <Link to="/security-game">/security-lab <ArrowRight aria-hidden="true" /></Link>
            <Link to="/about">/about <ArrowRight aria-hidden="true" /></Link>
            <a href="/rss.xml">/rss.xml <ArrowRight aria-hidden="true" /></a>
          </section>
          <section className="info-panel terminal-panel">
            <h2>Lab Entrance</h2>
            <div className="lab-entrance-card">
              <div className="lab-bot">
                <Bot aria-hidden="true" />
              </div>
              <div>
                <strong>Security Lab</strong>
                <span>安全闯关小游戏</span>
                <p>挑战你的安全技能，冲击排行榜。</p>
                <Link to="/security-game" className="primary-button compact">
                  进入实验室 <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
          <section className="info-panel terminal-panel leaderboard-panel">
            <h2>Leaderboard</h2>
            <div className="leaderboard-table">
              <div className="leaderboard-head">
                <span>#</span>
                <span>operator</span>
                <span>score</span>
                <span>acc.</span>
              </div>
              {leaderboard.length > 0 ? (
                leaderboard.map((row, index) => (
                  <div className="leaderboard-item" key={row.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{row.username}</strong>
                    <span>{row.score}</span>
                    <span>{Math.round((row.correct_count / row.total_count) * 100)}%</span>
                  </div>
                ))
              ) : (
                <p className="empty-board">暂无排行</p>
              )}
            </div>
            <Link to="/security-game" className="board-link">
              查看完整排行榜 <ArrowRight aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>
    </section>
  );
}

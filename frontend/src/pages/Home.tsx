import { ArrowRight, ShieldCheck, UserRound } from "lucide-react";
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
                    <h1>duck@secblog</h1>
                    <p>Web Security / CTF / AI Infra / Notes</p>
                    <p className="hero-note">Learning in public. Building small security labs.</p>
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
                <dd>macOS / Kali Linux</dd>
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
            <Link to="/security-arcade">/security-arcade <ArrowRight aria-hidden="true" /></Link>
            <Link to="/minesweeper">/minesweeper <ArrowRight aria-hidden="true" /></Link>
            <Link to="/about">/about <ArrowRight aria-hidden="true" /></Link>
            <a href="/rss.xml">/rss.xml <ArrowRight aria-hidden="true" /></a>
          </section>
        </aside>
      </div>
    </section>
  );
}

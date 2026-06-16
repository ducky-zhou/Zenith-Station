import { ArrowRight, UserRound } from "lucide-react";
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
              <div className="terminal-body">
                <div className="hero-meta-row">
                  <span className="hero-path">~/secblog/lab</span>
                </div>
                <div className="terminal-identity">
                  <div className="hero-profile">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.name} />
                    ) : (
                      <UserRound aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <h1>duck@secblog</h1>
                    <p>Web Security / CTF / AI Infra / Notes</p>
                    <p className="hero-note">Learning in public. Building small security labs.</p>
                  </div>
                </div>
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
          <section className="recent-section">
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
      </div>
    </section>
  );
}

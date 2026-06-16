import { ArrowUpRight, Shield } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "../api/client";
import { StatusMessage } from "../components/StatusMessage";
import type { Profile } from "../types";

export function About() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.track("page_view", "/about");
    api.profile().then(setProfile).catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <StatusMessage tone="error" message={error} />;
  if (!profile) return <StatusMessage message="加载中..." />;

  return (
    <section className="page-stack">
      <div className="profile-header">
        {profile.avatar_url ? (
          <img className="profile-avatar" src={profile.avatar_url} alt={profile.name} />
        ) : (
          <div className="avatar-placeholder">
            <Shield aria-hidden="true" />
          </div>
        )}
        <div>
          <h1>{profile.name}</h1>
          <p>{profile.bio}</p>
        </div>
      </div>
      <section className="about-notes">
        <div>
          <h2>兴趣</h2>
          <p>{profile.interests}</p>
        </div>
        <div>
          <h2>经历</h2>
          <p>{profile.experiences}</p>
        </div>
        <div className="contact-list">
          {profile.github_url && (
            <a href={profile.github_url} target="_blank" rel="noreferrer">
              GitHub <ArrowUpRight aria-hidden="true" />
            </a>
          )}
          {profile.email && (
            <a href={`mailto:${profile.email}`}>
              {profile.email} <ArrowUpRight aria-hidden="true" />
            </a>
          )}
        </div>
      </section>
    </section>
  );
}

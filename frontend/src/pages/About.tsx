import { Github, Mail, Shield } from "lucide-react";
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
        <div className="avatar-placeholder">
          <Shield aria-hidden="true" />
        </div>
        <div>
          <h1>{profile.name}</h1>
          <p>{profile.bio}</p>
        </div>
      </div>
      <div className="info-grid">
        <section className="info-panel">
          <h2>兴趣</h2>
          <p>{profile.interests}</p>
        </section>
        <section className="info-panel">
          <h2>经历</h2>
          <p>{profile.experiences}</p>
        </section>
        <section className="info-panel">
          <h2>联系</h2>
          <div className="contact-list">
            {profile.github_url && (
              <a href={profile.github_url} target="_blank" rel="noreferrer">
                <Github aria-hidden="true" /> GitHub
              </a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`}>
                <Mail aria-hidden="true" /> {profile.email}
              </a>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

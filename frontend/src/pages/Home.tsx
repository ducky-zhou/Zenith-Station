import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import type { Profile } from "../types";

const entryLinks = [
  { to: "/posts", title: "文章笔记", description: "记录技术学习和安全研究笔记。" },
  { to: "/security-game", title: "安全闯关", description: "完成判断任务，挑战安全排行榜。" },
  { to: "/security-arcade", title: "安全街机", description: "交互式流量判断与防火墙模拟。" },
  { to: "/minesweeper", title: "经典扫雷", description: "Win7 风格扫雷，支持三档难度。" },
  { to: "/about", title: "关于", description: "浙大信安在读，喜欢写代码和打 CTF。" },
  { to: "/favorites", title: "收藏", description: "整理过的好东西。" }
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "夜深了，注意休息";
  if (hour < 7) return "早安，新的一天开始了";
  if (hour < 11) return "上午好，代码跑得还顺吗";
  if (hour < 13) return "中午好，该干饭了";
  if (hour < 18) return "下午好，继续折腾";
  if (hour < 20) return "傍晚好，放松一下眼睛吧";
  if (hour < 22) return "晚上好，享受极客时光";
  return "夜深了，早点休息";
}

export function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [greeting, setGreeting] = useState(getGreeting);

  useEffect(() => {
    api.track("page_view", "/");
    api.profile().then(setProfile).catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="home-page">
      <div className="home-hero">
        <div className="home-greeting" aria-live="polite">{greeting}</div>
        <div className="home-intro">
          <div className="home-intro-copy">
            <span className="home-path">~/secblog</span>
            <h1>
              Hi, I'm <span>ducky@secblog.</span>
            </h1>
            <p>Web Security / CTF / AI Infra</p>
          </div>
          <div className="home-avatar" aria-label="ducky@secblog avatar">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.name || "ducky@secblog"} /> : <span>ducky</span>}
          </div>
        </div>
      </div>
      <nav className="home-entry-grid" aria-label="home entries">
        {entryLinks.map((entry, index) => (
          <Link key={entry.to} to={entry.to} className="home-entry-card" style={{ animationDelay: `${0.14 + index * 0.04}s` }}>
            <strong>{entry.title}</strong>
            <span>{entry.description}</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}

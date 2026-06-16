import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import homeAvatar from "../assets/home-avatar.jpg";

const entryLinks = [
  { to: "/posts", title: "文章笔记", description: "记录技术学习和安全研究笔记。" },
  { to: "/security-game", title: "安全闯关", description: "完成判断任务，挑战安全排行榜。" },
  { to: "/security-arcade", title: "安全街机", description: "交互式流量判断与防火墙模拟。" },
  { to: "/minesweeper", title: "经典扫雷", description: "Win7 风格扫雷，支持三档难度。" },
  { to: "/about", title: "关于", description: "浙大信安在读，喜欢写代码和打 CTF。" },
  { to: "/favorites", title: "收藏", description: "整理过的好东西。" }
];

function buildGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 5) return "夜深了，注意休息一下眼睛吧";
  if (hour < 8) return "早安，今天也继续写点东西";
  if (hour < 12) return "上午好，开始今天的折腾";
  if (hour < 14) return "中午好，记得按时吃饭";
  if (hour < 18) return "下午好，继续推进手头的项目";
  if (hour < 21) return "傍晚好，放松一下眼睛吧";
  return "晚上好，享受一点安静的极客时间";
}

export function Home() {
  const [greeting, setGreeting] = useState(() => buildGreeting(new Date()));

  useEffect(() => {
    api.track("page_view", "/");
    setGreeting(buildGreeting(new Date()));
  }, []);

  return (
    <section className="home-page">
      <header className="home-hero">
        <div className="home-greeting-pill">
          <span>{greeting}</span>
          <small>secblog</small>
        </div>
        <div className="home-hero-shell">
          <div className="home-hero-copy">
            <span className="home-path">~/secblog</span>
            <h1>
              Hi, I'm <span className="home-name-highlight">Ducky</span>.
            </h1>
            <p className="home-hero-subtitle">Web Security / CTF / AI Infra</p>
            <p className="home-hero-note">Welcome to my security notes and little lab.</p>
          </div>
          <div className="home-hero-avatar" aria-hidden="true">
            <img src={homeAvatar} alt="" />
          </div>
        </div>
      </header>
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

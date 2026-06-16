import { useEffect } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";

const entryLinks = [
  { to: "/posts", title: "文章笔记", description: "记录技术学习和安全研究笔记。" },
  { to: "/security-game", title: "安全闯关", description: "完成判断任务，挑战安全排行榜。" },
  { to: "/security-arcade", title: "安全街机", description: "交互式流量判断与防火墙模拟。" },
  { to: "/minesweeper", title: "经典扫雷", description: "Win7 风格扫雷，支持三档难度。" },
  { to: "/about", title: "关于", description: "浙大信安在读，喜欢写代码和打 CTF。" },
  { to: "/favorites", title: "收藏", description: "整理过的好东西。" }
];

export function Home() {
  useEffect(() => {
    api.track("page_view", "/");
  }, []);

  return (
    <section className="home-page">
      <div className="home-intro">
        <span className="home-path">~/secblog</span>
        <h1>duck@secblog</h1>
        <p>Web Security / CTF / AI Infra</p>
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

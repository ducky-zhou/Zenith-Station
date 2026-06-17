import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import type { Profile } from "../types";

const entryLinks = [
  { to: "/posts", title: "文章笔记", description: "记录日常学习，技术探索，安全研究" },
  { to: "/security-game", title: "安全闯关", description: "完成判断任务，挑战安全排行榜。" },
  { to: "/security-arcade", title: "安全街机", description: "交互式流量判断与防火墙模拟。" },
  { to: "/minesweeper", title: "扫雷", description: "扫雷，支持三档难度。" },
  { to: "/about", title: "关于", description: "ZJU 25级 ISer , Hello!" },
  { to: "/favorites", title: "收藏", description: "整理过的好东西。" }
];

const fallbackAvatarUrl = "https://github.com/ducky-zhou.png";

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
  const gridRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    api.track("page_view", "/");
    api.profile().then(setProfile).catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = gridRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let animationFrame = 0;
    let mouseX = -1000;
    let mouseY = -1000;
    const gridSize = 44;
    const influenceRadius = 150;
    const maxDisplacement = 10;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const updateMouse = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = event.clientX - rect.left;
      mouseY = event.clientY - rect.top;
    };

    const clearMouse = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    const displaced = (x: number, y: number) => {
      const dx = x - mouseX;
      const dy = y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= influenceRadius || dist === 0) return { x, y };
      const force = (1 - dist / influenceRadius) * maxDisplacement;
      return {
        x: x + (dx / dist) * force,
        y: y + (dy / dist) * force
      };
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, rect.height);
      context.strokeStyle = "rgba(26, 25, 23, 0.07)";
      context.lineWidth = 1;

      for (let x = 0; x <= rect.width; x += gridSize) {
        context.beginPath();
        for (let y = 0; y <= rect.height; y += 6) {
          const point = displaced(x, y);
          if (y === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        }
        context.stroke();
      }

      for (let y = 0; y <= rect.height; y += gridSize) {
        context.beginPath();
        for (let x = 0; x <= rect.width; x += 6) {
          const point = displaced(x, y);
          if (x === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        }
        context.stroke();
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", updateMouse);
    window.addEventListener("mouseleave", clearMouse);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", updateMouse);
      window.removeEventListener("mouseleave", clearMouse);
    };
  }, []);

  return (
    <section className="home-page">
      <canvas ref={gridRef} className="home-grid-canvas" aria-hidden="true" />
      <div className="home-hero">
        <div className="home-intro">
          <div className="home-intro-copy">
            <span className="home-path">~/secblog</span>
            <h1>
              Hi, I'm <span>ducky.</span>
            </h1>
            <p>Web Security / CTF / AI Infra</p>
            <div className="home-greeting" aria-live="polite">{greeting}</div>
          </div>
          <div className="home-avatar" aria-label="ducky@secblog avatar">
            <div className="home-avatar-flip">
              <div className="home-avatar-face home-avatar-front">
                <img src={profile?.avatar_url || fallbackAvatarUrl} alt={profile?.name || "ducky"} />
              </div>
              <div className="home-avatar-face home-avatar-back">
                <span>𓅿𓅹</span>
                <strong>（ᗜ ‸ ᗜ）</strong>
              </div>
            </div>
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

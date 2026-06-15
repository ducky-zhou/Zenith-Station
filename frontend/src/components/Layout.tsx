import { BarChart3, Bomb, BookOpen, Bot, Gamepad2, Github, Globe2, Home, Lock, LogOut, Mail, Radar, Rss, Shield, UserRound } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../auth";

const navItems = [
  { to: "/", label: "首页", icon: Home },
  { to: "/posts", label: "文章", icon: BookOpen },
  { to: "/about", label: "关于", icon: UserRound },
  { to: "/security-game", label: "安全闯关", icon: Shield },
  { to: "/security-arcade", label: "安全街机", icon: Radar },
  { to: "/minesweeper", label: "经典扫雷", icon: Bomb }
];

export function Layout() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <Shield aria-hidden="true" />
          <span>duck@secblog</span>
        </NavLink>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          {user && (
            <NavLink to="/favorites" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Gamepad2 aria-hidden="true" />
              <span>收藏</span>
            </NavLink>
          )}
          {isAdmin && (
            <>
              <NavLink to="/admin/posts" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <Lock aria-hidden="true" />
                <span>文章后台</span>
              </NavLink>
              <NavLink to="/admin/profile" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <UserRound aria-hidden="true" />
                <span>资料后台</span>
              </NavLink>
              <NavLink to="/admin/stats" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <BarChart3 aria-hidden="true" />
                <span>数据统计</span>
              </NavLink>
              <NavLink to="/admin/ai" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <Bot aria-hidden="true" />
                <span>AI 后台</span>
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="operator-card">
            <strong>duck@secblog</strong>
            <span>ZJU · InfoSec Student</span>
            <div className="operator-links">
              <a href="https://github.com/ducky-zhou" target="_blank" rel="noreferrer" title="GitHub">
                <Github aria-hidden="true" />
              </a>
              <a href="mailto:admin@example.com" title="Email">
                <Mail aria-hidden="true" />
              </a>
              <a href="/rss.xml" title="RSS">
                <Rss aria-hidden="true" />
              </a>
              <a href="/" title="Site">
                <Globe2 aria-hidden="true" />
              </a>
            </div>
          </div>
          {user ? (
            <>
              <div className="user-chip">
                <span>{user.username}</span>
                <small>{user.role}</small>
              </div>
              <button className="icon-text-button ghost" onClick={logout} type="button">
                <LogOut aria-hidden="true" />
                <span>退出</span>
              </button>
            </>
          ) : (
            <NavLink to="/login" className="icon-text-button">
              <Lock aria-hidden="true" />
              <span>登录</span>
            </NavLink>
          )}
          <div className="terminal-ready">
            <span>system ready</span>
            <i aria-hidden="true" />
          </div>
        </div>
      </aside>
      <main className="content">
        <Outlet />
        <footer className="app-footer">
          <span>[The quieter you become, the more you are able to hear.]</span>
          <strong>SecBlog v1.0.0</strong>
        </footer>
      </main>
    </div>
  );
}

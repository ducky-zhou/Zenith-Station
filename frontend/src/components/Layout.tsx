import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../auth";

const primaryNav = [
  { to: "/", label: "首页" },
  { to: "/posts", label: "文章" },
  { to: "/about", label: "关于" }
];

const labNav = [
  { to: "/security-game", label: "安全闯关" },
  { to: "/security-arcade", label: "安全街机" },
  { to: "/minesweeper", label: "经典扫雷" }
];

const adminNav = [
  { to: "/admin/posts", label: "文章后台" },
  { to: "/admin/stats", label: "数据统计" },
  { to: "/admin/ai", label: "AI 后台" }
];

function NavItems({ items }: { items: Array<{ to: string; label: string }> }) {
  return (
    <>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </>
  );
}

export function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span>duck@secblog</span>
        </NavLink>
        <nav className="nav-list">
          <NavItems items={primaryNav} />
          <span className="nav-group-label">实验室</span>
          <NavItems items={labNav} />
          {user && (
            <NavLink to="/favorites" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <span>收藏</span>
            </NavLink>
          )}
          {isAdmin && (
            <>
              <span className="nav-group-label">管理</span>
              <NavItems items={adminNav} />
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="operator-card">
            <strong>duck@secblog</strong>
            <span>ZJU · InfoSec Student</span>
          </div>
          {user ? (
            <>
              <div className="user-chip">
                <span>{user.username}</span>
                <small>{user.role}</small>
              </div>
              <button className="icon-text-button ghost" onClick={logout} type="button">
                <span>退出</span>
              </button>
            </>
          ) : (
            <NavLink to="/login" className="icon-text-button">
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
        <div className="route-view" key={location.pathname}>
          <Outlet />
        </div>
        <footer className="app-footer">
          <div className="footer-line">
            <span>[The quieter you become, the more you are able to hear.]</span>
            <strong>SecBlog v1.0.0</strong>
          </div>
          <a className="beian-link" href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank" rel="noreferrer">
            浙ICP备2026042466号-1
          </a>
        </footer>
      </main>
    </div>
  );
}

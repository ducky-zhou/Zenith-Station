import { BookOpen, Gamepad2, Home, Lock, LogOut, Shield, UserRound } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../auth";

const navItems = [
  { to: "/", label: "首页", icon: Home },
  { to: "/posts", label: "文章", icon: BookOpen },
  { to: "/about", label: "关于", icon: UserRound },
  { to: "/security-game", label: "安全闯关", icon: Shield }
];

export function Layout() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <Shield aria-hidden="true" />
          <span>SecBlog</span>
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
            </>
          )}
        </nav>
        <div className="sidebar-footer">
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
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

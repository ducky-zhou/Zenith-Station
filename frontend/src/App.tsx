import { Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { About } from "./pages/About";
import { AdminAi } from "./pages/AdminAi";
import { AdminProfile } from "./pages/AdminProfile";
import { AdminPosts } from "./pages/AdminPosts";
import { AdminStats } from "./pages/AdminStats";
import { Login, Register } from "./pages/AuthPages";
import { Favorites } from "./pages/Favorites";
import { Home } from "./pages/Home";
import { Minesweeper } from "./pages/Minesweeper";
import { OAuthCallback } from "./pages/OAuthCallback";
import { PostDetail } from "./pages/PostDetail";
import { PostEditor } from "./pages/PostEditor";
import { Posts } from "./pages/Posts";
import { SecurityArcade } from "./pages/SecurityArcade";
import { SecurityGame } from "./pages/SecurityGame";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="posts" element={<Posts />} />
        <Route path="posts/:id" element={<PostDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="oauth/callback" element={<OAuthCallback />} />
        <Route path="security-game" element={<SecurityGame />} />
        <Route path="security-arcade" element={<SecurityArcade />} />
        <Route path="minesweeper" element={<Minesweeper />} />
        <Route element={<ProtectedRoute />}>
          <Route path="favorites" element={<Favorites />} />
        </Route>
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="admin/posts" element={<AdminPosts />} />
          <Route path="admin/posts/new" element={<PostEditor />} />
          <Route path="admin/posts/:id/edit" element={<PostEditor />} />
          <Route path="admin/profile" element={<AdminProfile />} />
          <Route path="admin/stats" element={<AdminStats />} />
          <Route path="admin/ai" element={<AdminAi />} />
        </Route>
      </Route>
    </Routes>
  );
}

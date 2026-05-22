import { Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { About } from "./pages/About";
import { AdminPosts } from "./pages/AdminPosts";
import { Login, Register } from "./pages/AuthPages";
import { Favorites } from "./pages/Favorites";
import { Home } from "./pages/Home";
import { PostDetail } from "./pages/PostDetail";
import { PostEditor } from "./pages/PostEditor";
import { Posts } from "./pages/Posts";
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
        <Route path="security-game" element={<SecurityGame />} />
        <Route element={<ProtectedRoute />}>
          <Route path="favorites" element={<Favorites />} />
        </Route>
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="admin/posts" element={<AdminPosts />} />
          <Route path="admin/posts/new" element={<PostEditor />} />
          <Route path="admin/posts/:id/edit" element={<PostEditor />} />
        </Route>
      </Route>
    </Routes>
  );
}

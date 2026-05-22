import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../auth";
import { StatusMessage } from "../components/StatusMessage";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="auth-panel">
      <h1>登录</h1>
      {error && <StatusMessage tone="error" message={error} />}
      <form onSubmit={submit} className="form-stack">
        <label>
          邮箱
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          密码
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <button type="submit">登录</button>
      </form>
      <p>
        没有账号？<Link to="/register">注册</Link>
      </p>
    </section>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await register(username, email, password);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="auth-panel">
      <h1>注册</h1>
      {error && <StatusMessage tone="error" message={error} />}
      <form onSubmit={submit} className="form-stack">
        <label>
          用户名
          <input value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} />
        </label>
        <label>
          邮箱
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          密码
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
        </label>
        <button type="submit">注册</button>
      </form>
      <p>
        已有账号？<Link to="/login">登录</Link>
      </p>
    </section>
  );
}

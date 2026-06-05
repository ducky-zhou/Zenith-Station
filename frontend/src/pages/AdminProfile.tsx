import { Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { api } from "../api/client";
import { StatusMessage } from "../components/StatusMessage";
import type { Profile } from "../types";

type ProfileForm = Omit<Profile, "id">;

const emptyForm: ProfileForm = {
  name: "",
  bio: "",
  avatar_url: "",
  interests: "",
  experiences: "",
  github_url: "",
  email: ""
};

export function AdminProfile() {
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .profile()
      .then((profile) =>
        setForm({
          name: profile.name,
          bio: profile.bio,
          avatar_url: profile.avatar_url ?? "",
          interests: profile.interests,
          experiences: profile.experiences,
          github_url: profile.github_url ?? "",
          email: profile.email ?? ""
        })
      )
      .catch((err: Error) => setError(err.message));
  }, []);

  const update = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        avatar_url: form.avatar_url || null,
        github_url: form.github_url || null,
        email: form.email || null
      };
      const profile = await api.updateProfile(payload);
      setForm({
        name: profile.name,
        bio: profile.bio,
        avatar_url: profile.avatar_url ?? "",
        interests: profile.interests,
        experiences: profile.experiences,
        github_url: profile.github_url ?? "",
        email: profile.email ?? ""
      });
      setMessage("资料已保存。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page-stack readable">
      <div className="section-heading">
        <h1>个人资料</h1>
      </div>
      {error && <StatusMessage tone="error" message={error} />}
      {message && <StatusMessage tone="success" message={message} />}
      <form className="editor-form" onSubmit={save}>
        <label>
          名称
          <input value={form.name} onChange={(event) => update("name", event.target.value)} required />
        </label>
        <label>
          简介
          <textarea value={form.bio} onChange={(event) => update("bio", event.target.value)} required />
        </label>
        <label>
          兴趣
          <textarea value={form.interests} onChange={(event) => update("interests", event.target.value)} />
        </label>
        <label>
          经历
          <textarea value={form.experiences} onChange={(event) => update("experiences", event.target.value)} />
        </label>
        <label>
          GitHub
          <input value={form.github_url ?? ""} onChange={(event) => update("github_url", event.target.value)} />
        </label>
        <label>
          邮箱
          <input type="email" value={form.email ?? ""} onChange={(event) => update("email", event.target.value)} />
        </label>
        <label>
          头像 URL
          <input value={form.avatar_url ?? ""} onChange={(event) => update("avatar_url", event.target.value)} />
        </label>
        <button className="primary-button wide" type="submit" disabled={saving}>
          <Save aria-hidden="true" /> {saving ? "保存中..." : "保存"}
        </button>
      </form>
    </section>
  );
}

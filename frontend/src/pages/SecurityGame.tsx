import { Bot, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import { useAuth } from "../auth";
import { StatusMessage } from "../components/StatusMessage";
import type { ScoreRow, SecurityGameResult, SecurityQuestion } from "../types";

const missionCatalog = [
  { id: "phishing-detective", title: "Phishing Detective", description: "识别钓鱼邮件与伪装链接", difficulty: "easy" },
  { id: "url-inspector", title: "URL Inspector", description: "判断可疑链接和跳转风险", difficulty: "easy" },
  { id: "password-audit", title: "Password Audit", description: "判断密码强度与泄露风险", difficulty: "medium" },
  { id: "xss-hunter", title: "XSS Hunter", description: "识别危险输入与脚本注入", difficulty: "medium" },
  { id: "sql-injection-guard", title: "SQL Injection Guard", description: "判断 SQL 注入风险", difficulty: "medium" },
  { id: "vulnerability-scan", title: "Vulnerability Scan", description: "审计代码片段与日志泄露", difficulty: "medium" },
  { id: "packet-detective", title: "Packet Detective", description: "分析模拟抓包与异常请求", difficulty: "medium" },
];

function titleizeGameName(name: string) {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function SecurityGame() {
  const { user } = useAuth();
  const [games, setGames] = useState<string[]>([]);
  const [gameName, setGameName] = useState("phishing-detective");
  const [questions, setQuestions] = useState<SecurityQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<SecurityGameResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<ScoreRow[]>([]);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [error, setError] = useState("");
  const [aiDraft, setAiDraft] = useState("");
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const gameLabel = useMemo(() => titleizeGameName(gameName), [gameName]);
  const mission = useMemo(
    () => missionCatalog.find((item) => item.id === gameName) ?? { id: gameName, title: gameLabel, description: "安全判断任务", difficulty: "normal" },
    [gameLabel, gameName],
  );
  const availableMissionNames = useMemo(() => new Set(games), [games]);
  const answeredCount = Object.keys(answers).length;
  const accuracy = result && result.total_count > 0 ? `${Math.round((result.correct_count / result.total_count) * 100)}%` : "--";

  const loadGame = (name: string) => {
    setError("");
    setResult(null);
    setAnswers({});
    setStartedAt(Date.now());
    Promise.all([api.questions(name), api.leaderboard(name)])
      .then(([questionData, scoreData]) => {
        setQuestions(questionData);
        setLeaderboard(scoreData);
      })
      .catch((err: Error) => setError(err.message));
  };

  const selectGame = (name: string) => {
    if (name === gameName) {
      return;
    }
    setGameName(name);
    loadGame(name);
  };

  useEffect(() => {
    api.track("page_view", "/security-game");
    api.gameNames().then((names) => {
      setGames(names);
      const first = names[0] ?? gameName;
      setGameName(first);
      loadGame(first);
    });
  }, []);

  const submit = async () => {
    if (!user) {
      setError("登录后可以提交成绩。");
      return;
    }
    if (questions.length === 0 || Object.keys(answers).length !== questions.length) {
      setError("请先完成所有题目再提交成绩。");
      return;
    }
    setError("");
    setSubmitting(true);
    const payload = Object.entries(answers).map(([question_id, answer]) => ({ question_id: Number(question_id), answer }));
    const duration = Math.round((Date.now() - startedAt) / 1000);
    try {
      const data = await api.submitGame(gameName, payload, duration);
      setResult(data);
      setLeaderboard(await api.leaderboard(gameName));
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const generateQuestionDraft = async () => {
    if (user?.role !== "admin") {
      setError("管理员登录后可以生成 AI 题目草稿。");
      return;
    }
    setError("");
    setAiDraft("");
    setAiDraftLoading(true);
    try {
      const data = await api.generateSecurityQuestion(mission.title, mission.difficulty === "easy" ? "easy" : "medium");
      setAiDraft(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 题目生成失败");
    } finally {
      setAiDraftLoading(false);
    }
  };

  return (
    <section className="page-stack security-lab-page">
      <header className="security-lab-hero">
        <div className="security-lab-copy">
          <span className="lab-eyebrow">Security Lab Challenge</span>
          <h1>Security Lab</h1>
          <p>完成安全判断任务，提交成绩并冲击排行榜。</p>
          <div className="current-mission">
            <span>current mission</span>
            <strong>{mission.title}</strong>
            <small>{mission.description}</small>
          </div>
        </div>
        <div className="mission-select-card">
          <div>
            <span className="quiz-kicker">Mission Select</span>
            <p>选择一个安全任务开始挑战</p>
          </div>
          <div className="mission-chip-grid" aria-label="planned security missions">
            {missionCatalog.map((item) => {
              const isActive = item.id === gameName;
              const isAvailable = availableMissionNames.has(item.id);
              const missionMeta = isActive ? `${item.difficulty} · ${questions.length} questions` : isAvailable ? `${item.difficulty} · ready` : `${item.difficulty} · coming soon`;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={isActive ? "active" : isAvailable ? "available" : "coming-soon"}
                  disabled={!isAvailable}
                  aria-pressed={isActive}
                  title={isAvailable ? item.description : `${item.description} · coming soon`}
                  onClick={() => selectGame(item.id)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                  <small>{missionMeta}</small>
                </button>
              );
            })}
          </div>
        </div>
      </header>
      {user?.role === "admin" && (
        <section className="ai-question-panel">
          <div>
            <span className="quiz-kicker">
              <Bot aria-hidden="true" /> AI Mission Draft
            </span>
            <p>使用 DeepSeek 根据当前任务生成安全题目草稿，人工审核后再加入正式题库。</p>
          </div>
          <button className="secondary-button" type="button" onClick={generateQuestionDraft} disabled={aiDraftLoading}>
            {aiDraftLoading ? "Generating..." : "Generate Draft"}
          </button>
          {aiDraft && <pre>{aiDraft}</pre>}
        </section>
      )}
      {error && <StatusMessage tone="error" message={error} />}
      <div className="security-lab-layout">
        <div className="mission-column">
          <div className="quiz-list incident-list">
            {questions.map((question, index) => {
              const detail = result?.details.find((item) => item.question_id === question.id);
              return (
                <div className="quiz-card incident-card" key={question.id}>
                  <div className="incident-head">
                    <span>Mission {String(index + 1).padStart(2, "0")}</span>
                    <strong>{mission.title}</strong>
                    <span>{question.category}</span>
                  </div>
                  <h2>{question.question}</h2>
                  <div className="option-grid">
                    {question.options.map((option, optionIndex) => (
                      <button
                        key={option}
                        type="button"
                        className={answers[question.id] === String(optionIndex) ? "selected" : ""}
                        onClick={() => setAnswers((current) => ({ ...current, [question.id]: String(optionIndex) }))}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {detail && <StatusMessage tone={detail.correct ? "success" : "error"} message={detail.explanation} />}
                </div>
              );
            })}
          </div>
          <div className="challenge-actions">
            <button className="primary-button wide" onClick={submit} type="button" disabled={submitting || questions.length === 0}>
              {submitting ? "Submitting..." : "Submit Challenge"}
            </button>
            {result && (
              <div className="result-band">
                <Trophy aria-hidden="true" />
                <strong>{result.score}</strong>
                <span>
                  {result.correct_count}/{result.total_count}
                </span>
              </div>
            )}
          </div>
        </div>
        <aside className="security-lab-aside">
          <section className="score-panel">
            <h2>Score Panel</h2>
            <div className="score-grid">
              <div>
                <span>current score</span>
                <strong>{result?.score ?? 0}</strong>
              </div>
              <div>
                <span>answered</span>
                <strong>
                  {answeredCount}/{questions.length}
                </strong>
              </div>
              <div>
                <span>accuracy</span>
                <strong>{accuracy}</strong>
              </div>
              <div>
                <span>current mission</span>
                <strong>{mission.title}</strong>
              </div>
            </div>
          </section>
          <section className="leaderboard lab-leaderboard">
            <h2>Leaderboard</h2>
            <div className="lab-leaderboard-table">
              <div className="lab-leaderboard-head">
                <span>rank</span>
                <span>operator</span>
                <span>score</span>
                <span>accuracy</span>
                <span>time</span>
              </div>
              {leaderboard.length > 0 ? (
                leaderboard.map((row, index) => (
                  <div className="lab-leaderboard-row" key={row.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{row.username}</strong>
                    <span>{row.score}</span>
                    <span>{row.total_count > 0 ? `${Math.round((row.correct_count / row.total_count) * 100)}%` : "--"}</span>
                    <span>{formatDuration(row.duration_seconds)}</span>
                  </div>
                ))
              ) : (
                <p className="empty-board">暂无挑战记录，完成一次任务后生成排行。</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

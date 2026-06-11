import { Bot, FilePlus2, Newspaper, Save, ShieldQuestion, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { StatusMessage } from "../components/StatusMessage";
import type { AiDigestKind, SecurityQuestionDraft } from "../types";

const digestOptions: Array<{ kind: AiDigestKind; label: string; description: string }> = [
  { kind: "daily-news", label: "每日新闻 / 大会", description: "整理 Web、安全、AI 方向的简报模板" },
  { kind: "github-trending", label: "GitHub Trending", description: "解读项目价值、使用场景和可学习点" },
  { kind: "papers", label: "论文 Digest", description: "生成论文阅读摘要和实践连接" },
  { kind: "llm-security", label: "LLM Security Digest", description: "聚焦 Prompt Injection、Agent 安全和防护方案" }
];

const emptyQuestion: SecurityQuestionDraft = {
  game_name: "phishing-detective",
  question: "",
  options: ["", "", "", ""],
  answer: "0",
  explanation: "",
  difficulty: "medium",
  category: "web-security"
};

function extractTitle(markdown: string, fallback: string) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return (heading || fallback).slice(0, 200);
}

function extractSummary(markdown: string) {
  const clean = markdown
    .replace(/^# .+$/m, "")
    .split("\n")
    .map((line) => line.replace(/^[-*>#\s]+/, "").trim())
    .find((line) => line.length > 20);
  return (clean || "AI 生成的技术草稿，待人工审核和补充来源。").slice(0, 500);
}

function parseQuestionDraft(text: string, topic: string, difficulty: "easy" | "medium" | "hard"): SecurityQuestionDraft {
  const fenced = text.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
  const jsonText = fenced.match(/\{[\s\S]*\}/)?.[0] ?? fenced;
  try {
    const data = JSON.parse(jsonText) as {
      question?: string;
      options?: string[];
      answer?: number | string;
      explanation?: string;
      category?: string;
    };
    const options = Array.isArray(data.options) ? data.options.slice(0, 6).map(String) : emptyQuestion.options;
    const answer = typeof data.answer === "number" ? String(data.answer) : String(data.answer ?? "0");
    const optionAnswer = options.includes(answer) ? String(options.indexOf(answer)) : answer;
    return {
      game_name: topic.toLowerCase().replace(/\s+/g, "-"),
      question: String(data.question ?? ""),
      options: options.length >= 2 ? options : emptyQuestion.options,
      answer: optionAnswer,
      explanation: String(data.explanation ?? ""),
      difficulty,
      category: String(data.category ?? topic)
    };
  } catch {
    return {
      ...emptyQuestion,
      game_name: topic.toLowerCase().replace(/\s+/g, "-"),
      question: text.slice(0, 1000),
      difficulty,
      category: topic
    };
  }
}

export function AdminAi() {
  const [aiStatus, setAiStatus] = useState("checking");
  const [model, setModel] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [draftTitle, setDraftTitle] = useState("LLM Security 实践笔记");
  const [draftKeywords, setDraftKeywords] = useState("LLM Security, Prompt Injection, Web Security");
  const [draftTone, setDraftTone] = useState("technical notebook");
  const [draftText, setDraftText] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [createdPostId, setCreatedPostId] = useState<number | null>(null);

  const [digestKind, setDigestKind] = useState<AiDigestKind>("llm-security");
  const [digestFocus, setDigestFocus] = useState("Web security, AI engineering, LLM security");
  const [digestSource, setDigestSource] = useState("");
  const [digestText, setDigestText] = useState("");
  const [digestLoading, setDigestLoading] = useState(false);

  const [questionTopic, setQuestionTopic] = useState("xss hunter");
  const [questionDifficulty, setQuestionDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionText, setQuestionText] = useState("");
  const [questionDraft, setQuestionDraft] = useState<SecurityQuestionDraft>(emptyQuestion);
  const [questionLoading, setQuestionLoading] = useState(false);

  const selectedDigest = useMemo(() => digestOptions.find((item) => item.kind === digestKind) ?? digestOptions[0], [digestKind]);

  useEffect(() => {
    api.aiEnabled()
      .then((status) => {
        setAiStatus(status.enabled ? "enabled" : "disabled");
        setModel(status.model);
      })
      .catch((err: Error) => {
        setAiStatus("unknown");
        setError(err.message);
      });
  }, []);

  const clearNotice = () => {
    setMessage("");
    setError("");
  };

  const generateDraft = async (event: FormEvent) => {
    event.preventDefault();
    clearNotice();
    setDraftLoading(true);
    setCreatedPostId(null);
    try {
      const keywords = draftKeywords.split(",").map((item) => item.trim()).filter(Boolean);
      const result = await api.draftPost(draftTitle, keywords, draftTone);
      setDraftText(result.text);
      setMessage("文章草稿已生成，保存前请人工检查。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成文章草稿失败");
    } finally {
      setDraftLoading(false);
    }
  };

  const saveDraftPost = async (content: string, fallbackTitle: string) => {
    clearNotice();
    try {
      const post = await api.createPost({
        title: extractTitle(content, fallbackTitle),
        summary: extractSummary(content),
        content,
        status: "draft"
      });
      setCreatedPostId(post.id);
      setMessage("已保存为草稿文章。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存草稿失败");
    }
  };

  const generateDigest = async (event: FormEvent) => {
    event.preventDefault();
    clearNotice();
    setDigestLoading(true);
    setCreatedPostId(null);
    try {
      const result = await api.generateDigest(digestKind, digestSource, digestFocus);
      setDigestText(result.text);
      setMessage("Digest 已生成，发布前建议补充可验证来源。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成 Digest 失败");
    } finally {
      setDigestLoading(false);
    }
  };

  const generateQuestion = async (event: FormEvent) => {
    event.preventDefault();
    clearNotice();
    setQuestionLoading(true);
    try {
      const result = await api.generateSecurityQuestion(questionTopic, questionDifficulty);
      const parsed = parseQuestionDraft(result.text, questionTopic, questionDifficulty);
      setQuestionText(result.text);
      setQuestionDraft(parsed);
      setMessage("题目草稿已生成，请审核后入库。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成安全题目失败");
    } finally {
      setQuestionLoading(false);
    }
  };

  const updateQuestionOption = (index: number, value: string) => {
    setQuestionDraft((current) => ({
      ...current,
      options: current.options.map((item, optionIndex) => (optionIndex === index ? value : item))
    }));
  };

  const saveQuestion = async () => {
    clearNotice();
    try {
      const saved = await api.createSecurityQuestion(questionDraft);
      setMessage(`题目已入库：${saved.game_name} #${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "题目入库失败");
    }
  };

  return (
    <section className="page-stack admin-ai-page">
      <div className="section-heading">
        <div>
          <span className="lab-eyebrow">
            <Bot aria-hidden="true" /> Admin AI Console
          </span>
          <h1>AI 后台工具</h1>
        </div>
        <span className={`ai-status-pill ${aiStatus}`}>{aiStatus === "enabled" ? `DeepSeek · ${model}` : `AI ${aiStatus}`}</span>
      </div>

      {error && <StatusMessage tone="error" message={error} />}
      {message && <StatusMessage tone="success" message={message} />}
      {createdPostId && (
        <Link className="secondary-button compact" to={`/admin/posts/${createdPostId}/edit`}>
          编辑刚保存的草稿
        </Link>
      )}

      <div className="admin-ai-grid">
        <section className="admin-ai-panel">
          <div className="admin-ai-panel-head">
            <FilePlus2 aria-hidden="true" />
            <div>
              <h2>文章草稿生成</h2>
              <p>输入主题和关键词，生成 Markdown 草稿并保存为未发布文章。</p>
            </div>
          </div>
          <form className="editor-form compact-form" onSubmit={generateDraft}>
            <label>
              主题
              <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} required maxLength={200} />
            </label>
            <label>
              关键词
              <input value={draftKeywords} onChange={(event) => setDraftKeywords(event.target.value)} />
            </label>
            <label>
              语气
              <input value={draftTone} onChange={(event) => setDraftTone(event.target.value)} maxLength={80} />
            </label>
            <button className="primary-button" type="submit" disabled={draftLoading}>
              <Sparkles aria-hidden="true" /> {draftLoading ? "Generating..." : "生成文章草稿"}
            </button>
          </form>
          {draftText && (
            <div className="ai-output-panel">
              <pre>{draftText}</pre>
              <button className="secondary-button" type="button" onClick={() => saveDraftPost(draftText, draftTitle)}>
                <Save aria-hidden="true" /> 保存为草稿
              </button>
            </div>
          )}
        </section>

        <section className="admin-ai-panel">
          <div className="admin-ai-panel-head">
            <Newspaper aria-hidden="true" />
            <div>
              <h2>自动 Digest</h2>
              <p>{selectedDigest.description}</p>
            </div>
          </div>
          <form className="editor-form compact-form" onSubmit={generateDigest}>
            <label>
              类型
              <select value={digestKind} onChange={(event) => setDigestKind(event.target.value as AiDigestKind)}>
                {digestOptions.map((item) => (
                  <option key={item.kind} value={item.kind}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              关注方向
              <input value={digestFocus} onChange={(event) => setDigestFocus(event.target.value)} maxLength={120} />
            </label>
            <label>
              素材 / 链接 / 粘贴内容
              <textarea value={digestSource} onChange={(event) => setDigestSource(event.target.value)} rows={6} />
            </label>
            <button className="primary-button" type="submit" disabled={digestLoading}>
              <Sparkles aria-hidden="true" /> {digestLoading ? "Generating..." : "生成 Digest"}
            </button>
          </form>
          {digestText && (
            <div className="ai-output-panel">
              <pre>{digestText}</pre>
              <button className="secondary-button" type="button" onClick={() => saveDraftPost(digestText, selectedDigest.label)}>
                <Save aria-hidden="true" /> 转成草稿文章
              </button>
            </div>
          )}
        </section>

        <section className="admin-ai-panel admin-ai-panel-wide">
          <div className="admin-ai-panel-head">
            <ShieldQuestion aria-hidden="true" />
            <div>
              <h2>安全题目生成与入库</h2>
              <p>先由 DeepSeek 生成 JSON 草稿，人工校对后写入 Security Lab 题库。</p>
            </div>
          </div>
          <form className="editor-form compact-form ai-question-builder" onSubmit={generateQuestion}>
            <label>
              主题
              <input value={questionTopic} onChange={(event) => setQuestionTopic(event.target.value)} required maxLength={80} />
            </label>
            <label>
              难度
              <select value={questionDifficulty} onChange={(event) => setQuestionDifficulty(event.target.value as "easy" | "medium" | "hard")}>
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </label>
            <button className="primary-button" type="submit" disabled={questionLoading}>
              <Sparkles aria-hidden="true" /> {questionLoading ? "Generating..." : "生成题目草稿"}
            </button>
          </form>

          {questionText && (
            <div className="ai-review-grid">
              <div className="ai-output-panel">
                <span className="quiz-kicker">raw ai output</span>
                <pre>{questionText}</pre>
              </div>
              <div className="ai-question-review">
                <label>
                  game_name
                  <input value={questionDraft.game_name} onChange={(event) => setQuestionDraft({ ...questionDraft, game_name: event.target.value })} />
                </label>
                <label>
                  question
                  <textarea value={questionDraft.question} onChange={(event) => setQuestionDraft({ ...questionDraft, question: event.target.value })} rows={4} />
                </label>
                <div className="ai-option-list">
                  {questionDraft.options.map((option, index) => (
                    <label key={index}>
                      option {index}
                      <input value={option} onChange={(event) => updateQuestionOption(index, event.target.value)} />
                    </label>
                  ))}
                </div>
                <div className="ai-review-row">
                  <label>
                    answer
                    <select value={questionDraft.answer} onChange={(event) => setQuestionDraft({ ...questionDraft, answer: event.target.value })}>
                      {questionDraft.options.map((option, index) => (
                        <option key={index} value={String(index)}>
                          {index} · {option || "empty option"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    difficulty
                    <select
                      value={questionDraft.difficulty}
                      onChange={(event) => setQuestionDraft({ ...questionDraft, difficulty: event.target.value as "easy" | "medium" | "hard" })}
                    >
                      <option value="easy">easy</option>
                      <option value="medium">medium</option>
                      <option value="hard">hard</option>
                    </select>
                  </label>
                </div>
                <label>
                  category
                  <input value={questionDraft.category} onChange={(event) => setQuestionDraft({ ...questionDraft, category: event.target.value })} />
                </label>
                <label>
                  explanation
                  <textarea value={questionDraft.explanation} onChange={(event) => setQuestionDraft({ ...questionDraft, explanation: event.target.value })} rows={4} />
                </label>
                <button className="secondary-button" type="button" onClick={saveQuestion}>
                  <Save aria-hidden="true" /> 审核通过，写入题库
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

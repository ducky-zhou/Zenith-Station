import { Activity, Filter, Radar, RotateCcw, Send, ShieldAlert, ShieldCheck, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import { useAuth } from "../auth";
import { StatusMessage } from "../components/StatusMessage";
import type { ScoreRow } from "../types";

type ArcadeMode = "firewall" | "packet";
type FirewallAction = "allow" | "block" | "review";
type PacketFilter = "all" | "http" | "dns" | "auth" | "internal";

type FirewallEvent = {
  id: string;
  method: string;
  path: string;
  source: string;
  signal: string;
  threat: string;
  correct: FirewallAction;
};

type PacketEvent = {
  id: string;
  time: string;
  src: string;
  dst: string;
  protocol: PacketFilter;
  summary: string;
  payload: string;
  suspicious: boolean;
  reason: string;
};

const firewallEvents: FirewallEvent[] = [
  { id: "fw-01", method: "GET", path: "/api/user?id=1", source: "10.0.2.21", signal: "normal api read", threat: "benign", correct: "allow" },
  { id: "fw-02", method: "POST", path: "/login?user=admin' OR '1'='1", source: "45.91.82.10", signal: "SQL token in auth request", threat: "sql injection", correct: "block" },
  { id: "fw-03", method: "GET", path: "/search?q=<script>alert(1)</script>", source: "172.16.4.8", signal: "script tag in query", threat: "xss probe", correct: "block" },
  { id: "fw-04", method: "POST", path: "/api/profile/avatar", source: "10.0.2.44", signal: "authenticated upload", threat: "needs review", correct: "review" },
  { id: "fw-05", method: "GET", path: "/.env", source: "185.220.101.42", signal: "secret file probe", threat: "secret scan", correct: "block" },
  { id: "fw-06", method: "GET", path: "/posts?q=LLM%20Security", source: "10.0.2.17", signal: "normal search", threat: "benign", correct: "allow" },
  { id: "fw-07", method: "POST", path: "/api/comments", source: "10.0.2.88", signal: "high frequency comment burst", threat: "rate-limit candidate", correct: "review" },
  { id: "fw-08", method: "GET", path: "/admin.php", source: "203.0.113.9", signal: "legacy admin scan", threat: "recon", correct: "block" },
  { id: "fw-09", method: "GET", path: "/assets/index.css", source: "10.0.2.11", signal: "static asset", threat: "benign", correct: "allow" },
  { id: "fw-10", method: "POST", path: "/api/auth/login", source: "198.51.100.33", signal: "72 attempts / minute", threat: "bruteforce", correct: "block" },
];

const packetEvents: PacketEvent[] = [
  {
    id: "pkt-01",
    time: "00:01.207",
    src: "10.0.2.12",
    dst: "120.27.203.146",
    protocol: "http",
    summary: "GET /posts/2",
    payload: "Accept: text/html",
    suspicious: false,
    reason: "正常文章访问",
  },
  {
    id: "pkt-02",
    time: "00:03.441",
    src: "10.0.2.44",
    dst: "120.27.203.146",
    protocol: "auth",
    summary: "POST /login over HTTP",
    payload: "email=admin@example.com&password=123456",
    suspicious: true,
    reason: "明文登录请求泄露密码",
  },
  {
    id: "pkt-03",
    time: "00:04.002",
    src: "45.91.82.10",
    dst: "120.27.203.146",
    protocol: "http",
    summary: "GET /search?q=' OR 1=1--",
    payload: "User-Agent: sqlmap/1.8",
    suspicious: true,
    reason: "SQL 注入扫描特征",
  },
  {
    id: "pkt-04",
    time: "00:06.810",
    src: "10.0.2.1",
    dst: "8.8.8.8",
    protocol: "dns",
    summary: "A api.github.com",
    payload: "standard query response",
    suspicious: false,
    reason: "正常 DNS 查询",
  },
  {
    id: "pkt-05",
    time: "00:08.331",
    src: "120.27.203.146",
    dst: "198.51.100.77",
    protocol: "internal",
    summary: "Outbound POST /collect",
    payload: "Authorization: Bearer eyJhbGciOi...",
    suspicious: true,
    reason: "服务端向陌生地址外传 token",
  },
  {
    id: "pkt-06",
    time: "00:10.117",
    src: "10.0.2.21",
    dst: "120.27.203.146",
    protocol: "http",
    summary: "GET /assets/index.js",
    payload: "cache hit",
    suspicious: false,
    reason: "正常静态资源请求",
  },
  {
    id: "pkt-07",
    time: "00:11.502",
    src: "203.0.113.9",
    dst: "120.27.203.146",
    protocol: "http",
    summary: "GET /.git/config",
    payload: "probe repository metadata",
    suspicious: true,
    reason: "敏感路径探测",
  },
  {
    id: "pkt-08",
    time: "00:14.209",
    src: "10.0.2.53",
    dst: "120.27.203.146",
    protocol: "auth",
    summary: "POST /api/auth/login",
    payload: "normal login, TLS terminated at proxy",
    suspicious: false,
    reason: "正常认证请求",
  },
];

function formatDuration(seconds: number) {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const rest = Math.max(0, seconds) % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function scoreFrom(correct: number, wrong: number, total: number, elapsed: number) {
  const base = correct * 120 - wrong * 45;
  const timeBonus = Math.max(0, 180 - elapsed) * 2;
  const completion = correct === total ? 150 : 0;
  return Math.max(0, base + timeBonus + completion);
}

function ArcadeLeaderboard({ rows }: { rows: ScoreRow[] }) {
  return (
    <section className="leaderboard lab-leaderboard arcade-leaderboard">
      <h2>Leaderboard</h2>
      <div className="lab-leaderboard-table">
        <div className="lab-leaderboard-head">
          <span>#</span>
          <span>operator</span>
          <span>score</span>
          <span>acc.</span>
          <span>time</span>
        </div>
        {rows.length > 0 ? (
          rows.map((row, index) => (
            <div className="lab-leaderboard-row" key={row.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{row.username}</strong>
              <span>{row.score}</span>
              <span>{row.total_count > 0 ? `${Math.round((row.correct_count / row.total_count) * 100)}%` : "--"}</span>
              <span>{formatDuration(row.duration_seconds)}</span>
            </div>
          ))
        ) : (
          <p className="empty-board">暂无记录，完成一次任务后生成排行。</p>
        )}
      </div>
    </section>
  );
}

export function SecurityArcade() {
  const { user } = useAuth();
  const [mode, setMode] = useState<ArcadeMode>("firewall");
  const [startedAt, setStartedAt] = useState(Date.now());
  const [firewallIndex, setFirewallIndex] = useState(0);
  const [firewallHistory, setFirewallHistory] = useState<Array<{ event: FirewallEvent; action: FirewallAction; correct: boolean }>>([]);
  const [packetFilter, setPacketFilter] = useState<PacketFilter>("all");
  const [selectedPacketId, setSelectedPacketId] = useState(packetEvents[0].id);
  const [markedPackets, setMarkedPackets] = useState<string[]>([]);
  const [packetSubmitted, setPacketSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ScoreRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  const gameName = mode === "firewall" ? "web-firewall-interceptor" : "packet-detective-arcade";
  const elapsed = Math.round((now - startedAt) / 1000);
  const firewallDone = firewallIndex >= firewallEvents.length;
  const firewallCorrect = firewallHistory.filter((item) => item.correct).length;
  const firewallWrong = firewallHistory.length - firewallCorrect;
  const firewallScore = scoreFrom(firewallCorrect, firewallWrong, firewallEvents.length, elapsed);
  const filteredPackets = packetEvents.filter((packet) => packetFilter === "all" || packet.protocol === packetFilter);
  const selectedPacket = packetEvents.find((packet) => packet.id === selectedPacketId) ?? packetEvents[0];
  const packetHits = markedPackets.filter((id) => packetEvents.find((packet) => packet.id === id)?.suspicious).length;
  const packetFalsePositives = markedPackets.length - packetHits;
  const packetTotalSuspicious = packetEvents.filter((packet) => packet.suspicious).length;
  const packetScore = scoreFrom(packetHits, packetFalsePositives, packetTotalSuspicious, elapsed);
  const currentScore = mode === "firewall" ? firewallScore : packetScore;
  const currentCorrect = mode === "firewall" ? firewallCorrect : packetHits;
  const currentTotal = mode === "firewall" ? firewallEvents.length : packetTotalSuspicious;

  useEffect(() => {
    api.track("page_view", "/security-arcade");
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setMessage("");
    setError("");
    api.leaderboard(gameName).then(setLeaderboard).catch(() => setLeaderboard([]));
  }, [gameName]);

  const resetGame = (nextMode = mode) => {
    setMode(nextMode);
    setStartedAt(Date.now());
    setNow(Date.now());
    setFirewallIndex(0);
    setFirewallHistory([]);
    setPacketFilter("all");
    setSelectedPacketId(packetEvents[0].id);
    setMarkedPackets([]);
    setPacketSubmitted(false);
    setMessage("");
    setError("");
  };

  const handleFirewallAction = (action: FirewallAction) => {
    if (firewallDone) return;
    const event = firewallEvents[firewallIndex];
    setFirewallHistory((current) => [...current, { event, action, correct: action === event.correct }]);
    setFirewallIndex((current) => current + 1);
  };

  const togglePacketMark = (packetId: string) => {
    if (packetSubmitted) return;
    setMarkedPackets((current) => (current.includes(packetId) ? current.filter((item) => item !== packetId) : [...current, packetId]));
  };

  const submitScore = async () => {
    if (!user) {
      setError("登录后可以提交排行榜成绩。");
      return;
    }
    if (mode === "firewall" && !firewallDone) {
      setError("请先处理完所有请求。");
      return;
    }
    if (mode === "packet") {
      setPacketSubmitted(true);
    }
    setError("");
    const payload = {
      score: currentScore,
      correct_count: currentCorrect,
      total_count: currentTotal,
      duration_seconds: elapsed,
    };
    try {
      await api.submitArcadeScore(gameName, payload);
      setLeaderboard(await api.leaderboard(gameName));
      setMessage("成绩已提交。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    }
  };

  const packetAccuracy = currentTotal > 0 ? `${Math.round((packetHits / currentTotal) * 100)}%` : "--";
  const firewallAccuracy = firewallHistory.length > 0 ? `${Math.round((firewallCorrect / firewallHistory.length) * 100)}%` : "--";

  return (
    <section className="page-stack security-lab-page security-arcade-page">
      <header className="security-lab-hero arcade-hero">
        <div className="security-lab-copy">
          <span className="lab-eyebrow">Security Arcade</span>
          <h1>Interactive Security Ops</h1>
          <p>用点击、筛选和拦截完成安全操作任务，不再只是答题。</p>
          <div className="current-mission">
            <span>active module</span>
            <strong>{mode === "firewall" ? "Web Firewall Interceptor" : "Packet Detective"}</strong>
            <small>{mode === "firewall" ? "拦截攻击流量，放行正常请求" : "筛选抓包流，标记真正异常包"}</small>
          </div>
        </div>
        <div className="arcade-switcher">
          <button className={mode === "firewall" ? "active" : ""} type="button" onClick={() => resetGame("firewall")}>
            <ShieldAlert aria-hidden="true" />
            <strong>Web Firewall Interceptor</strong>
            <span>Allow / Block / Review 实时判流量</span>
          </button>
          <button className={mode === "packet" ? "active" : ""} type="button" onClick={() => resetGame("packet")}>
            <Radar aria-hidden="true" />
            <strong>Packet Detective</strong>
            <span>过滤抓包，点击标记异常数据包</span>
          </button>
        </div>
      </header>

      {error && <StatusMessage tone="error" message={error} />}
      {message && <StatusMessage tone="success" message={message} />}

      <div className="security-lab-layout">
        <main className="mission-column">
          {mode === "firewall" ? (
            <section className="arcade-board firewall-board">
              <div className="arcade-board-head">
                <span>traffic queue</span>
                <strong>
                  {Math.min(firewallIndex + 1, firewallEvents.length)}/{firewallEvents.length}
                </strong>
              </div>
              {!firewallDone ? (
                <article className="request-card">
                  <div className="request-meta">
                    <span>{firewallEvents[firewallIndex].method}</span>
                    <span>{firewallEvents[firewallIndex].source}</span>
                    <span>{firewallEvents[firewallIndex].threat}</span>
                  </div>
                  <code>{firewallEvents[firewallIndex].path}</code>
                  <p>{firewallEvents[firewallIndex].signal}</p>
                  <div className="firewall-actions">
                    <button type="button" onClick={() => handleFirewallAction("allow")}>
                      <ShieldCheck aria-hidden="true" /> Allow
                    </button>
                    <button type="button" onClick={() => handleFirewallAction("block")}>
                      <ShieldAlert aria-hidden="true" /> Block
                    </button>
                    <button type="button" onClick={() => handleFirewallAction("review")}>
                      <Activity aria-hidden="true" /> Review
                    </button>
                  </div>
                </article>
              ) : (
                <div className="arcade-complete">
                  <Trophy aria-hidden="true" />
                  <strong>Firewall run complete</strong>
                  <span>
                    {firewallCorrect}/{firewallEvents.length} correct · score {firewallScore}
                  </span>
                </div>
              )}
              <div className="event-stream">
                {firewallHistory.slice(-5).map((item) => (
                  <div className={item.correct ? "good" : "bad"} key={item.event.id}>
                    <span>{item.action.toUpperCase()}</span>
                    <strong>{item.event.path}</strong>
                    <small>expected {item.event.correct}</small>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="arcade-board packet-board">
              <div className="packet-toolbar">
                <span>
                  <Filter aria-hidden="true" /> filters
                </span>
                {(["all", "http", "dns", "auth", "internal"] as PacketFilter[]).map((filter) => (
                  <button key={filter} className={packetFilter === filter ? "active" : ""} type="button" onClick={() => setPacketFilter(filter)}>
                    {filter}
                  </button>
                ))}
              </div>
              <div className="packet-grid">
                <div className="packet-list">
                  {filteredPackets.map((packet) => {
                    const marked = markedPackets.includes(packet.id);
                    return (
                      <button
                        key={packet.id}
                        type="button"
                        className={[selectedPacketId === packet.id ? "active" : "", marked ? "marked" : "", packetSubmitted && packet.suspicious ? "truth" : ""].join(" ")}
                        onClick={() => setSelectedPacketId(packet.id)}
                        onDoubleClick={() => togglePacketMark(packet.id)}
                      >
                        <span>{packet.time}</span>
                        <strong>{packet.summary}</strong>
                        <small>
                          {packet.src} {" -> "} {packet.dst}
                        </small>
                      </button>
                    );
                  })}
                </div>
                <aside className="packet-inspector">
                  <span>{selectedPacket.protocol.toUpperCase()} packet</span>
                  <strong>{selectedPacket.summary}</strong>
                  <code>{selectedPacket.payload}</code>
                  <p>{packetSubmitted ? selectedPacket.reason : "检查 payload 和流向，判断是否需要标记为 suspicious。"}</p>
                  <button type="button" onClick={() => togglePacketMark(selectedPacket.id)} disabled={packetSubmitted}>
                    {markedPackets.includes(selectedPacket.id) ? "Unmark packet" : "Mark suspicious"}
                  </button>
                </aside>
              </div>
            </section>
          )}

          <div className="challenge-actions">
            <button className="primary-button wide" onClick={submitScore} type="button">
              <Send aria-hidden="true" /> Submit Score
            </button>
            <button className="secondary-button" onClick={() => resetGame()} type="button">
              <RotateCcw aria-hidden="true" /> Reset
            </button>
          </div>
        </main>

        <aside className="security-lab-aside">
          <section className="score-panel">
            <h2>Score Panel</h2>
            <div className="score-grid">
              <div>
                <span>score</span>
                <strong>{currentScore}</strong>
              </div>
              <div>
                <span>accuracy</span>
                <strong>{mode === "firewall" ? firewallAccuracy : packetAccuracy}</strong>
              </div>
              <div>
                <span>mistakes</span>
                <strong>{mode === "firewall" ? firewallWrong : packetFalsePositives}</strong>
              </div>
              <div>
                <span>time</span>
                <strong>{formatDuration(elapsed)}</strong>
              </div>
            </div>
          </section>
          <ArcadeLeaderboard rows={leaderboard} />
        </aside>
      </div>
    </section>
  );
}

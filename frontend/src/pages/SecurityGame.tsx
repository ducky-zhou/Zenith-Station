import { Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import { useAuth } from "../auth";
import { StatusMessage } from "../components/StatusMessage";
import type { ScoreRow, SecurityGameResult, SecurityQuestion } from "../types";

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

  const gameLabel = useMemo(() => gameName.replaceAll("-", " "), [gameName]);

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
    const payload = Object.entries(answers).map(([question_id, answer]) => ({ question_id: Number(question_id), answer }));
    const duration = Math.round((Date.now() - startedAt) / 1000);
    const data = await api.submitGame(gameName, payload, duration);
    setResult(data);
    setLeaderboard(await api.leaderboard(gameName));
  };

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <h1>安全闯关</h1>
          <p>{gameLabel}</p>
        </div>
        <select
          value={gameName}
          onChange={(event) => {
            setGameName(event.target.value);
            loadGame(event.target.value);
          }}
        >
          {games.map((game) => (
            <option key={game} value={game}>
              {game}
            </option>
          ))}
        </select>
      </div>
      {error && <StatusMessage tone="error" message={error} />}
      <div className="quiz-list">
        {questions.map((question, index) => (
          <div className="quiz-card" key={question.id}>
            <div className="quiz-kicker">
              <span>#{index + 1}</span>
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
            {result?.details.find((item) => item.question_id === question.id) && (
              <StatusMessage
                tone={result.details.find((item) => item.question_id === question.id)?.correct ? "success" : "error"}
                message={result.details.find((item) => item.question_id === question.id)?.explanation ?? ""}
              />
            )}
          </div>
        ))}
      </div>
      <button className="primary-button wide" onClick={submit} type="button">
        提交成绩
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
      <section className="leaderboard">
        <h2>排行榜</h2>
        {leaderboard.map((row, index) => (
          <div className="leaderboard-row" key={row.id}>
            <span>{index + 1}</span>
            <strong>{row.username}</strong>
            <span>{row.score}</span>
          </div>
        ))}
      </section>
    </section>
  );
}

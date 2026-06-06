import { Bomb, Clock3, Flag, RotateCcw } from "lucide-react";
import { MouseEvent, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { api } from "../api/client";

type DifficultyId = "beginner" | "intermediate" | "expert";

type Difficulty = {
  id: DifficultyId;
  label: string;
  rows: number;
  cols: number;
  mines: number;
};

type Mark = "none" | "flag" | "question";

type Cell = {
  mine: boolean;
  revealed: boolean;
  mark: Mark;
  adjacent: number;
  exploded: boolean;
  wrong: boolean;
};

type Phase = "ready" | "playing" | "won" | "lost";

const difficulties: Difficulty[] = [
  { id: "beginner", label: "Beginner", rows: 9, cols: 9, mines: 10 },
  { id: "intermediate", label: "Intermediate", rows: 16, cols: 16, mines: 40 },
  { id: "expert", label: "Expert", rows: 16, cols: 30, mines: 99 }
];

const mineColors = ["", "#2862d6", "#13823b", "#d22a2a", "#7b3fc8", "#8d4b16", "#0d8f9a", "#20293a", "#667085"];
const bestTimeKey = "secblog:minesweeper:best-times";

function emptyBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      revealed: false,
      mark: "none",
      adjacent: 0,
      exploded: false,
      wrong: false
    }))
  );
}

function neighbors(row: number, col: number, rows: number, cols: number) {
  const result: Array<[number, number]> = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) result.push([nr, nc]);
    }
  }
  return result;
}

function buildBoard(difficulty: Difficulty, safeRow: number, safeCol: number): Cell[][] {
  const board = emptyBoard(difficulty.rows, difficulty.cols);
  const safeZone = new Set([
    `${safeRow}:${safeCol}`,
    ...neighbors(safeRow, safeCol, difficulty.rows, difficulty.cols).map(([row, col]) => `${row}:${col}`)
  ]);
  const candidates: Array<[number, number]> = [];

  for (let row = 0; row < difficulty.rows; row += 1) {
    for (let col = 0; col < difficulty.cols; col += 1) {
      if (!safeZone.has(`${row}:${col}`)) candidates.push([row, col]);
    }
  }

  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  candidates.slice(0, difficulty.mines).forEach(([row, col]) => {
    board[row][col].mine = true;
  });

  for (let row = 0; row < difficulty.rows; row += 1) {
    for (let col = 0; col < difficulty.cols; col += 1) {
      board[row][col].adjacent = neighbors(row, col, difficulty.rows, difficulty.cols).filter(([nr, nc]) => board[nr][nc].mine).length;
    }
  }

  return board;
}

function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function revealArea(board: Cell[][], startRow: number, startCol: number) {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const queue: Array<[number, number]> = [[startRow, startCol]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    const key = `${row}:${col}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = board[row][col];
    if (cell.revealed || cell.mark === "flag") continue;
    cell.revealed = true;
    cell.mark = "none";

    if (cell.adjacent !== 0 || cell.mine) continue;
    neighbors(row, col, rows, cols).forEach(([nr, nc]) => {
      const next = board[nr][nc];
      if (!next.revealed && next.mark !== "flag" && !next.mine) queue.push([nr, nc]);
    });
  }
}

function revealAllMines(board: Cell[][], explodedRow?: number, explodedCol?: number) {
  board.forEach((line, row) => {
    line.forEach((cell, col) => {
      if (cell.mine) cell.revealed = true;
      if (cell.mark === "flag" && !cell.mine) cell.wrong = true;
      if (row === explodedRow && col === explodedCol) cell.exploded = true;
    });
  });
}

function markWin(board: Cell[][]) {
  board.forEach((line) => {
    line.forEach((cell) => {
      if (cell.mine) cell.mark = "flag";
    });
  });
}

function hasWon(board: Cell[][], mineCount: number) {
  const all = board.flat();
  return all.filter((cell) => cell.revealed).length === all.length - mineCount;
}

function formatCounter(value: number) {
  const clamped = Math.max(-99, Math.min(999, value));
  if (clamped < 0) return `-${String(Math.abs(clamped)).padStart(2, "0")}`;
  return String(clamped).padStart(3, "0");
}

function readBestTimes(): Partial<Record<DifficultyId, number>> {
  try {
    const raw = window.localStorage.getItem(bestTimeKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeBestTime(id: DifficultyId, seconds: number) {
  const current = readBestTimes();
  if (!current[id] || seconds < current[id]!) {
    current[id] = seconds;
    window.localStorage.setItem(bestTimeKey, JSON.stringify(current));
  }
}

function cellLabel(cell: Cell) {
  if (cell.revealed) {
    if (cell.mine) return "✹";
    return cell.adjacent || "";
  }
  if (cell.mark === "question") return "?";
  return "";
}

export function Minesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty>(difficulties[0]);
  const [board, setBoard] = useState(() => emptyBoard(difficulties[0].rows, difficulties[0].cols));
  const [phase, setPhase] = useState<Phase>("ready");
  const [seconds, setSeconds] = useState(0);
  const [pressedFace, setPressedFace] = useState(false);
  const [bestTimes, setBestTimes] = useState<Partial<Record<DifficultyId, number>>>({});

  const flatBoard = useMemo(() => board.flat(), [board]);
  const flags = useMemo(() => flatBoard.filter((cell) => cell.mark === "flag").length, [flatBoard]);
  const revealed = useMemo(() => flatBoard.filter((cell) => cell.revealed && !cell.mine).length, [flatBoard]);
  const minesLeft = difficulty.mines - flags;
  const totalSafeCells = difficulty.rows * difficulty.cols - difficulty.mines;
  const progress = Math.round((revealed / totalSafeCells) * 100);
  const cellSize = difficulty.id === "expert" ? 27 : difficulty.id === "intermediate" ? 31 : 38;

  useEffect(() => {
    api.track("page_view", "/minesweeper");
    setBestTimes(readBestTimes());
  }, []);

  useEffect(() => {
    if (phase !== "playing") return undefined;
    const timer = window.setInterval(() => setSeconds((value) => Math.min(999, value + 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "won") return;
    writeBestTime(difficulty.id, seconds);
    setBestTimes(readBestTimes());
  }, [difficulty.id, phase, seconds]);

  const reset = (nextDifficulty = difficulty) => {
    setDifficulty(nextDifficulty);
    setBoard(emptyBoard(nextDifficulty.rows, nextDifficulty.cols));
    setPhase("ready");
    setSeconds(0);
    setPressedFace(false);
  };

  const finishMove = (next: Cell[][]) => {
    if (hasWon(next, difficulty.mines)) {
      markWin(next);
      setBoard(next);
      setPhase("won");
      return;
    }
    setBoard(next);
  };

  const reveal = (row: number, col: number) => {
    if (phase === "won" || phase === "lost") return;
    let next = phase === "ready" ? buildBoard(difficulty, row, col) : cloneBoard(board);
    const cell = next[row][col];

    if (cell.mark === "flag") return;
    if (cell.revealed) {
      chord(row, col);
      return;
    }

    if (phase === "ready") setPhase("playing");
    if (cell.mine) {
      revealAllMines(next, row, col);
      setBoard(next);
      setPhase("lost");
      return;
    }

    revealArea(next, row, col);
    finishMove(next);
  };

  const chord = (row: number, col: number) => {
    if (phase !== "playing") return;
    const next = cloneBoard(board);
    const cell = next[row][col];
    if (!cell.revealed || cell.adjacent === 0) return;

    const around = neighbors(row, col, difficulty.rows, difficulty.cols);
    const flagCount = around.filter(([nr, nc]) => next[nr][nc].mark === "flag").length;
    if (flagCount !== cell.adjacent) return;

    const hidden = around.filter(([nr, nc]) => !next[nr][nc].revealed && next[nr][nc].mark !== "flag");
    const mine = hidden.find(([nr, nc]) => next[nr][nc].mine);
    if (mine) {
      revealAllMines(next, mine[0], mine[1]);
      setBoard(next);
      setPhase("lost");
      return;
    }

    hidden.forEach(([nr, nc]) => revealArea(next, nr, nc));
    finishMove(next);
  };

  const cycleMark = (event: MouseEvent<HTMLButtonElement>, row: number, col: number) => {
    event.preventDefault();
    if (phase === "won" || phase === "lost") return;
    const next = cloneBoard(board);
    const cell = next[row][col];
    if (cell.revealed) return;
    cell.mark = cell.mark === "none" ? "flag" : cell.mark === "flag" ? "question" : "none";
    setBoard(next);
  };

  const face = phase === "lost" ? "☹" : phase === "won" ? "😎" : pressedFace ? "😮" : "☺";
  const statusText =
    phase === "won"
      ? "Cleared. All safe cells are open."
      : phase === "lost"
        ? "Boom. Reset the board and try again."
        : "Left click to reveal. Right click cycles flag / question.";

  return (
    <section className="page-stack minesweeper-page">
      <header className="minesweeper-intro">
        <span className="quiz-kicker">Classic Minesweeper</span>
        <h1>Win7 扫雷</h1>
        <p>复刻经典扫雷体验：安全首点、右键插旗、问号标记、数字快速展开和本地最佳成绩。</p>
      </header>

      <div className="winmine-shell">
        <div className="winmine-titlebar">
          <span>
            <Bomb aria-hidden="true" /> Minesweeper
          </span>
          <div className="winmine-controls" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>

        <div className="winmine-menu" aria-label="difficulty">
          {difficulties.map((item) => (
            <button key={item.id} type="button" className={difficulty.id === item.id ? "active" : ""} onClick={() => reset(item)}>
              {item.label}
              <span>
                {item.rows}x{item.cols} / {item.mines}
              </span>
            </button>
          ))}
        </div>

        <div className="minefield-frame">
          <div className="minefield-wrap">
            <div
              className="minefield"
              style={{
                "--cell-size": `${cellSize}px`,
                gridTemplateColumns: `repeat(${difficulty.cols}, var(--cell-size))`
              } as CSSProperties}
            >
              {board.map((line, row) =>
                line.map((cell, col) => (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    className={[
                      "mine-cell",
                      cell.revealed ? "revealed" : "covered",
                      cell.mark === "flag" ? "flagged" : "",
                      cell.mark === "question" ? "questioned" : "",
                      cell.exploded ? "exploded" : "",
                      cell.wrong ? "wrong" : "",
                      cell.adjacent ? `n${cell.adjacent}` : ""
                    ].join(" ")}
                    style={cell.revealed && cell.adjacent ? { color: mineColors[cell.adjacent] } : undefined}
                    onClick={() => reveal(row, col)}
                    onDoubleClick={() => chord(row, col)}
                    onContextMenu={(event) => cycleMark(event, row, col)}
                    onMouseDown={() => {
                      if (phase === "playing" || phase === "ready") setPressedFace(true);
                    }}
                    onMouseUp={() => setPressedFace(false)}
                    onMouseLeave={() => setPressedFace(false)}
                    aria-label={`row ${row + 1} col ${col + 1}`}
                  >
                    {cellLabel(cell)}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="winmine-bottom">
          <div className="round-status" title="Timer">
            <Clock3 aria-hidden="true" />
          </div>
          <span className="glass-counter">{formatCounter(seconds)}</span>
          <button className="smiley-button" type="button" onClick={() => reset()} title="Restart">
            {face}
            <RotateCcw aria-hidden="true" />
          </button>
          <span className="glass-counter mines-left">{formatCounter(minesLeft)}</span>
          <div className="round-status" title="Mines left">
            <Flag aria-hidden="true" />
          </div>
        </div>

        <div className="winmine-status">
          <span>{statusText}</span>
          <span>{progress}% clear</span>
        </div>
      </div>

      <div className="minesweeper-stats">
        <article>
          <span>mode</span>
          <strong>{difficulty.label}</strong>
        </article>
        <article>
          <span>best</span>
          <strong>{bestTimes[difficulty.id] ? `${bestTimes[difficulty.id]}s` : "--"}</strong>
        </article>
        <article>
          <span>opened</span>
          <strong>
            {revealed}/{totalSafeCells}
          </strong>
        </article>
        <article>
          <span>marks</span>
          <strong>{flags}</strong>
        </article>
      </div>

      <p className="minesweeper-hint">
        Tip: right click cycles flag / question / empty. Click an opened number after placing enough flags to clear its neighbors.
      </p>
    </section>
  );
}

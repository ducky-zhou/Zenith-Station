import { Bomb, RotateCcw } from "lucide-react";
import { MouseEvent, useEffect, useMemo, useState } from "react";

import { api } from "../api/client";

type Difficulty = {
  id: "beginner" | "intermediate" | "expert";
  label: string;
  rows: number;
  cols: number;
  mines: number;
};

type Cell = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
  exploded: boolean;
};

const difficulties: Difficulty[] = [
  { id: "beginner", label: "初级", rows: 9, cols: 9, mines: 10 },
  { id: "intermediate", label: "中级", rows: 16, cols: 16, mines: 40 },
  { id: "expert", label: "专家", rows: 16, cols: 30, mines: 99 }
];

const mineColors = ["", "#2563eb", "#16a34a", "#dc2626", "#7c3aed", "#b45309", "#0891b2", "#111827", "#64748b"];

function emptyBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
      exploded: false
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
  const blocked = new Set([`${safeRow}:${safeCol}`, ...neighbors(safeRow, safeCol, difficulty.rows, difficulty.cols).map(([r, c]) => `${r}:${c}`)]);
  const candidates: Array<[number, number]> = [];
  for (let row = 0; row < difficulty.rows; row += 1) {
    for (let col = 0; col < difficulty.cols; col += 1) {
      if (!blocked.has(`${row}:${col}`)) candidates.push([row, col]);
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
      board[row][col].adjacent = neighbors(row, col, difficulty.rows, difficulty.cols).filter(([r, c]) => board[r][c].mine).length;
    }
  }
  return board;
}

function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function revealArea(board: Cell[][], startRow: number, startCol: number) {
  const queue: Array<[number, number]> = [[startRow, startCol]];
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    const cell = board[row][col];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (cell.adjacent !== 0 || cell.mine) continue;
    neighbors(row, col, rows, cols).forEach(([nr, nc]) => {
      const next = board[nr][nc];
      if (!next.revealed && !next.flagged && !next.mine) queue.push([nr, nc]);
    });
  }
}

function hasWon(board: Cell[][], mineCount: number) {
  const all = board.flat();
  return all.filter((cell) => cell.revealed).length === all.length - mineCount;
}

export function Minesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty>(difficulties[0]);
  const [board, setBoard] = useState(() => emptyBoard(difficulties[0].rows, difficulties[0].cols));
  const [phase, setPhase] = useState<"ready" | "playing" | "won" | "lost">("ready");
  const [seconds, setSeconds] = useState(0);

  const flags = useMemo(() => board.flat().filter((cell) => cell.flagged).length, [board]);
  const minesLeft = Math.max(0, difficulty.mines - flags);

  useEffect(() => {
    api.track("page_view", "/minesweeper");
  }, []);

  useEffect(() => {
    if (phase !== "playing") return undefined;
    const timer = window.setInterval(() => setSeconds((value) => Math.min(999, value + 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const reset = (nextDifficulty = difficulty) => {
    setDifficulty(nextDifficulty);
    setBoard(emptyBoard(nextDifficulty.rows, nextDifficulty.cols));
    setPhase("ready");
    setSeconds(0);
  };

  const reveal = (row: number, col: number) => {
    if (phase === "won" || phase === "lost") return;
    let next = phase === "ready" ? buildBoard(difficulty, row, col) : cloneBoard(board);
    if (phase === "ready") setPhase("playing");
    const cell = next[row][col];
    if (cell.flagged || cell.revealed) return;
    if (cell.mine) {
      cell.exploded = true;
      next = next.map((line) => line.map((item) => (item.mine ? { ...item, revealed: true } : item)));
      setBoard(next);
      setPhase("lost");
      return;
    }
    revealArea(next, row, col);
    setBoard(next);
    if (hasWon(next, difficulty.mines)) setPhase("won");
  };

  const toggleFlag = (event: MouseEvent<HTMLButtonElement>, row: number, col: number) => {
    event.preventDefault();
    if (phase === "won" || phase === "lost") return;
    const next = cloneBoard(board);
    const cell = next[row][col];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    setBoard(next);
  };

  return (
    <section className="page-stack minesweeper-page">
      <header className="minesweeper-intro">
        <span className="quiz-kicker">Classic Minesweeper</span>
        <h1>Win7 扫雷</h1>
        <p>左键翻开格子，右键插旗，避开所有地雷。第一下不会踩雷。</p>
      </header>
      <div className="winmine-shell">
        <div className="winmine-titlebar">
          <span>
            <Bomb aria-hidden="true" /> Minesweeper
          </span>
          <div className="winmine-controls">
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="winmine-menu">
          {difficulties.map((item) => (
            <button key={item.id} type="button" className={difficulty.id === item.id ? "active" : ""} onClick={() => reset(item)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="winmine-panel">
          <span className="seven-seg">{String(minesLeft).padStart(3, "0")}</span>
          <button className="smiley-button" type="button" onClick={() => reset()} title="重新开始">
            {phase === "lost" ? "☹" : phase === "won" ? "😎" : "☺"}
            <RotateCcw aria-hidden="true" />
          </button>
          <span className="seven-seg">{String(seconds).padStart(3, "0")}</span>
        </div>
        <div className="minefield-wrap">
          <div
            className="minefield"
            style={{
              gridTemplateColumns: `repeat(${difficulty.cols}, 28px)`
            }}
          >
            {board.map((line, row) =>
              line.map((cell, col) => {
                const label = cell.revealed
                  ? cell.mine
                    ? "雷"
                    : cell.adjacent || ""
                  : cell.flagged
                    ? "旗"
                    : "";
                return (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    className={[
                      "mine-cell",
                      cell.revealed ? "revealed" : "",
                      cell.flagged ? "flagged" : "",
                      cell.exploded ? "exploded" : "",
                      cell.adjacent ? `n${cell.adjacent}` : ""
                    ].join(" ")}
                    style={cell.revealed && cell.adjacent ? { color: mineColors[cell.adjacent] } : undefined}
                    onClick={() => reveal(row, col)}
                    onContextMenu={(event) => toggleFlag(event, row, col)}
                    aria-label={`row ${row + 1} col ${col + 1}`}
                  >
                    {label}
                  </button>
                );
              })
            )}
          </div>
        </div>
        <footer className="winmine-status">
          {phase === "won" ? "任务完成：所有安全格已清理。" : phase === "lost" ? "踩雷了，重新开一局。" : "Ready"}
        </footer>
      </div>
    </section>
  );
}

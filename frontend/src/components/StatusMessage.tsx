export function StatusMessage({ message, tone = "info" }: { message: string; tone?: "info" | "error" | "success" }) {
  return <div className={`status-message ${tone}`}>{message}</div>;
}

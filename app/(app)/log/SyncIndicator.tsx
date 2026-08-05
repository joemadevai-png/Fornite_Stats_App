"use client";

import { SyncStatus } from "@/lib/draft/types";

interface Props {
  status: SyncStatus;
  presenceCount: number;
  onRetry: () => void;
}

function ago(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return `${m}m ago`;
}

/**
 * Reports whether the SERVER has our bytes, not whether a websocket is open.
 * A dead socket with healthy polling still reads "Saved" on purpose: warning
 * about a degraded optimization would train the users to ignore this.
 */
export default function SyncIndicator({ status, presenceCount, onRetry }: Props) {
  let dot = "bg-muted";
  let text = "";
  let pulse = false;
  let tone = "text-muted";

  switch (status.kind) {
    case "loading":
      dot = "bg-muted";
      text = "Syncing...";
      pulse = true;
      break;
    case "saving":
      dot = "bg-orange";
      text = "Saving...";
      pulse = true;
      break;
    case "saved":
      dot = "bg-green-bright";
      text =
        status.lastEditor === "other" && status.lastEditAt > 0
          ? `Saved · other phone ${ago(Date.now() - status.lastEditAt)}`
          : "Saved";
      break;
    case "stale":
      dot = "bg-orange";
      text = "Reconnecting...";
      pulse = true;
      break;
    case "offline":
      dot = "bg-orange";
      text = "Offline · saved on this phone";
      break;
    case "error":
      dot = "bg-red";
      tone = "text-red";
      text = status.message;
      break;
  }

  const body = (
    <span className="flex items-center gap-1.5">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${dot} ${pulse ? "animate-pulse" : ""}`}
      />
      <span className="truncate">{text}</span>
    </span>
  );

  return (
    <div
      className={`flex max-w-[58%] shrink-0 flex-col items-end gap-0.5 pt-1 text-right text-xs ${tone}`}
      aria-live="polite"
    >
      {status.kind === "error" ? (
        <button type="button" onClick={onRetry} className="underline underline-offset-2">
          {body}
        </button>
      ) : (
        body
      )}
      {presenceCount > 1 && (
        <span className="text-[11px] text-muted">{presenceCount} phones</span>
      )}
    </div>
  );
}

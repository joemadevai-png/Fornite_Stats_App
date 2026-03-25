"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function verify(passcode: string) {
    setLoading(true);
    setError(false);

    const res = await fetch("/api/verify-passcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      setError(true);
      setCode("");
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCode(val);
    setError(false);

    if (val.length === 4) {
      verify(val);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">Fort Stats</h1>
        <p className="mt-2 text-sm text-muted">Enter passcode</p>

        <div className="mt-8 flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex h-14 w-12 items-center justify-center rounded-lg border-2 text-2xl font-bold transition-colors ${
                error
                  ? "border-red"
                  : code.length > i
                    ? "border-blue text-foreground"
                    : "border-border text-muted"
              }`}
            >
              {code[i] ? "\u2022" : ""}
            </div>
          ))}
        </div>

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          value={code}
          onChange={handleChange}
          disabled={loading}
          className="absolute opacity-0 pointer-events-none"
          aria-label="Passcode input"
        />

        {/* Invisible tap target to refocus input */}
        <div
          className="mt-4 h-8 cursor-text"
          onClick={() => inputRef.current?.focus()}
        />

        {error && (
          <p className="text-sm text-red">Wrong code</p>
        )}
        {loading && (
          <p className="text-sm text-muted">Checking...</p>
        )}
      </div>
    </div>
  );
}

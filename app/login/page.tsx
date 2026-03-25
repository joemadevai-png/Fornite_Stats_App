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

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete="one-time-code"
          value={code}
          onChange={handleChange}
          disabled={loading}
          placeholder="----"
          className="mt-8 w-40 mx-auto block bg-background border-2 border-border rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-foreground placeholder:text-muted/40 focus:border-blue focus:outline-none transition-colors"
        />

        <div className="mt-4 h-6">
          {error && (
            <p className="text-sm text-red">Wrong code</p>
          )}
          {loading && (
            <p className="text-sm text-muted">Checking...</p>
          )}
        </div>
      </div>
    </div>
  );
}

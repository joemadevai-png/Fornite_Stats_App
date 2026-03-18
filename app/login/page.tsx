"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8">
        <h1 className="text-center text-3xl font-bold text-foreground">
          Fort Stats
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          Track your Fortnite session stats
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-blue"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </button>
        </form>

        {success && (
          <p className="mt-4 text-center text-sm text-green">
            Check your email for the magic link!
          </p>
        )}
        {error && (
          <p className="mt-4 text-center text-sm text-red">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

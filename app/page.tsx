"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

type AspectRatio = "4:5" | "9:16";

interface GenerateTextSuccess {
  success: true;
  campaignId: string;
}

interface GenerateTextFailure {
  success: false;
  error: string;
  details?: unknown;
}

type GenerateTextResponse = GenerateTextSuccess | GenerateTextFailure;

export default function Home() {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [topic, setTopic] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:5");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setAuthError(signInError.message);
    }

    setAuthSubmitting(false);
  }

  async function handleSignUp() {
    setAuthError(null);
    setAuthSubmitting(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setAuthError(signUpError.message);
    } else {
      setAuthError("Check your email to confirm your account, then sign in.");
    }

    setAuthSubmitting(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setCampaignId(null);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCampaignId(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, aspect_ratio: aspectRatio }),
      });

      const data = (await response.json()) as GenerateTextResponse;

      if (!response.ok || !data.success) {
        const failure = data as GenerateTextFailure;
        throw new Error(failure.error ?? "Generation failed");
      }

      setCampaignId(data.campaignId);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-950 text-zinc-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-50">
      <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-6 py-16 sm:px-10">
        <header className="mb-12">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Content Engine
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">
            Generate your next campaign
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
            Enter a marketing topic or pain point. We&apos;ll draft five slides
            with overlays, voiceover scripts, and image prompts.
          </p>
        </header>

        {!user ? (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-zinc-50">Sign in</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Use the test account you created in Supabase, or sign up with
              email.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleSignIn}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-300"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={authSubmitting}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700 disabled:opacity-60"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  disabled={authSubmitting}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700 disabled:opacity-60"
                />
              </div>
              {authError && (
                <p className="text-sm text-red-300" role="alert">
                  {authError}
                </p>
              )}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-60"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  disabled={authSubmitting}
                  onClick={handleSignUp}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-600 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-400 disabled:opacity-60"
                >
                  Sign up
                </button>
              </div>
            </form>
          </section>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-400">
              <span>{user.email}</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="font-medium text-zinc-200 transition hover:text-zinc-50"
              >
                Sign out
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-8"
            >
              <label
                htmlFor="topic"
                className="block text-sm font-medium text-zinc-300"
              >
                Topic / pain point
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="e.g. Founders wasting hours on manual social posting"
                required
                disabled={isLoading}
                className="mt-3 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="mt-8">
                <p className="text-sm font-medium text-zinc-300">Aspect ratio</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setAspectRatio("4:5")}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      aspectRatio === "4:5"
                        ? "border-zinc-200 bg-zinc-100 text-zinc-950"
                        : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className="block text-sm font-semibold">
                      4:5 Portrait
                    </span>
                    <span className="mt-1 block text-xs opacity-70">
                      Carousel / feed creative
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setAspectRatio("9:16")}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      aspectRatio === "9:16"
                        ? "border-zinc-200 bg-zinc-100 text-zinc-950"
                        : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className="block text-sm font-semibold">
                      9:16 Vertical
                    </span>
                    <span className="mt-1 block text-xs opacity-70">
                      Reels / Shorts / TikTok
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || topic.trim().length === 0}
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Generating campaign..." : "Generate campaign"}
              </button>
            </form>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
              >
                {error}
              </div>
            )}

            {campaignId && (
              <section className="mt-8 rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-6">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-400">
                  Campaign ready
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
                  Text generation complete
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Your campaign metadata and five slide scripts are saved. The
                  image pipeline workspace will attach to this campaign next.
                </p>
                <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-sm text-zinc-300">
                  {campaignId}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

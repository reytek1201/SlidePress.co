export async function register() {
  // Only validate on the server (Node.js runtime), not in the Edge runtime
  // or browser bundle.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const required: Record<string, string> = {
    NEXT_PUBLIC_SUPABASE_URL: "Supabase project URL",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "Supabase anon key",
    SUPABASE_SERVICE_ROLE_KEY: "Supabase service role key",
    GEMINI_API_KEY: "Google Gemini API key",
    FAL_KEY: "Fal.ai API key",
    FAL_WEBHOOK_SECRET: "Fal webhook shared secret (run: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")",
  };

  const missing = Object.entries(required)
    .filter(([key]) => !process.env[key])
    .map(([key, description]) => `  ${key} — ${description}`);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join("\n")}\n\nCopy .env.example to .env.local and fill in the values.`,
    );
  }
}

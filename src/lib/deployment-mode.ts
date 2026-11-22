export type QuoteMode = "demo" | "ai";

// Only the designated preview branch can spend the provider quota on Vercel.
export function quoteMode(env = process.env): QuoteMode {
  if (env.VERCEL === "1" || env.VERCEL_ENV) {
    return env.VERCEL_ENV === "preview" && env.VERCEL_GIT_COMMIT_REF === "preview" &&
      env.ENSAMBLIA_QUOTE_MODE === "ai" ? "ai" : "demo";
  }
  return env.NODE_ENV !== "production" && env.ENSAMBLIA_QUOTE_MODE === "ai" ? "ai" : "demo";
}

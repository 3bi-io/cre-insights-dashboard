// Ambient declarations for the Supabase Edge Runtime (Deno) globals
// that aren't part of the standard Deno typings.

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

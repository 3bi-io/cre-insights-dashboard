import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/sms-webhook`;

Deno.test("sms-webhook: returns XML for empty body", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const text = await response.text();
  assertEquals(response.status, 200);
  assertEquals(text.includes("<Response/>"), true);
});

Deno.test("sms-webhook: handles STOP without active session", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      From: "+15551234567",
      Body: "STOP",
    }),
  });
  const text = await response.text();
  assertEquals(response.status, 200);
  assertEquals(text.includes("<Response/>"), true);
});

Deno.test("sms-webhook: handles YES without active session gracefully", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      From: "+15559999999",
      Body: "YES",
    }),
  });
  const text = await response.text();
  assertEquals(response.status, 200);
  assertEquals(text.includes("<Response/>"), true);
});

Deno.test("sms-webhook: handles form-urlencoded Twilio format", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      From: "+15551234567",
      Body: "YES",
    }).toString(),
  });
  const text = await response.text();
  assertEquals(response.status, 200);
  assertEquals(text.includes("<Response/>"), true);
});

Deno.test("sms-webhook: handles EDIT without active session", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      From: "+15559999999",
      Body: "EDIT",
    }),
  });
  const text = await response.text();
  assertEquals(response.status, 200);
  assertEquals(text.includes("<Response/>"), true);
});

Deno.test("sms-webhook: CORS preflight returns 200", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: { "Origin": "https://applyai.jobs" },
  });
  await response.text();
  assertEquals(response.status, 200);
});

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parse } from "https://deno.land/std@0.224.0/dotenv/parse.ts";

try {
  const envContent = Deno.readTextFileSync(".env");
  const envVars = parse(envContent);
  for (const [key, value] of Object.entries(envVars)) {
    if (!Deno.env.has(key)) Deno.env.set(key, value);
  }
} catch { /* ignore */ }

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const BASE_URL = `${SUPABASE_URL}/functions/v1/calendar-integration`;

async function callFunction(body: Record<string, unknown>, token?: string) {
  const resp = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token || SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  return { status: resp.status, data };
}

Deno.test("CORS preflight returns 200", async () => {
  const resp = await fetch(BASE_URL, { method: "OPTIONS" });
  const body = await resp.text();
  assertEquals(resp.status, 200);
  assertExists(resp.headers.get("access-control-allow-origin"));
});

Deno.test("Missing action returns 400", async () => {
  const { status, data } = await callFunction({});
  assertEquals(status, 400);
  assertEquals(data.success, false);
  assertExists(data.error);
});

Deno.test("Unknown action returns 400", async () => {
  const { status, data } = await callFunction({ action: "unknown_action" });
  assertEquals(status, 400);
  assertEquals(data.success, false);
});

Deno.test("get_availability with missing params returns error", async () => {
  const { status, data } = await callFunction({
    action: "get_availability",
    recruiterUserId: null,
  });
  // Should return 500 with validation error
  assertEquals(status, 500);
  assertEquals(data.success, false);
});

Deno.test("get_availability with invalid UUID returns error", async () => {
  const { status, data } = await callFunction({
    action: "get_availability",
    recruiterUserId: "not-a-uuid",
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 3600000).toISOString(),
  });
  assertEquals(status, 500);
  assertEquals(data.success, false);
});

Deno.test("get_availability with end before start returns error", async () => {
  const { status, data } = await callFunction({
    action: "get_availability",
    recruiterUserId: "00000000-0000-0000-0000-000000000001",
    startTime: new Date(Date.now() + 7200000).toISOString(),
    endTime: new Date(Date.now() + 3600000).toISOString(),
  });
  assertEquals(status, 500);
  assertExists(data.error);
});

Deno.test("book_slot with past date returns error", async () => {
  const { status, data } = await callFunction({
    action: "book_slot",
    recruiterUserId: "00000000-0000-0000-0000-000000000001",
    startTime: "2020-01-01T10:00:00Z",
    endTime: "2020-01-01T10:15:00Z",
  });
  assertEquals(status, 500);
  assertExists(data.error);
});

Deno.test("cancel_booking with invalid callbackId returns error", async () => {
  const { status, data } = await callFunction({
    action: "cancel_booking",
    callbackId: "not-a-uuid",
  });
  assertEquals(status, 500);
  assertExists(data.error);
});

Deno.test("cancel_booking with nonexistent ID returns error", async () => {
  const { status, data } = await callFunction({
    action: "cancel_booking",
    callbackId: "00000000-0000-0000-0000-000000000099",
  });
  assertEquals(status, 500);
  assertExists(data.error);
});

Deno.test("disconnect with invalid connectionId returns error", async () => {
  const { status, data } = await callFunction({
    action: "disconnect",
    connectionId: "bad-id",
  });
  // Will fail auth or validation
  assertEquals(status >= 400, true);
});

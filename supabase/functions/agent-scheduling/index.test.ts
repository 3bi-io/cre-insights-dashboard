import { loadSync } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

loadSync({ export: true, allowEmptyValues: true });

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const BASE_URL = `${SUPABASE_URL}/functions/v1/agent-scheduling`;

async function callFunction(body: Record<string, unknown>) {
  const resp = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
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

Deno.test("Unknown tool returns helpful message", async () => {
  const { status, data } = await callFunction({
    tool_name: "nonexistent_tool",
    parameters: {},
  });
  assertEquals(status, 200);
  assertExists(data.result);
  assertEquals(data.result.includes("Unknown tool"), true);
});

Deno.test("check_availability without org_id returns error message", async () => {
  const { status, data } = await callFunction({
    tool_name: "check_availability",
    parameters: {},
  });
  assertEquals(status, 200);
  assertExists(data.result);
  assertEquals(data.result.includes("organization"), true);
});

Deno.test("check_availability with invalid UUID returns error", async () => {
  const { status, data } = await callFunction({
    tool_name: "check_availability",
    parameters: { organization_id: "not-a-uuid" },
  });
  assertEquals(status, 200);
  assertExists(data.result);
});

Deno.test("check_availability with valid but nonexistent org returns no-calendars message", async () => {
  const { status, data } = await callFunction({
    tool_name: "check_availability",
    parameters: { organization_id: "00000000-0000-0000-0000-000000000000" },
  });
  assertEquals(status, 200);
  assertExists(data.result);
  // Should indicate no calendar connections
  assertEquals(
    data.result.includes("calendar") || data.result.includes("recruiter") || data.result.includes("trouble"),
    true
  );
});

Deno.test("book_callback without recruiter_user_id returns error", async () => {
  const { status, data } = await callFunction({
    tool_name: "book_callback",
    parameters: {
      selected_slot_start: new Date(Date.now() + 86400000).toISOString(),
    },
  });
  assertEquals(status, 200);
  assertExists(data.result);
  assertEquals(data.result.includes("recruiter") || data.result.includes("identify"), true);
});

Deno.test("book_callback with past date returns error", async () => {
  const { status, data } = await callFunction({
    tool_name: "book_callback",
    parameters: {
      recruiter_user_id: "00000000-0000-0000-0000-000000000001",
      selected_slot_start: "2020-01-01T10:00:00Z",
    },
  });
  assertEquals(status, 200);
  assertExists(data.result);
  assertEquals(data.result.includes("passed") || data.result.includes("trouble"), true);
});

Deno.test("book_callback with invalid date returns error", async () => {
  const { status, data } = await callFunction({
    tool_name: "book_callback",
    parameters: {
      recruiter_user_id: "00000000-0000-0000-0000-000000000001",
      selected_slot_start: "not-a-date",
    },
  });
  assertEquals(status, 200);
  assertExists(data.result);
});

Deno.test("get_next_slots delegates to check_availability", async () => {
  const { status, data } = await callFunction({
    tool_name: "get_next_slots",
    parameters: { organization_id: "00000000-0000-0000-0000-000000000000" },
  });
  assertEquals(status, 200);
  assertExists(data.result);
});

Deno.test("Empty body returns graceful error", async () => {
  const resp = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: "{}",
  });
  const data = await resp.json();
  assertEquals(resp.status, 200);
  assertExists(data.result);
});

// model.mjs
// The only file that talks to the AI. Every step calls:
//
//   const reply = await model.chat(messages, { tools });
//   reply.text      what the model said
//   reply.toolCall  { name, args } if the model wants a tool, otherwise null
//   reply.message   the raw message, to push back into `messages`
//
// Under the hood it is one HTTP POST to an OpenAI-compatible endpoint
// (Gemini, Ollama, OpenRouter, OpenAI...). You don't need to change this file.

try { process.loadEnvFile(); } catch { /* no .env file: use real environment variables */ }

const BASE_URL = (process.env.BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai").replace(/\/+$/, "");
const API_KEY = process.env.API_KEY || "";
const MODEL = process.env.MODEL || "gemini-3.8-flash";

// Turn our tools object ({ name: function }) into the JSON the API expects.
function toSpecs(tools) {
  return Object.entries(tools).map(([name, fn]) => ({
    type: "function",
    function: { name, description: fn.description, parameters: fn.parameters },
  }));
}

// Small helpers so the step files can stay short:
// a tool result gets the id of the call it answers, and is sent as text.
function prepare(messages) {
  let lastCallId;
  return messages.map((m) => {
    if (m.role === "assistant" && m.tool_calls?.length) lastCallId = m.tool_calls[0].id;
    if (m.role !== "tool") return m;
    return {
      ...m,
      tool_call_id: m.tool_call_id || lastCallId,
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    };
  });
}

// Some models wrap JSON in ```json fences. Unwrap them.
function unfence(text) {
  const match = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return match ? match[1] : text;
}

async function chat(messages, { tools } = {}) {
  const isLocal = /localhost|127\.0\.0\.1/.test(BASE_URL);
  if (!isLocal && (!API_KEY || API_KEY.startsWith("paste-"))) {
    throw new Error("No API key yet. Copy .env.example to .env and paste your key (WORKSHOP.md, Step 0).");
  }

  const body = { model: MODEL, messages: prepare(messages) };
  if (tools && Object.keys(tools).length) body.tools = toSpecs(tools);

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    throw new Error(`Model call failed (${res.status}). ${detail}`);
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message ?? { role: "assistant", content: "" };

  // Keep it simple for the workshop: one tool call per turn.
  if (message.tool_calls?.length > 1) message.tool_calls = message.tool_calls.slice(0, 1);

  let toolCall = null;
  const call = message.tool_calls?.[0];
  if (call) {
    call.id ||= `call_${Date.now()}`;
    let args = {};
    try { args = JSON.parse(call.function.arguments || "{}"); } catch { /* bad JSON from the model */ }
    toolCall = { id: call.id, name: call.function.name, args };
  }

  return { text: unfence(message.content ?? ""), toolCall, message };
}

export const model = { chat, name: MODEL };

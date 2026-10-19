// Talks to the AI model. Every step calls model.chat(messages, { tools }).
// It works with any OpenAI-compatible service: Gemini, Ollama, OpenRouter or OpenAI.

try {
  process.loadEnvFile();
} catch {
  // There is no .env file, so we use the environment variables that are already set.
}

const BASE_URL = (process.env.BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai").replace(/\/+$/, "");
const API_KEY = process.env.API_KEY || "";
const MODEL = process.env.MODEL || "gemini-3.8-flash";

async function chat(messages, { tools = {} } = {}) {
  const isLocal = BASE_URL.includes("localhost") || BASE_URL.includes("127.0.0.1");
  if (!isLocal && (!API_KEY || API_KEY.startsWith("paste-"))) {
    throw new Error("No API key found. Copy .env.example to .env and paste your key into it.");
  }

  const body = { model: MODEL, messages: prepareMessages(messages) };
  if (Object.keys(tools).length > 0) {
    body.tools = describeTools(tools);
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 400);
    throw new Error(`Model call failed (${response.status}). ${details}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message ?? { role: "assistant", content: "" };

  return {
    text: removeJsonFences(message.content ?? ""),
    toolCall: readToolCall(message),
    message,
  };
}

// The model never sees our code, only each tool's name, description and parameters.
function describeTools(tools) {
  return Object.entries(tools).map(([name, tool]) => ({
    type: "function",
    function: { name, description: tool.description, parameters: tool.parameters },
  }));
}

// A tool result has to say which tool call it answers, and it has to be text.
function prepareMessages(messages) {
  let lastCallId;

  return messages.map((message) => {
    if (message.role === "assistant" && message.tool_calls?.length) {
      lastCallId = message.tool_calls[0].id;
    }
    if (message.role !== "tool") {
      return message;
    }
    return {
      ...message,
      tool_call_id: message.tool_call_id || lastCallId,
      content: typeof message.content === "string" ? message.content : JSON.stringify(message.content),
    };
  });
}

// We handle one tool call at a time to keep the loop simple.
function readToolCall(message) {
  const call = message.tool_calls?.[0];
  if (!call) {
    return null;
  }

  message.tool_calls = [call];
  call.id ||= `call_${Date.now()}`;

  let args = {};
  try {
    args = JSON.parse(call.function.arguments || "{}");
  } catch {
    // The model sent arguments that are not valid JSON, so we pass none.
  }

  return { id: call.id, name: call.function.name, args };
}

// Some models wrap JSON in ```json fences. We remove them so JSON.parse works.
function removeJsonFences(text) {
  const match = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return match ? match[1] : text;
}

export const model = { chat };

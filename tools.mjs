// tools.mjs
// The agent's hands. Each tool is a normal async function with two labels:
//   description  what it is for
//   parameters   what it needs
// The model only ever sees the labels. YOUR code runs the function.

import { readFile, writeFile, mkdir } from "node:fs/promises";

try { process.loadEnvFile(); } catch { /* no .env file */ }

function tool(description, params, fn) {
  fn.description = description;
  fn.parameters = {
    type: "object",
    properties: Object.fromEntries(
      Object.entries(params).map(([name, about]) => [name, { type: "string", description: about }]),
    ),
    required: Object.keys(params),
  };
  return fn;
}

// 1. Weather: Open-Meteo is free and needs no API key.
export const get_weather = tool(
  "Get the current temperature and the chance of rain over the next 12 hours for a city.",
  { city: "City name, for example Lagos" },
  async ({ city }) => {
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
      const place = (await (await fetch(geoUrl)).json()).results?.[0];
      if (!place) return { error: `Could not find a city called ${city}.` };

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}`
        + "&current=temperature_2m,precipitation&hourly=precipitation_probability&forecast_hours=12&timezone=auto";
      const w = await (await fetch(url)).json();
      const chances = w.hourly?.precipitation_probability ?? [];
      return {
        city: place.name,
        country: place.country,
        temperature_c: w.current?.temperature_2m,
        rain_now_mm: w.current?.precipitation,
        max_rain_chance_next_12h_percent: chances.length ? Math.max(...chances) : null,
      };
    } catch (err) {
      return { error: `Weather service unreachable: ${err.message}` };
    }
  },
);

// 2. Schedule: reads sessions.json (sample data, works offline).
export const get_schedule = tool(
  "List festival sessions with time, stage and tags. Use topic 'all' for everything, or a word such as 'AI' to filter.",
  { topic: "A topic to filter by, or 'all'" },
  async ({ topic = "all" }) => {
    const { sessions } = JSON.parse(await readFile(new URL("./sessions.json", import.meta.url), "utf8"));
    const t = topic.toLowerCase();
    if (t === "all") return sessions;
    const matches = sessions.filter((s) => [s.title, s.track, ...s.tags].join(" ").toLowerCase().includes(t));
    return matches.length ? matches : { note: `Nothing matched "${topic}". Here is everything.`, sessions };
  },
);

// 3. Save: writes the plan to a file. A real action, but low risk.
export const save_plan = tool(
  "Save the finished plan to a file called my-plan.md.",
  { plan: "The full plan as markdown text" },
  async ({ plan }) => {
    await writeFile("my-plan.md", plan);
    return { saved: "my-plan.md" };
  },
);

// 4. Send: the action with consequences. Telegram if configured, otherwise outbox/.
export const send_message = tool(
  "Send a text message to the user's friend.",
  { text: "The message to send" },
  async ({ text }) => {
    const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chatId } = process.env;
    if (token && chatId) {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      return res.ok ? { sent: "telegram" } : { error: `Telegram said ${res.status}` };
    }
    await mkdir("outbox", { recursive: true });
    const file = `outbox/message-${Date.now()}.txt`;
    await writeFile(file, text);
    return { sent: file };
  },
);

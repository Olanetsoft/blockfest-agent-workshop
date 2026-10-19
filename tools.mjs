// The tools the agent can use. Each tool is an ordinary function with a
// description and parameters attached. The model reads those, and our code runs the function.

import { readFile, writeFile, mkdir } from "node:fs/promises";

function tool(description, parameters, run) {
  run.description = description;
  run.parameters = {
    type: "object",
    properties: Object.fromEntries(
      Object.entries(parameters).map(([name, about]) => [name, { type: "string", description: about }]),
    ),
    required: Object.keys(parameters),
  };
  return run;
}

export const get_weather = tool(
  "Get the current temperature and the chance of rain over the next 12 hours for a city.",
  { city: "The name of the city, for example Lagos" },
  async ({ city }) => {
    try {
      // Open-Meteo is free and does not need an API key.
      const searchUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
      const place = (await (await fetch(searchUrl)).json()).results?.[0];
      if (!place) {
        return { error: `Could not find a city called ${city}.` };
      }

      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}`
        + "&current=temperature_2m,precipitation&hourly=precipitation_probability&forecast_hours=12&timezone=auto";
      const weather = await (await fetch(forecastUrl)).json();
      const rainChances = weather.hourly?.precipitation_probability ?? [];

      return {
        city: place.name,
        country: place.country,
        temperature_celsius: weather.current?.temperature_2m,
        rain_now_millimetres: weather.current?.precipitation,
        highest_rain_chance_next_12_hours_percent: rainChances.length > 0 ? Math.max(...rainChances) : null,
      };
    } catch (error) {
      return { error: `The weather service could not be reached: ${error.message}` };
    }
  },
);

export const get_schedule = tool(
  "List the festival sessions with their time, stage and tags. Use the topic 'all' to see everything, or a word such as 'AI' to filter.",
  { topic: "A topic to filter by, or 'all'" },
  async ({ topic = "all" }) => {
    const { sessions } = JSON.parse(await readFile(new URL("./sessions.json", import.meta.url), "utf8"));
    const wanted = topic.toLowerCase();
    if (wanted === "all") {
      return sessions;
    }

    const wordsIn = (session) => [session.track, ...session.tags, ...session.title.split(/\W+/)].map((word) => word.toLowerCase());
    const matches = sessions.filter((session) => wordsIn(session).includes(wanted));

    return matches.length > 0 ? matches : { note: `Nothing matched "${topic}", so here is every session.`, sessions };
  },
);

export const save_plan = tool(
  "Save the finished plan to a file called my-plan.md.",
  { plan: "The full plan, written in markdown" },
  async ({ plan }) => {
    await writeFile("my-plan.md", plan);
    return { saved: "my-plan.md" };
  },
);

export const send_message = tool(
  "Send a text message to the user's friend.",
  { text: "The message to send" },
  async ({ text }) => {
    const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
      });
      return response.ok ? { sent: "telegram" } : { error: `Telegram returned status ${response.status}` };
    }

    // Without Telegram set up, the message is saved in the outbox folder instead.
    await mkdir("outbox", { recursive: true });
    const file = `outbox/message-${Date.now()}.txt`;
    await writeFile(file, text);
    return { sent: file };
  },
);

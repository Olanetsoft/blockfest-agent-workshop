# Be the agent

No laptop? No problem. In 3 minutes you will run an agent loop by hand, and you will be the code.

## 1. Paste this into any AI chat app

Claude, ChatGPT, Gemini, any of them. Start a new chat and paste:

```
You are an agent at Blockfest Africa in Lagos. You cannot look anything up yourself.
You have two tools:
  get_weather(city)   returns the weather for a city
  get_schedule(topic) returns festival sessions about a topic

Rules:
- Never answer the user directly until you have the facts.
- When you need a tool, reply with ONLY one line: CALL tool_name(argument)
- I will run the tool and reply with: RESULT ...
- When you have everything, reply starting with: FINAL

My goal: Should I bring an umbrella this evening, and which AI session should I attend?
```

## 2. Play the code

- When it replies `CALL get_weather(Lagos)`, look up the weather on your phone and reply `RESULT 28°C, 70% chance of rain tonight`.
- When it asks for the schedule, make one up, or use a session from the agenda.
- Keep going until it says `FINAL`.

## 3. Notice what just happened

- The AI **decided** which tool it needed. It never touched the internet.
- **You** ran the tool and handed back the result. That is exactly what `03-tool.mjs` does.
- It kept going until it had enough. That repeat is the loop in `04-loop.mjs`.

You just were the agent's hands. In code, that's about 10 lines.

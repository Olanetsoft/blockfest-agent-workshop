# Build Your First AI Agent

**From prompt to autonomous action.** Workshop code from Blockfest Africa 2026.

> An agent is a model in a loop, with tools, on a leash.

**At the workshop? Open [WORKSHOP.md](WORKSHOP.md)** and follow along step by step.

## What's in here

**Festival Buddy** is a small agent that reads a festival schedule, checks the weather, saves a plan, and asks your permission before sending it to a friend. It's written in plain Node.js with **zero dependencies**, so there's nothing to install.

| File | Step |
| --- | --- |
| `01-talk.mjs` | One call to a model |
| `02-decide.mjs` | Structured output (JSON) |
| `03-tool.mjs` | One tool call, run by your code |
| `04-loop.mjs` | The agent loop |
| `05-leash.mjs` | Step limit, allow-list, human approval, logging: the finished agent |
| `model.mjs` | Talks to any OpenAI-compatible API (Gemini, Ollama, OpenRouter, OpenAI) |
| `tools.mjs` | The four tools |
| `be-the-agent.md` | A no-code exercise: play the agent loop by hand |

Each step also lives on its own branch (`step-0-start` to `step-5-leash`). `main` is the finished agent.

## Run the finished agent

```bash
git clone https://github.com/Olanetsoft/blockfest-agent-workshop.git
cd blockfest-agent-workshop
cp .env.example .env    # then paste a free key from https://aistudio.google.com/apikey
node 05-leash.mjs
```

Requires Node.js 20.12 or newer.

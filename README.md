# Build Your First AI Agent

**From prompt to autonomous action.** This is the code for the Blockfest Africa 2026 workshop.

> An agent is a model in a loop, with tools, on a leash.

**If you are at the workshop, open [WORKSHOP.md](WORKSHOP.md) and follow along step by step.**

## What is in this repository

This repository contains **Festival Buddy**, a small agent that reads a festival schedule, checks the weather, saves a plan for your day, and asks for your permission before sending that plan to a friend. It is written in plain Node.js and has no dependencies, so there is nothing to install.

| File | What it contains |
| --- | --- |
| `01-talk.mjs` | Step 1: a single call to the model |
| `02-decide.mjs` | Step 2: the model answers in JSON so our code can read its decision |
| `03-tool.mjs` | Step 3: the model asks for a tool and our code runs it |
| `04-loop.mjs` | Step 4: the agent loop |
| `05-leash.mjs` | Step 5: the finished agent, with a step limit, a list of allowed tools, permission before sending, and a log |
| `model.mjs` | Sends messages to any OpenAI-compatible model, such as Gemini, Ollama, OpenRouter or OpenAI |
| `tools.mjs` | The four tools the agent can use |
| `sessions.json` | Sample festival sessions |
| `WORKSHOP.md` | The step-by-step guide |

Each step also has its own branch, from `step-0-start` to `step-5-leash`. The `main` branch holds the finished agent.

## Run the finished agent

You need Node.js version 20.12 or newer.

```bash
git clone https://github.com/Olanetsoft/blockfest-agent-workshop.git
cd blockfest-agent-workshop
cp .env.example .env
```

Open `.env`, paste in a free API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey), and then run:

```bash
node 05-leash.mjs
```

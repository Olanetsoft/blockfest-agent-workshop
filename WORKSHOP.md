# Build Your First AI Agent

**From prompt to autonomous action.** A follow-along guide for the Blockfest Africa 2026 workshop.

> An agent is a model in a loop, with tools, on a leash.

You'll build **Festival Buddy**: an agent that reads the festival schedule, checks the Lagos weather, saves a plan, and asks your permission before sending it to a friend. Five small steps, each one a single file.

| Step | File | What it adds | Branch to jump in |
| --- | --- | --- | --- |
| 0 | | Setup | `step-0-start` |
| 1 | `01-talk.mjs` | It can talk | `step-1-talk` |
| 2 | `02-decide.mjs` | It can decide | `step-2-decide` |
| 3 | `03-tool.mjs` | It can use a tool | `step-3-tool` |
| 4 | `04-loop.mjs` | It can keep going | `step-4-loop` |
| 5 | `05-leash.mjs` | It can act safely on its own | `step-5-leash` |

**Lost or behind? You never have to catch up by typing.** Each branch is the finished state of that step:

```bash
git stash            # put your changes aside
git checkout step-3-tool
```

**No laptop?** You're on the Watchers track. Read along here, answer the checkpoint questions, and play [Be the agent](be-the-agent.md) in step 3.

---

## Step 0: Setup (5 minutes, start now)

You need **Node.js 20.12 or newer** (`node -v` to check) and a **free Gemini API key**. No `npm install`: this project has zero dependencies.

**1. Get the code**

```bash
git clone https://github.com/Olanetsoft/blockfest-agent-workshop.git
cd blockfest-agent-workshop
git checkout step-0-start
```

No git? Use **Code → Download ZIP** on the GitHub page.
No Node? Use **Code → Codespaces → Create codespace** on the GitHub page. It runs in your browser with everything installed.

**2. Get a free API key**

Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey), sign in with a Google account, and create a key. No card needed.

**3. Add your key**

```bash
cp .env.example .env        # Windows: copy .env.example .env
```

Open `.env` and paste your key after `API_KEY=`. Keep this file private. It is already in `.gitignore`.

**What's already here**

| File | What it is |
| --- | --- |
| `model.mjs` | Talks to the AI. One function: `model.chat(messages, { tools })`. You won't change it. |
| `tools.mjs` | Four tools the agent can use: `get_schedule`, `get_weather`, `save_plan`, `send_message` |
| `sessions.json` | Sample festival sessions (invented, not the real agenda) |

---

## Step 1: It can talk

One call to the model. Ask a question, get text back. This is every chatbot you've used.

Create `01-talk.mjs`:

```js
// Step 1: It can talk.
// Adds:        one call to the model. Ask, get text back.
// Look for:    the answer is just text. Nothing happened in the world.
// Checkpoint:  can it tell you today's weather in Lagos?

import { model } from "./model.mjs";

const reply = await model.chat([
  { role: "user", content: "Hi! Who are you?" },
]);

console.log(reply.text);
```

Run it:

```bash
node 01-talk.mjs
```

You should see a friendly self-introduction.

**Checkpoint:** can it tell you today's weather in Lagos?

<details><summary>Answer</summary>

No. It only knows what it learned in training. It can't look anything up, and nothing it says changes anything in the world.

</details>

---

## Step 2: It can decide

Ask for JSON instead of prose. Now your code can *read* the model's decision.

Create `02-decide.mjs`:

```js
// Step 2: It can decide.
// Adds:        ask for JSON, so code can read the model's decision.
// Look for:    the model picked an action, but nothing ran it yet.
// Checkpoint:  who would actually fetch the weather?

import { model } from "./model.mjs";

const reply = await model.chat([
  { role: "system", content: 'Reply only with JSON like {"tool": "get_weather", "args": {"city": "..."}}' },
  { role: "user", content: "Weather in Lagos?" },
]);

const action = JSON.parse(reply.text);
if (action.tool === "get_weather") {
  console.log("Model wants:", action.args);
}
```

```bash
node 02-decide.mjs
```

You should see `Model wants: { city: 'Lagos' }`.

**Checkpoint:** the model decided to get the weather. Who will actually fetch it?

<details><summary>Answer</summary>

Nobody yet. The model can only *say* what it wants. Running it is your code's job, and that's step 3.

</details>

---

## Step 3: It can use a tool

Open `tools.mjs` and look at `get_weather`. A tool is just a normal function with a **description** (what it's for) and **parameters** (what it needs). The model only sees those labels.

The flow: the model asks for a tool, **your code runs it**, and the result goes back to the model.

Create `03-tool.mjs`:

```js
// Step 3: It can use a tool.
// Adds:        a real tool. The model asks, OUR code runs it, the result goes back.
// Look for:    the model never touches the internet. Your code does.
// Checkpoint:  who actually ran get_weather, the model or your code?

import { model } from "./model.mjs";
import { get_weather } from "./tools.mjs";

const tools = { get_weather };
const messages = [{ role: "user", content: "Do I need an umbrella in Lagos today?" }];

// 1. The model decides it needs a tool.
const reply = await model.chat(messages, { tools });
if (!reply.toolCall) {
  console.log("The model answered without a tool:", reply.text);
  process.exit(0);
}
console.log("Model asked for:", reply.toolCall.name, reply.toolCall.args);

// 2. Our code runs it.
const result = await tools[reply.toolCall.name](reply.toolCall.args);
console.log("Our code got:   ", result);

// 3. Hand the result back and ask again.
messages.push(reply.message);
messages.push({ role: "tool", content: result });

const final = await model.chat(messages, { tools });
console.log("\nFinal answer:", final.text);
```

```bash
node 03-tool.mjs
```

You should see the model ask for `get_weather`, your code fetch real weather, then a final answer about umbrellas.

**Watchers:** now play [Be the agent](be-the-agent.md). You'll be the code.

**Checkpoint:** who actually ran `get_weather`, the model or your code?

<details><summary>Answer</summary>

Your code. Always. The model never touches the internet, your files, or your money. It only asks. That's why you get to decide what it may do.

</details>

---

## Step 4: It can keep going

Wrap step 3 in a loop: call the model, run whatever tool it asks for, feed the result back, repeat until it stops asking. **This loop is the agent.**

Create `04-loop.mjs`:

```js
// Step 4: It can keep going.
// Adds:        a loop. Call the model, run its tool, feed the result back, repeat.
// Look for:    the model chooses the next step every time. This loop IS the agent.
// Checkpoint:  what decides when the loop stops?
//
// Run with your own goal:  node 04-loop.mjs "plan my afternoon"

import { model } from "./model.mjs";
import { get_schedule, get_weather, save_plan, send_message } from "./tools.mjs";

const tools = { get_schedule, get_weather, save_plan, send_message };

const SYSTEM = `You are Festival Buddy, an assistant for someone at Blockfest Africa in Lagos today.
Use your tools to get real information. Never invent sessions or weather.
When the job is done, reply with a short summary.`;

const goal = process.argv.slice(2).join(" ")
  || "I'm at Blockfest today. Pick the 3 sessions most relevant to AI builders, tell me if I need an umbrella in Lagos this evening, save my plan, and send it to my friend.";

async function agent(goal) {
  const messages = [{ role: "system", content: SYSTEM }, { role: "user", content: goal }];

  while (true) { // no limit, on purpose. Step 5 fixes this.
    const reply = await model.chat(messages, { tools });
    if (!reply.toolCall) return reply.text;

    const { name, args } = reply.toolCall;
    console.log(`\nTOOL    ${name} ${JSON.stringify(args)}`);
    const result = await tools[name](args);
    console.log(`RESULT  ${JSON.stringify(result).slice(0, 160)}`);

    messages.push(reply.message);
    messages.push({ role: "tool", content: result });
  }
}

console.log(`GOAL    ${goal}`);
console.log(`\nDONE\n${await agent(goal)}`);
```

```bash
node 04-loop.mjs
```

Watch it think: schedule, then weather, then save, then send. Nobody told it that order. Try your own goal:

```bash
node 04-loop.mjs "Find me a security talk and tell me if it will rain at that time"
```

Check `my-plan.md` and the `outbox/` folder: your agent took real actions.

**Checkpoint:** what decides when the loop stops?

<details><summary>Answer</summary>

The model does, when it stops asking for tools. Nothing in your code stops it. If it gets confused, it could loop forever and burn your quota. Step 5 fixes that.

</details>

---

## Step 5: It can act safely on its own

Same loop, now on a leash:

1. **Step limit:** never more than 8 turns.
2. **Allow-list:** only tools you approved.
3. **Ask first:** a human says yes before anything that sends, pays or deletes.
4. **Log everything:** every step goes into `agent-log.jsonl`.

Create `05-leash.mjs`:

```js
// Step 5: It can act safely on its own.
// Adds:        the leash. A step limit, an allow-list, a human "yes" before
//              anything with consequences, and a log of every step.
// Look for:    the agent still decides, but YOU decide what it is allowed to do.
// Checkpoint:  which tool should never run without asking you first?
//
// Run with your own goal:  node 05-leash.mjs "plan my afternoon"

import { createInterface } from "node:readline/promises";
import { appendFile } from "node:fs/promises";
import { model } from "./model.mjs";
import { get_schedule, get_weather, save_plan, send_message } from "./tools.mjs";

const tools = { get_schedule, get_weather, save_plan, send_message };

// The leash
const MAX_STEPS = 8;                                  // 1. never loop forever
const ALLOWED = new Set(Object.keys(tools));          // 2. only these tools
const NEEDS_APPROVAL = new Set(["send_message"]);     // 3. ask a human first
const LOG_FILE = "agent-log.jsonl";                   // 4. keep a record

const SYSTEM = `You are Festival Buddy, an assistant for someone at Blockfest Africa in Lagos today.
Use your tools to get real information. Never invent sessions or weather.
Save the plan before you send it. When the job is done, reply with a short summary.`;

const goal = process.argv.slice(2).join(" ")
  || "I'm at Blockfest today. Pick the 3 sessions most relevant to AI builders, tell me if I need an umbrella in Lagos this evening, save my plan, and send it to my friend.";

async function approve(name, args) {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await terminal.question(`\nAPPROVE? ${name} wants to run with:\n${JSON.stringify(args, null, 2)}\nAllow it? (y/n) `);
  terminal.close();
  return answer.trim().toLowerCase().startsWith("y");
}

async function log(entry) {
  await appendFile(LOG_FILE, JSON.stringify({ time: new Date().toISOString(), ...entry }) + "\n");
}

async function agent(goal) {
  const messages = [{ role: "system", content: SYSTEM }, { role: "user", content: goal }];

  for (let step = 1; step <= MAX_STEPS; step++) {
    const reply = await model.chat(messages, { tools });
    if (!reply.toolCall) {
      await log({ step, final: reply.text });
      return reply.text;
    }

    const { name, args } = reply.toolCall;
    console.log(`\nSTEP ${step}  ${name} ${JSON.stringify(args)}`);

    let result;
    if (!ALLOWED.has(name)) {
      result = { error: `The tool "${name}" is not allowed.` };
    } else if (NEEDS_APPROVAL.has(name) && !(await approve(name, args))) {
      result = { error: "The human said no. Do not try again. Tell them what you would have sent." };
    } else {
      try { result = await tools[name](args); }
      catch (err) { result = { error: err.message }; }
    }
    console.log(`RESULT  ${JSON.stringify(result).slice(0, 160)}`);
    await log({ step, tool: name, args, result });

    messages.push(reply.message);
    messages.push({ role: "tool", content: result });
  }

  return `Stopped after ${MAX_STEPS} steps without finishing. Try a clearer goal.`;
}

console.log(`GOAL    ${goal}`);
console.log(`\nDONE\n${await agent(goal)}`);
console.log(`\nEvery step is logged in ${LOG_FILE}`);
```

```bash
node 05-leash.mjs
```

When it wants to send, it stops and asks you. Try saying `n` and watch how it reacts. Then open `agent-log.jsonl` to see every decision it made.

**Checkpoint:** which tool should never run without asking you first?

<details><summary>Answer</summary>

Anything with consequences you can't undo: sending a message, paying, deleting, or (at a web3 festival) signing a transaction.

</details>

---

## You built an agent

Give it your own goals:

```bash
node 05-leash.mjs "Plan my afternoon around the AI talks and lunch"
```

Then make it yours:

- **Add a tool.** Copy `get_weather` in `tools.mjs`, give it a new name, description and function. Add it to `tools` in `05-leash.mjs`. The model will start using it.
- **Swap the model.** Change `MODEL` or `BASE_URL` in `.env`. Same code works with Ollama (offline), OpenRouter or OpenAI.
- **Make it onchain.** Replace `send_message` with a tool that reads a wallet balance. Keep the leash: a tool that can move money is the one that most needs a human "yes".

## Where to go next

- **Frameworks** such as the Vercel AI SDK, OpenAI Agents SDK, Google ADK and LangGraph package this same loop and leash for you. Now you know what they're doing underneath.
- **MCP (Model Context Protocol)** is a standard way to plug tools into any agent. Write a tool once, use it everywhere.
- Read *Building effective agents* by Anthropic for when to use an agent and when a simple workflow is better.

## Troubleshooting

| You see | Do this |
| --- | --- |
| `No API key yet` | You haven't created `.env`, or the key is still `paste-your-key-here` |
| `Model call failed (404)` | The model name isn't available to you. Pick a free one in AI Studio and update `MODEL` in `.env` |
| `Model call failed (402)` and "prepayment credits are depleted" | Your key's Google project has billing linked with no credits, so it gets no free tier. In AI Studio, create a new key **in a new project** and paste it into `.env` |
| `Model call failed (429)` | Free-tier rate limit. Wait 30 seconds and try again |
| `fetch failed` | No internet. Try a hotspot, or switch to Ollama in `.env` |
| `process.loadEnvFile is not a function` | Your Node is too old. Install Node 20.12+ or use Codespaces |
| `Unexpected token` in step 2 | The model didn't reply with clean JSON. Run it again; it's a good example of why real tools (step 3) beat hand-parsed JSON |

---

Built for the Blockfest Africa 2026 workshop by [Idris Olubisi](https://github.com/Olanetsoft). Free-tier prompts may be used by the model provider to improve its models, so don't paste anything private.

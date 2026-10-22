# Build Your First AI Agent

**From prompt to autonomous action.** This is the follow-along guide for the Blockfest Africa 2026 workshop.

> An agent is a model in a loop, with tools, on a leash.

In this workshop you will build **Festival Buddy**, an agent that reads the festival schedule, checks the weather in Lagos, saves a plan for your day, and asks for your permission before it sends that plan to a friend. You will build it in five small steps, and each step is a single file.

| Step | File | What the step adds | Branch with the finished step |
| --- | --- | --- | --- |
| 0 | | Setting up your computer | `step-0-start` |
| 1 | `01-talk.mjs` | The agent can talk | `step-1-talk` |
| 2 | `02-decide.mjs` | The agent can decide | `step-2-decide` |
| 3 | `03-tool.mjs` | The agent can use a tool | `step-3-tool` |
| 4 | `04-loop.mjs` | The agent can keep going | `step-4-loop` |
| 5 | `05-leash.mjs` | The agent can act safely on its own | `step-5-leash` |

**If you fall behind, you do not need to type everything to catch up.** Every branch holds the finished version of that step. Put your own changes aside and switch to the branch for the step we are on. For example, to catch up to step 3:

```bash
git stash
git checkout step-3-tool
```

**If you do not have a laptop with you,** you can still follow every step. Read along on your phone, think about each checkpoint question, and play the game in the section called [Be the agent](#be-the-agent) at the end of this guide.

---

## Step 0: Set up your computer

Please start this while the talk is going on, because it takes about five minutes.

You need **Node.js version 20.12 or newer** and a **free Gemini API key**. You can check your Node.js version by running `node -v`. You do not need to install any packages, because this project has no dependencies.

**1. Download the code.**

```bash
git clone https://github.com/Olanetsoft/blockfest-agent-workshop.git
cd blockfest-agent-workshop
git checkout step-0-start
```

If you do not have Git, open the repository on GitHub, click the green **Code** button, and choose **Download ZIP**.

If you do not have Node.js, open the repository on GitHub, click the green **Code** button, and choose **Codespaces**, then **Create codespace**. This gives you a ready-made setup in your browser.

**2. Get a free API key.**

Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey), sign in with a Google account, and create a key. You do not need a payment card. Create the key in a **new project**, because a project that already has billing set up will not get the free tier.

**3. Add your key to the project.**

Make a copy of the example settings file:

```bash
cp .env.example .env
```

On Windows, use `copy .env.example .env` instead.

Open `.env` in your editor and paste your key after `API_KEY=`. Keep this file private. Git already ignores it, so it will never be uploaded.

**What is already in the project**

| File | What it does |
| --- | --- |
| `model.mjs` | Sends messages to the AI model and returns its reply. You will not need to change it. |
| `tools.mjs` | The four tools the agent can use: `get_schedule`, `get_weather`, `save_plan` and `send_message`. |
| `sessions.json` | A list of sample festival sessions. These are made up, and they are not the real Blockfest agenda. |

---

## Step 1: It can talk

We start with a single call to the model. You ask a question and you get text back. This is how every chatbot you have used works.

Create a file called `01-talk.mjs` and paste in this code:

```js
// Step 1: It can talk. We send one message and print the answer.

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

You should see the model introduce itself.

**Checkpoint question: can it tell you today's weather in Lagos?**

<details><summary>Show the answer</summary>

No, it cannot. The model only knows what it learned during training. It cannot look anything up, and nothing it says changes anything in the world.

</details>

---

## Step 2: It can decide

Now we ask the model to answer in JSON instead of normal sentences. Because JSON has a fixed shape, our code can read the model's decision and act on it.

Create a file called `02-decide.mjs` and paste in this code:

```js
// Step 2: It can decide. The model answers in JSON, so our code can read its decision.

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

Run it:

```bash
node 02-decide.mjs
```

You should see `Model wants: { city: 'Lagos' }`.

**Checkpoint question: the model has decided to get the weather, so who is actually going to fetch it?**

<details><summary>Show the answer</summary>

Nobody yet. The model can only say what it wants. Running the action is the job of our code, and that is what we add in step 3.

</details>

---

## Step 3: It can use a tool

Before you write any code, open `tools.mjs` and look at `get_weather`. A tool is an ordinary function with two things attached to it: a **description** that says what the tool is for, and **parameters** that say what information it needs. The model only ever sees the description and the parameters. It never sees or runs the function itself.

This step works in three parts. The model asks for a tool, our code runs that tool, and then we send the result back to the model so it can answer.

Create a file called `03-tool.mjs` and paste in this code:

```js
// Step 3: It can use a tool. The model asks for a tool, our code runs it, and the result goes back.

import { model } from "./model.mjs";
import { get_weather } from "./tools.mjs";

const tools = { get_weather };
const messages = [{ role: "user", content: "Do I need an umbrella in Lagos today?" }];

const reply = await model.chat(messages, { tools });
if (!reply.toolCall) {
  console.log("The model answered without using a tool:", reply.text);
  process.exit(0);
}
console.log("Model asked for:", reply.toolCall.name, reply.toolCall.args);

const result = await tools[reply.toolCall.name](reply.toolCall.args);
console.log("Our code got:", result);

messages.push(reply.message);
messages.push({ role: "tool", content: result });

const final = await model.chat(messages, { tools });
console.log("\nFinal answer:", final.text);
```

Run it:

```bash
node 03-tool.mjs
```

You should see the model ask for `get_weather`, then our code fetch the real weather in Lagos, and then a final answer about whether you need an umbrella.

**Checkpoint question: who actually ran `get_weather`, the model or our code?**

<details><summary>Show the answer</summary>

Our code ran it, and that is always the case. The model never touches the internet, your files or your money. It can only ask. That is why we get to decide what it is allowed to do.

</details>

---

## Step 4: It can keep going

Now we put step 3 inside a loop. We call the model, run whichever tool it asks for, send the result back, and repeat until the model stops asking for tools. **This loop is the agent.**

Create a file called `04-loop.mjs` and paste in this code:

```js
// Step 4: It can keep going. The model picks a tool, we run it, and we repeat until it is done.
// Try your own goal: node 04-loop.mjs "plan my afternoon"

import { model } from "./model.mjs";
import { get_schedule, get_weather, save_plan, send_message } from "./tools.mjs";

const tools = { get_schedule, get_weather, save_plan, send_message };

const instructions = `You are Festival Buddy, an assistant for someone at Blockfest Africa in Lagos today.
Use your tools to get real information. Never make up sessions or weather.
When the job is done, reply with a short summary.`;

const goal = process.argv.slice(2).join(" ")
  || "I'm at Blockfest today. Pick the 3 sessions most relevant to AI builders, tell me if I need an umbrella in Lagos this evening, save my plan, and send it to my friend.";

async function runAgent(goal) {
  const messages = [
    { role: "system", content: instructions },
    { role: "user", content: goal },
  ];

  // There is no limit on purpose. Step 5 adds one.
  while (true) {
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
console.log(`\nDONE\n${await runAgent(goal)}`);
```

Run it:

```bash
node 04-loop.mjs
```

Watch the order it works in. It checks the schedule, then the weather, then saves the plan, and then sends it. Nobody told it to work in that order. It decided by itself.

You can also give it your own goal:

```bash
node 04-loop.mjs "Find me a security talk and tell me if it will rain at that time"
```

Afterwards, open `my-plan.md` and look inside the `outbox` folder. Your agent has taken real actions.

**Checkpoint question: what decides when the loop stops?**

<details><summary>Show the answer</summary>

The model decides, by no longer asking for tools. Nothing in our code stops it. If the model gets confused, it could keep going forever and use up your free quota. Step 5 fixes that.

</details>

---

## Step 5: It can act safely on its own

This is the same loop, but now it is on a leash. We add four rules:

1. **A step limit.** The agent can take at most eight steps.
2. **A list of allowed tools.** The agent can only use the tools we have approved.
3. **Permission before acting.** A person has to say yes before anything that sends, pays or deletes.
4. **A log of everything.** Every step is written to a file called `agent-log.jsonl`.

Create a file called `05-leash.mjs` and paste in this code:

```js
// Step 5: It can act safely on its own. The same loop, with four rules we control.
// Try your own goal: node 05-leash.mjs "plan my afternoon"

import { createInterface } from "node:readline/promises";
import { appendFile } from "node:fs/promises";
import { model } from "./model.mjs";
import { get_schedule, get_weather, save_plan, send_message } from "./tools.mjs";

const tools = { get_schedule, get_weather, save_plan, send_message };

// The leash
const MAX_STEPS = 8;
const ALLOWED_TOOLS = new Set(Object.keys(tools));
const NEEDS_APPROVAL = new Set(["send_message"]);
const LOG_FILE = "agent-log.jsonl";

const instructions = `You are Festival Buddy, an assistant for someone at Blockfest Africa in Lagos today.
Use your tools to get real information. Never make up sessions or weather.
Save the plan before you send it. When the job is done, reply with a short summary.`;

const goal = process.argv.slice(2).join(" ")
  || "I'm at Blockfest today. Pick the 3 sessions most relevant to AI builders, tell me if I need an umbrella in Lagos this evening, save my plan, and send it to my friend.";

async function askPermission(name, args) {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await terminal.question(`\nAPPROVE? ${name} wants to run with:\n${JSON.stringify(args, null, 2)}\nAllow it? (y/n) `);
  terminal.close();
  return answer.trim().toLowerCase().startsWith("y");
}

async function log(entry) {
  await appendFile(LOG_FILE, JSON.stringify({ time: new Date().toISOString(), ...entry }) + "\n");
}

async function runTool(name, args) {
  if (!ALLOWED_TOOLS.has(name)) {
    return { error: `The tool "${name}" is not allowed.` };
  }
  if (NEEDS_APPROVAL.has(name) && !(await askPermission(name, args))) {
    return { error: "The person said no. Do not try again. Tell them what you would have sent." };
  }
  try {
    return await tools[name](args);
  } catch (error) {
    return { error: error.message };
  }
}

async function runAgent(goal) {
  const messages = [
    { role: "system", content: instructions },
    { role: "user", content: goal },
  ];

  for (let step = 1; step <= MAX_STEPS; step++) {
    const reply = await model.chat(messages, { tools });
    if (!reply.toolCall) {
      await log({ step, final: reply.text });
      return reply.text;
    }

    const { name, args } = reply.toolCall;
    console.log(`\nSTEP ${step}  ${name} ${JSON.stringify(args)}`);

    const result = await runTool(name, args);
    console.log(`RESULT  ${JSON.stringify(result).slice(0, 160)}`);
    await log({ step, tool: name, args, result });

    messages.push(reply.message);
    messages.push({ role: "tool", content: result });
  }

  return `Stopped after ${MAX_STEPS} steps without finishing. Try a clearer goal.`;
}

console.log(`GOAL    ${goal}`);
console.log(`\nDONE\n${await runAgent(goal)}`);
console.log(`\nEvery step is saved in ${LOG_FILE}.`);
```

Run it:

```bash
node 05-leash.mjs
```

When the agent wants to send the message, it stops and asks you first. Try answering `n` and watch how it reacts. Then open `agent-log.jsonl` to see every decision it made.

**Checkpoint question: which tools should never run without asking you first?**

<details><summary>Show the answer</summary>

Any tool whose result you cannot undo. That includes sending a message, making a payment, deleting something, and, at a web3 festival, signing a transaction.

</details>

---

## You have built an agent

Try giving it your own goals:

```bash
node 05-leash.mjs "Plan my afternoon around the AI talks and lunch"
```

Here are some ways to make it your own:

- **Add a tool.** Copy `get_weather` in `tools.mjs`, give the copy a new name, description and function, and then add it to the `tools` list in `05-leash.mjs`. The model will start using it on its own.
- **Change the model.** Change `MODEL` or `BASE_URL` in your `.env` file. The same code works with Ollama on your own laptop, with no internet, and with OpenRouter or OpenAI.
- **Take it onchain.** Replace `send_message` with a tool that reads a wallet balance. Keep the leash in place, because a tool that can move money is the one that most needs a person to say yes.

## Where to go next

- **Agent frameworks** such as the Vercel AI SDK, the OpenAI Agents SDK, Google's Agent Development Kit and LangGraph give you this same loop and leash ready-made. Now you know what they are doing underneath. There is an example in the next section.
- **The Model Context Protocol (MCP)** is a standard way to plug tools into any agent. You write a tool once and many different agents can use it.
- **"Building effective agents"** is an essay by Anthropic that explains when you need an agent and when a simple fixed workflow is the better choice.

## The same agent, with a framework

You built the loop and the leash by hand so you could see how they work. In a real project you would usually let a framework handle them. Here is the same idea written with the [Vercel AI SDK](https://ai-sdk.dev/) (version 7). You do not need to run this today. It is here so you can recognise each part.

```js
import { ToolLoopAgent, tool, isStepCount } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const get_weather = tool({
  description: "Get the current temperature and the chance of rain for a city.",
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => {
    // The same weather code as in tools.mjs goes here.
  },
});

const send_message = tool({
  description: "Send a text message to the user's friend.",
  inputSchema: z.object({ text: z.string() }),
  needsApproval: true,
  execute: async ({ text }) => {
    // The same sending code as in tools.mjs goes here.
  },
});

const agent = new ToolLoopAgent({
  model: google("gemini-3.8-flash"),
  instructions: "You are Festival Buddy, an assistant for someone at Blockfest Africa in Lagos today.",
  tools: { get_weather, send_message },
  stopWhen: isStepCount(8),
});

const result = await agent.generate({ prompt: "Do I need an umbrella in Lagos this evening?" });
console.log(result.text);
```

How it matches what you built:

| In the framework | In your code |
| --- | --- |
| `tool({ description, inputSchema, execute })` | A tool in `tools.mjs`: a description, its parameters, and the function |
| `new ToolLoopAgent({ ... })` and `agent.generate(...)` | The `while` loop in `04-loop.mjs` |
| `instructions` | The `instructions` text at the top of `04-loop.mjs` |
| `stopWhen: isStepCount(8)` | `MAX_STEPS = 8` in `05-leash.mjs` |
| `needsApproval: true` | `NEEDS_APPROVAL` and `askPermission` in `05-leash.mjs` |

To try it yourself, run `npm install ai @ai-sdk/google zod` in a new folder and set `GOOGLE_GENERATIVE_AI_API_KEY` to your Gemini key.

## Be the agent

This game needs no laptop and takes about three minutes. You play the part of the code, so you will see the agent loop from the inside.

**1. Paste this into any AI chat app,** such as Claude, ChatGPT or Gemini, in a new chat:

```
You are an agent at Blockfest Africa in Lagos. You cannot look anything up yourself.
You have two tools:
  get_weather(city)   returns the weather for a city
  get_schedule(topic) returns festival sessions about a topic

Rules:
- Never answer the user directly until you have the facts.
- When you need a tool, reply with ONLY one line: CALL tool_name(argument)
- I will run the tool and reply with: RESULT ...
- When you have everything you need, start your reply with: FINAL

My goal: Should I bring an umbrella this evening, and which AI session should I attend?
```

**2. Play the code.** When the AI replies with `CALL get_weather(Lagos)`, look up the weather on your phone and reply with something like `RESULT 28°C, 70% chance of rain tonight`. When it asks for the schedule, give it a session from the festival agenda. Keep going until it replies with `FINAL`.

**3. Notice what just happened.** The AI decided which tool it needed, but it never touched the internet. You ran the tool and handed back the result, which is exactly what `03-tool.mjs` does. The AI kept asking until it had enough information, and that repetition is the loop in `04-loop.mjs`.

## If something goes wrong

| What you see | What to do |
| --- | --- |
| `No API key found` | You have not created your `.env` file yet, or you have not replaced `paste-your-key-here` with your key. |
| `Model call failed (402)` with the words "prepayment credits are depleted" | Your key belongs to a Google project with billing set up but no credit, so it does not get the free tier. Create a new key in a new project in AI Studio, and paste it into `.env`. |
| `Model call failed (404)` | The model name is not available to you. Pick a free model in AI Studio and change `MODEL` in your `.env` file. |
| `Model call failed (429)` | You have reached the free-tier limit for now. Wait about 30 seconds and try again. |
| `fetch failed` | You are not connected to the internet. Try a phone hotspot, or switch to Ollama in your `.env` file. |
| `process.loadEnvFile is not a function` | Your version of Node.js is too old. Install version 20.12 or newer, or use Codespaces. |
| `Unexpected token` in step 2 | The model did not reply with clean JSON. Run it again. This is a good example of why real tools, which we add in step 3, are more reliable than reading JSON by hand. |

---

This workshop was built for Blockfest Africa 2026 by [Idris Olubisi](https://github.com/Olanetsoft). On the free tier, the model provider may use your messages to improve its models, so please do not paste anything private.

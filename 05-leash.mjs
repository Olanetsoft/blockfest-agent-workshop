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

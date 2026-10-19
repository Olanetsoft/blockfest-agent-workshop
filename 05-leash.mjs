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

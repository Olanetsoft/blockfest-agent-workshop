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

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

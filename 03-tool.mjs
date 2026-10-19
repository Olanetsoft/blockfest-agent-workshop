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

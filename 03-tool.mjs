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

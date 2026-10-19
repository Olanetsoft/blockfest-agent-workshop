// Step 1: It can talk. We send one message and print the answer.

import { model } from "./model.mjs";

const reply = await model.chat([
  { role: "user", content: "Hi! Who are you?" },
]);

console.log(reply.text);

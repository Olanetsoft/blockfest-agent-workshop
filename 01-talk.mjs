// Step 1: It can talk.
// Adds:        one call to the model. Ask, get text back.
// Look for:    the answer is just text. Nothing happened in the world.
// Checkpoint:  can it tell you today's weather in Lagos?

import { model } from "./model.mjs";

const reply = await model.chat([
  { role: "user", content: "Hi! Who are you?" },
]);

console.log(reply.text);

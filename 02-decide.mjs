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

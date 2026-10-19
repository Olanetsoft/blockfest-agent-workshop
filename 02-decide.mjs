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

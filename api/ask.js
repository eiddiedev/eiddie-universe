import { handleNodeAssistant } from "../server/assistant-handler.mjs";

export default async function handler(req, res) {
  await handleNodeAssistant(req, res);
}

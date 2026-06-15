import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  formatKnowledgeContext,
  selectKnowledgeEntries,
} from "./knowledge-core.mjs";

const SERVER_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_KNOWLEDGE_PATH = resolve(SERVER_DIR, "../generated/portfolio-knowledge.json");
const MAX_CONTEXT_LENGTH = 6000;

export const loadKnowledgeArtifact = (knowledgePath = DEFAULT_KNOWLEDGE_PATH) => {
  try {
    const knowledge = JSON.parse(readFileSync(knowledgePath, "utf8"));
    if (knowledge?.version !== 1 || !Array.isArray(knowledge.entries)) return null;
    return knowledge;
  } catch {
    return null;
  }
};

export const retrieveKnowledgeContext = ({
  knowledge,
  question,
  language = "zh",
  limit = 4,
}) => {
  if (!knowledge) return { context: "", entries: [] };

  const entries = selectKnowledgeEntries({
    knowledge,
    question,
    language,
    limit,
  });
  const context = formatKnowledgeContext(entries, language).slice(0, MAX_CONTEXT_LENGTH);
  return { context, entries };
};

export const createKnowledgeRetriever = ({
  knowledgePath = DEFAULT_KNOWLEDGE_PATH,
} = {}) => {
  let cachedKnowledge;
  let loaded = false;

  return ({ question, language = "zh", limit = 4 }) => {
    if (!loaded) {
      cachedKnowledge = loadKnowledgeArtifact(knowledgePath);
      loaded = true;
    }

    return retrieveKnowledgeContext({
      knowledge: cachedKnowledge,
      question,
      language,
      limit,
    });
  };
};

export const getPortfolioKnowledgeContext = createKnowledgeRetriever();

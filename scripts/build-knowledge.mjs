import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnv } from "vite";

import {
  hashKnowledgeBlock,
  mergeKnowledgeEntries,
} from "../server/knowledge-core.mjs";
import { extractPortfolioBlocks } from "./portfolio-source.mjs";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-chat";
const KNOWLEDGE_VERSION = 1;
const BATCH_SIZE = 4;
const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT_PATH = resolve(ROOT_DIR, "generated/portfolio-knowledge.json");

const readPreviousKnowledge = async (outputPath) => {
  try {
    const value = JSON.parse(await readFile(outputPath, "utf8"));
    return Array.isArray(value?.entries) ? value : null;
  } catch {
    return null;
  }
};

const chunk = (items, size) => {
  const batches = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
};

const parseModelJson = (value) => {
  const normalized = String(value ?? "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const parsed = JSON.parse(normalized);
  return Array.isArray(parsed) ? parsed : parsed.entries;
};

const isValidGeneratedEntry = (entry, allowedIds) =>
  entry &&
  allowedIds.has(entry.id) &&
  typeof entry.facts?.zh === "string" &&
  typeof entry.facts?.en === "string" &&
  entry.facts.zh.length <= 1200 &&
  entry.facts.en.length <= 1200 &&
  (!entry.aliases || Array.isArray(entry.aliases)) &&
  (!entry.keywords || Array.isArray(entry.keywords));

const summarizeBatchWithDeepSeek = async (blocks, { apiKey, model, fetchImpl }) => {
  const response = await fetchImpl(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 3600,
      stream: false,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You compress public portfolio source blocks into retrieval knowledge.",
            "Return one JSON object with an entries array.",
            "For every input id, return id, facts.zh, facts.en, aliases, and keywords.",
            "Keep facts concise and factual. Preserve names, dates, counts, awards, URLs, and technologies.",
            "Do not invent, infer, or remove important qualifications.",
            "Website source is authoritative; resume source is supplementary.",
            "Return JSON only.",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify(
            blocks.map((block) => ({
              id: block.id,
              type: block.type,
              title: block.title,
              source: block.source,
              content: block.content,
              hardFacts: block.hardFacts,
              links: block.links,
            })),
          ),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek knowledge request failed with ${response.status}`);
  }

  const payload = await response.json();
  return parseModelJson(payload?.choices?.[0]?.message?.content);
};

export const summarizeBlocksWithDeepSeek = async (
  blocks,
  {
    apiKey = process.env.DEEPSEEK_API_KEY?.trim(),
    model = process.env.KNOWLEDGE_DEEPSEEK_MODEL?.trim() || DEFAULT_MODEL,
    fetchImpl = fetch,
  } = {},
) => {
  if (!apiKey || apiKey === "your_deepseek_key_here" || !blocks.length) return [];

  const generated = [];
  for (const batch of chunk(blocks, BATCH_SIZE)) {
    const entries = await summarizeBatchWithDeepSeek(batch, { apiKey, model, fetchImpl });
    if (Array.isArray(entries)) generated.push(...entries);
  }
  return generated;
};

const writeKnowledge = async (outputPath, knowledge) => {
  await mkdir(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(knowledge, null, 2)}\n`, "utf8");
  await rename(temporaryPath, outputPath);
};

export const buildPortfolioKnowledge = async ({
  rootDir = ROOT_DIR,
  outputPath = DEFAULT_OUTPUT_PATH,
  blocks,
  previousKnowledge,
  summarize = summarizeBlocksWithDeepSeek,
  write = true,
  now = () => new Date(),
} = {}) => {
  const sourceBlocks = blocks ?? await extractPortfolioBlocks({ rootDir });
  const previous = previousKnowledge === undefined
    ? await readPreviousKnowledge(outputPath)
    : previousKnowledge;
  const previousById = new Map((previous?.entries ?? []).map((entry) => [entry.id, entry]));
  const changedBlocks = sourceBlocks.filter(
    (block) => previousById.get(block.id)?.sourceHash !== hashKnowledgeBlock(block),
  );

  let generatedEntries = [];
  if (changedBlocks.length) {
    try {
      const candidateEntries = await summarize(changedBlocks);
      const allowedIds = new Set(changedBlocks.map((block) => block.id));
      generatedEntries = Array.isArray(candidateEntries)
        ? candidateEntries.filter((entry) => isValidGeneratedEntry(entry, allowedIds))
        : [];
    } catch (error) {
      console.warn(`[knowledge] DeepSeek summarization skipped: ${error.message}`);
    }
  }

  const entries = mergeKnowledgeEntries({
    blocks: sourceBlocks,
    previousEntries: previous?.entries ?? [],
    generatedEntries,
  });
  const generatedAt = changedBlocks.length || !previous?.generatedAt
    ? now().toISOString()
    : previous.generatedAt;
  const knowledge = {
    version: KNOWLEDGE_VERSION,
    generatedAt,
    entries,
  };

  if (write) await writeKnowledge(outputPath, knowledge);

  return {
    knowledge,
    changedIds: changedBlocks.map((block) => block.id),
    outputPath,
  };
};

const isDirectRun =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  Object.assign(process.env, loadEnv("production", ROOT_DIR, ""));
  const result = await buildPortfolioKnowledge();
  const changedLabel = result.changedIds.length
    ? `${result.changedIds.length} changed block(s): ${result.changedIds.join(", ")}`
    : "0 changed blocks; reused generated knowledge";
  console.log(`[knowledge] ${changedLabel}`);
  console.log(`[knowledge] wrote ${result.knowledge.entries.length} entries to ${result.outputPath}`);
}

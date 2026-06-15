import { createHash } from "node:crypto";

const normalizeString = (value) => value.replace(/\s+/g, " ").trim();

const normalizeValue = (value) => {
  if (typeof value === "string") return normalizeString(value);
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.keys(value)
      .filter((key) => key !== "sourceHash")
      .sort()
      .map((key) => [key, normalizeValue(value[key])]),
  );
};

const normalizeSearchText = (value) =>
  normalizeString(String(value ?? ""))
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}+#.]+/gu, " ");

const uniqueStrings = (values) =>
  [...new Set((values ?? []).filter((value) => typeof value === "string").map(normalizeString))]
    .filter(Boolean);

export const hashKnowledgeBlock = (block) =>
  createHash("sha256")
    .update(JSON.stringify(normalizeValue(block)))
    .digest("hex");

export const buildDeterministicEntry = (block) => ({
  id: block.id,
  type: block.type,
  title: block.title,
  aliases: uniqueStrings(block.aliases),
  keywords: uniqueStrings(block.keywords),
  priority: Number.isFinite(block.priority) ? block.priority : 0,
  sourceHash: hashKnowledgeBlock(block),
  facts: {
    zh: normalizeString(block.content?.zh ?? block.content?.en ?? ""),
    en: normalizeString(block.content?.en ?? block.content?.zh ?? ""),
  },
  hardFacts: normalizeValue(block.hardFacts ?? {}),
  links: uniqueStrings(block.links),
  source: block.source ?? "website",
});

export const mergeKnowledgeEntries = ({
  blocks,
  previousEntries = [],
  generatedEntries = [],
}) => {
  const previousById = new Map(previousEntries.map((entry) => [entry.id, entry]));
  const generatedById = new Map(generatedEntries.map((entry) => [entry.id, entry]));

  return blocks.map((block) => {
    const sourceHash = hashKnowledgeBlock(block);
    const previous = previousById.get(block.id);
    if (previous?.sourceHash === sourceHash) return previous;

    const deterministic = buildDeterministicEntry(block);
    const generated = generatedById.get(block.id);
    if (!generated) return deterministic;

    return {
      ...deterministic,
      facts: {
        zh: normalizeString(generated.facts?.zh ?? deterministic.facts.zh),
        en: normalizeString(generated.facts?.en ?? deterministic.facts.en),
      },
      aliases: uniqueStrings([...deterministic.aliases, ...(generated.aliases ?? [])]),
      keywords: uniqueStrings([...deterministic.keywords, ...(generated.keywords ?? [])]),
    };
  });
};

const scoreEntry = (entry, normalizedQuestion) => {
  let score = 0;
  const title = normalizeSearchText(entry.title);
  if (title && normalizedQuestion.includes(title)) score += 120;

  for (const alias of entry.aliases ?? []) {
    const normalizedAlias = normalizeSearchText(alias);
    if (normalizedAlias && normalizedQuestion.includes(normalizedAlias)) score += 90;
  }

  for (const keyword of entry.keywords ?? []) {
    const normalizedKeyword = normalizeSearchText(keyword);
    if (normalizedKeyword && normalizedQuestion.includes(normalizedKeyword)) score += 45;
  }

  const summaryText = normalizeSearchText(`${entry.facts?.zh ?? ""} ${entry.facts?.en ?? ""}`);
  for (const token of normalizedQuestion.split(" ").filter((item) => item.length >= 2)) {
    if (summaryText.includes(token)) score += 4;
  }

  return score;
};

export const selectKnowledgeEntries = ({
  knowledge,
  question,
  language = "zh",
  limit = 4,
}) => {
  const entries = Array.isArray(knowledge?.entries) ? knowledge.entries : [];
  if (!entries.length) return [];

  const normalizedQuestion = normalizeSearchText(question);
  const profile = entries.find((entry) => entry.id === "profile");
  const selected = profile ? [profile] : [];
  const scored = entries
    .filter((entry) => entry !== profile)
    .map((entry) => ({ entry, score: scoreEntry(entry, normalizedQuestion, language) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (b.entry.priority ?? 0) - (a.entry.priority ?? 0));

  if (scored.length) {
    const topScore = scored[0].score;
    const relevant = topScore >= 85
      ? scored.filter(({ score }) => score >= Math.max(70, topScore * 0.75))
      : scored;
    selected.push(...relevant.slice(0, Math.max(0, limit - selected.length)).map(({ entry }) => entry));
    return selected;
  }

  const fallbackIds = ["skills", "project-index"];
  for (const id of fallbackIds) {
    const entry = entries.find((candidate) => candidate.id === id);
    if (entry && selected.length < limit) selected.push(entry);
  }

  return selected.slice(0, limit);
};

export const formatKnowledgeContext = (entries, language = "zh") => {
  const locale = language === "en" ? "en" : "zh";

  return entries
    .map((entry) => {
      const lines = [
        `[${entry.type}] ${entry.title}`,
        entry.facts?.[locale] || entry.facts?.zh || entry.facts?.en || "",
      ];

      const hardFacts = entry.hardFacts?.[locale] ?? entry.hardFacts;
      if (hardFacts && Object.keys(hardFacts).length) {
        lines.push(`Facts: ${JSON.stringify(hardFacts)}`);
      }
      if (entry.links?.length) lines.push(`Links: ${entry.links.join(", ")}`);
      return lines.filter(Boolean).join("\n");
    })
    .join("\n\n");
};

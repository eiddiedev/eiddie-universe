import assert from "node:assert/strict";
import test from "node:test";

import { buildPortfolioKnowledge } from "../scripts/build-knowledge.mjs";
import { buildDeterministicEntry } from "../server/knowledge-core.mjs";

const profile = {
  id: "profile",
  type: "profile",
  title: "EIDDIE",
  aliases: ["贾永硕"],
  keywords: ["frontend designer"],
  priority: 100,
  content: { zh: "前端设计师。", en: "Frontend designer." },
  links: [],
  source: "website",
};

const project = {
  id: "project-demo",
  type: "project",
  title: "Demo",
  aliases: ["Demo"],
  keywords: ["React"],
  priority: 60,
  content: { zh: "一个 React 项目。", en: "A React project." },
  links: ["https://example.com"],
  source: "website",
};

test("unchanged blocks reuse previous entries without calling the summarizer", async () => {
  let calls = 0;
  const previousKnowledge = {
    version: 1,
    generatedAt: "2026-06-15T00:00:00.000Z",
    entries: [profile, project].map(buildDeterministicEntry),
  };

  const result = await buildPortfolioKnowledge({
    blocks: [profile, project],
    previousKnowledge,
    summarize: async () => {
      calls += 1;
      return [];
    },
    write: false,
  });

  assert.equal(calls, 0);
  assert.deepEqual(result.changedIds, []);
  assert.equal(result.knowledge.generatedAt, previousKnowledge.generatedAt);
});

test("only changed blocks are sent to the summarizer", async () => {
  let received = [];
  const previousKnowledge = {
    version: 1,
    generatedAt: "2026-06-15T00:00:00.000Z",
    entries: [profile, project].map(buildDeterministicEntry),
  };
  const changedProject = {
    ...project,
    content: { zh: "一个更新后的 React 项目。", en: "An updated React project." },
  };

  const result = await buildPortfolioKnowledge({
    blocks: [profile, changedProject],
    previousKnowledge,
    summarize: async (blocks) => {
      received = blocks;
      return [{
        id: "project-demo",
        facts: { zh: "压缩后的项目摘要。", en: "Compressed project summary." },
        aliases: ["Demo App"],
        keywords: ["React app"],
      }];
    },
    write: false,
  });

  assert.deepEqual(received.map((block) => block.id), ["project-demo"]);
  assert.deepEqual(result.changedIds, ["project-demo"]);
  assert.equal(result.knowledge.entries[1].facts.zh, "压缩后的项目摘要。");
});

test("invalid summarizer output falls back to deterministic content", async () => {
  const result = await buildPortfolioKnowledge({
    blocks: [project],
    previousKnowledge: null,
    summarize: async () => [{ id: "project-demo", facts: { zh: 42 } }],
    write: false,
  });

  assert.equal(result.knowledge.entries[0].facts.zh, project.content.zh);
  assert.equal(result.knowledge.entries[0].links[0], "https://example.com");
});

test("website source metadata remains authoritative over resume entries", async () => {
  const resume = {
    ...profile,
    id: "resume-zh",
    type: "resume",
    title: "中文简历",
    priority: 50,
    content: { zh: "旧的职位描述。", en: "" },
    source: "resume",
  };

  const result = await buildPortfolioKnowledge({
    blocks: [profile, resume],
    previousKnowledge: null,
    summarize: async () => [],
    write: false,
  });

  const [websiteEntry, resumeEntry] = result.knowledge.entries;
  assert.equal(websiteEntry.source, "website");
  assert.ok(websiteEntry.priority > resumeEntry.priority);
});

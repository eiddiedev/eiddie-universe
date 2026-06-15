import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  createKnowledgeRetriever,
  loadKnowledgeArtifact,
  retrieveKnowledgeContext,
} from "../server/knowledge-retriever.mjs";

const knowledge = {
  version: 1,
  entries: [
    {
      id: "profile",
      type: "profile",
      title: "EIDDIE",
      aliases: ["贾永硕"],
      keywords: ["frontend designer"],
      priority: 100,
      facts: { zh: "EIDDIE 是前端设计师。", en: "EIDDIE is a frontend designer." },
      links: [],
      source: "website",
    },
    {
      id: "skills",
      type: "dossier",
      title: "Skills",
      aliases: ["技能"],
      keywords: ["React", "TypeScript"],
      priority: 85,
      facts: { zh: "擅长 React。", en: "Works with React." },
      links: [],
      source: "website",
    },
    {
      id: "project-yeverse",
      type: "project",
      title: "YeVerse",
      aliases: ["Ye Verse"],
      keywords: ["Three.js", "音乐档案"],
      priority: 60,
      facts: {
        zh: "沉浸式音乐人物档案。",
        en: "An immersive artist archive.",
      },
      links: ["https://ye.eiddie.me"],
      source: "website",
    },
    {
      id: "project-other",
      type: "project",
      title: "Other",
      aliases: [],
      keywords: ["Swift"],
      priority: 60,
      facts: { zh: "另一个项目。", en: "Another project." },
      links: [],
      source: "website",
    },
  ],
};

test("retrieveKnowledgeContext includes the named project and profile only", () => {
  const result = retrieveKnowledgeContext({
    knowledge,
    question: "YeVerse 使用了什么技术？",
    language: "zh",
  });

  assert.deepEqual(result.entries.map((entry) => entry.id), ["profile", "project-yeverse"]);
  assert.match(result.context, /YeVerse/);
  assert.doesNotMatch(result.context, /Another project|另一个项目/);
});

test("retrieveKnowledgeContext uses English facts for English requests", () => {
  const result = retrieveKnowledgeContext({
    knowledge,
    question: "Tell me about YeVerse",
    language: "en",
  });

  assert.match(result.context, /immersive artist archive/);
  assert.doesNotMatch(result.context, /沉浸式/);
});

test("general questions fall back to profile and skills", () => {
  const result = retrieveKnowledgeContext({
    knowledge,
    question: "你喜欢怎样合作？",
    language: "zh",
  });

  assert.deepEqual(result.entries.map((entry) => entry.id), ["profile", "skills"]);
});

test("loadKnowledgeArtifact and the cached retriever fail safely", async () => {
  const directory = await mkdtemp(join(tmpdir(), "portfolio-knowledge-"));
  const invalidPath = join(directory, "invalid.json");
  const missingPath = join(directory, "missing.json");
  await writeFile(invalidPath, "{invalid", "utf8");

  assert.equal(loadKnowledgeArtifact(invalidPath), null);
  assert.equal(loadKnowledgeArtifact(missingPath), null);

  const retrieve = createKnowledgeRetriever({ knowledgePath: invalidPath });
  assert.deepEqual(retrieve({ question: "YeVerse", language: "zh" }), {
    context: "",
    entries: [],
  });
});

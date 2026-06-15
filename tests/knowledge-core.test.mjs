import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDeterministicEntry,
  formatKnowledgeContext,
  hashKnowledgeBlock,
  mergeKnowledgeEntries,
  selectKnowledgeEntries,
} from "../server/knowledge-core.mjs";

const profileBlock = {
  id: "profile",
  type: "profile",
  title: "EIDDIE",
  aliases: ["贾永硕", "EIDDIE"],
  keywords: ["前端设计师", "frontend designer"],
  priority: 100,
  content: {
    zh: "EIDDIE 是一名前端设计师。",
    en: "EIDDIE is a frontend designer.",
  },
  links: [],
};

const skillsBlock = {
  id: "skills",
  type: "skills",
  title: "Skills",
  aliases: ["技能", "技术栈"],
  keywords: ["React", "TypeScript", "设计"],
  priority: 80,
  content: {
    zh: "React、TypeScript、体验设计。",
    en: "React, TypeScript, and experience design.",
  },
  links: [],
};

const yeverseBlock = {
  id: "project-yeverse",
  type: "project",
  title: "YeVerse",
  aliases: ["Ye Verse"],
  keywords: ["Three.js", "音乐档案", "artist archive"],
  priority: 60,
  content: {
    zh: "YeVerse 是一个沉浸式音乐人物档案。",
    en: "YeVerse is an immersive artist archive.",
  },
  links: ["https://ye.eiddie.me"],
};

test("hashKnowledgeBlock ignores object key order and repeated whitespace", () => {
  const first = {
    ...yeverseBlock,
    content: { zh: "YeVerse  是一个\n沉浸式档案。", en: "Artist archive" },
  };
  const second = {
    content: { en: "Artist archive", zh: "YeVerse 是一个 沉浸式档案。" },
    priority: 60,
    keywords: ["Three.js", "音乐档案", "artist archive"],
    aliases: ["Ye Verse"],
    links: ["https://ye.eiddie.me"],
    title: "YeVerse",
    type: "project",
    id: "project-yeverse",
  };

  assert.equal(hashKnowledgeBlock(first), hashKnowledgeBlock(second));
});

test("mergeKnowledgeEntries reuses entries whose source hash has not changed", () => {
  const previous = {
    ...buildDeterministicEntry(yeverseBlock),
    facts: {
      zh: "已由模型压缩的 YeVerse 摘要。",
      en: "Previously compressed YeVerse summary.",
    },
  };

  const result = mergeKnowledgeEntries({
    blocks: [yeverseBlock],
    previousEntries: [previous],
    generatedEntries: [],
  });

  assert.equal(result[0].facts.zh, previous.facts.zh);
  assert.equal(result[0].sourceHash, hashKnowledgeBlock(yeverseBlock));
});

test("selectKnowledgeEntries ranks a directly named project and always includes profile", () => {
  const projectIndex = {
    id: "project-index",
    type: "index",
    title: "Projects",
    aliases: ["项目", "作品"],
    keywords: ["YeVerse", "LyricFlow"],
    priority: 55,
    content: {
      zh: "当前公开项目：YeVerse、LyricFlow。",
      en: "Current public projects: YeVerse, LyricFlow.",
    },
    links: [],
  };
  const knowledge = {
    entries: [profileBlock, skillsBlock, projectIndex, yeverseBlock].map(buildDeterministicEntry),
  };

  const selected = selectKnowledgeEntries({
    knowledge,
    question: "YeVerse 的 3D 专辑交互是怎么做的？",
    language: "zh",
    limit: 3,
  });

  assert.deepEqual(
    selected.map((entry) => entry.id),
    ["profile", "project-yeverse"],
  );
});

test("selectKnowledgeEntries falls back to profile and skills for a general question", () => {
  const knowledge = {
    entries: [profileBlock, skillsBlock, yeverseBlock].map(buildDeterministicEntry),
  };

  const selected = selectKnowledgeEntries({
    knowledge,
    question: "你适合怎样的合作方式？",
    language: "zh",
    limit: 3,
  });

  assert.deepEqual(
    selected.map((entry) => entry.id),
    ["profile", "skills"],
  );
});

test("formatKnowledgeContext uses only the requested language", () => {
  const context = formatKnowledgeContext(
    [buildDeterministicEntry(yeverseBlock)],
    "en",
  );

  assert.match(context, /immersive artist archive/);
  assert.doesNotMatch(context, /沉浸式/);
});

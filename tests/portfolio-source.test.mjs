import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";

import {
  extractPortfolioBlocks,
  extractResumeText,
  loadPortfolioSourceData,
} from "../scripts/portfolio-source.mjs";

const rootDir = resolve(import.meta.dirname, "..");

test("loadPortfolioSourceData reads the project and dossier objects used by the website", async () => {
  const source = await loadPortfolioSourceData({ rootDir });

  assert.ok(source.projects.yeverse);
  assert.ok(source.projects.lyricflow);
  assert.ok(Object.keys(source.projects).length >= 7);
  assert.match(source.dossier.profile.zh.body, /前端工程师/);
  assert.match(source.dossier.experience.en.title, /Honors/);
  assert.match(source.resumeUrls.zh, /experience-design-frontend-zh\.pdf$/);
});

test("extractPortfolioBlocks creates focused entries without navigation or decorative copy", async () => {
  const blocks = await extractPortfolioBlocks({ rootDir, includeResumes: false });
  const ids = blocks.map((block) => block.id);
  const serialized = JSON.stringify(blocks);

  assert.ok(ids.includes("profile"));
  assert.ok(ids.includes("skills"));
  assert.ok(ids.includes("site-overview"));
  assert.ok(ids.includes("project-yeverse"));
  assert.ok(ids.includes("project-lyricflow"));
  assert.ok(ids.includes("project-index"));
  assert.match(
    blocks.find((block) => block.id === "site-overview").content.en,
    /FRONTEND DESIGNER/,
  );
  assert.doesNotMatch(serialized, /Scroll Down|CLICK ME OR THE FILE|ISSUES/);
});

test("extractResumeText reads substantial text from both current public resumes", async () => {
  const source = await loadPortfolioSourceData({ rootDir });
  const chinese = await extractResumeText(resolve(rootDir, "public", source.resumeUrls.zh.slice(1)));
  const english = await extractResumeText(resolve(rootDir, "public", source.resumeUrls.en.slice(1)));

  assert.ok(chinese.length > 300);
  assert.ok(english.length > 300);
  assert.match(chinese, /贾永硕/);
  assert.match(english.toLowerCase(), /jia|eiddie/);
});

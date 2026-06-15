# Automatic Portfolio Knowledge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically derive compact assistant knowledge from the current portfolio and resumes during builds, then retrieve only relevant entries for each chat request.

**Architecture:** A build-time extractor reads the exact project and dossier objects used by `script.js`, meaningful page text from `index.html`, and both public resume PDFs. A knowledge builder hashes independent blocks, reuses unchanged entries, asks DeepSeek to compress only changed blocks, and falls back to deterministic summaries. The server loads the generated artifact and performs lightweight local retrieval before making the existing answer request.

**Tech Stack:** Node.js ESM, Node test runner, Acorn, PDF.js, DeepSeek Chat Completions API, Vite.

---

### Task 1: Knowledge Core And Retrieval

**Files:**
- Create: `server/knowledge-core.mjs`
- Create: `tests/knowledge-core.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests for stable hashing, changed-entry reuse, and bilingual retrieval**

Use `node:test` to assert that normalized equivalent blocks produce the same hash, unchanged entries are reused, a YeVerse query ranks the YeVerse entry first, and an unknown query falls back to profile and skills.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/knowledge-core.test.mjs`

Expected: FAIL because `server/knowledge-core.mjs` does not exist.

- [ ] **Step 3: Implement pure knowledge helpers**

Export:

```js
export const hashKnowledgeBlock = (block) => {};
export const buildDeterministicEntry = (block) => {};
export const mergeKnowledgeEntries = ({ blocks, previousEntries, generatedEntries }) => {};
export const selectKnowledgeEntries = ({ knowledge, question, language, limit }) => {};
export const formatKnowledgeContext = (entries, language) => {};
```

The implementation must normalize object key order, preserve hard facts and links, score aliases and keywords more strongly than summary text, always include profile, and cap runtime context.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test tests/knowledge-core.test.mjs`

Expected: all tests pass.

### Task 2: Automatic Website And Resume Extraction

**Files:**
- Create: `scripts/portfolio-source.mjs`
- Create: `tests/portfolio-source.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Add failing extraction tests**

Tests must load the real repository source and assert that:

- `PROJECT_DETAILS` yields all current projects, including YeVerse and LyricFlow.
- `PAPER_MODAL_CONTENT` yields bilingual profile, education, experience, contact, and resume records.
- Resume extraction returns substantial text for both configured PDFs.
- Decorative and navigation-only text are not emitted as knowledge blocks.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/portfolio-source.test.mjs`

Expected: FAIL because the extractor does not exist.

- [ ] **Step 3: Install parser dependencies**

Run: `npm install --save-dev acorn pdfjs-dist`

- [ ] **Step 4: Implement source extraction**

Parse `script.js` with Acorn, locate the initializer ranges for `PROJECT_DETAILS`, `PAPER_MODAL_CONTENT`, and `RESUME_URLS`, and evaluate only those data expressions in a restricted VM context. Convert them into independent bilingual knowledge blocks. Use PDF.js to extract text from the two resume files.

- [ ] **Step 5: Run extraction tests and verify GREEN**

Run: `node --test tests/portfolio-source.test.mjs`

Expected: all tests pass and no browser DOM is required.

### Task 3: Incremental DeepSeek Knowledge Builder

**Files:**
- Create: `scripts/build-knowledge.mjs`
- Create: `tests/build-knowledge.test.mjs`
- Create: `generated/portfolio-knowledge.json`
- Modify: `.env.example`
- Modify: `.gitignore`
- Modify: `package.json`

- [ ] **Step 1: Write failing incremental-generation tests**

Test injected summarizer behavior:

- No changed hash means zero summarizer calls.
- One changed project means one summarizer call.
- Invalid model JSON produces a deterministic entry.
- Website entries retain priority metadata over resume entries.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/build-knowledge.test.mjs`

Expected: FAIL because the builder does not exist.

- [ ] **Step 3: Implement the builder**

Export a testable `buildPortfolioKnowledge()` function and keep CLI startup behind an entry-point check. The DeepSeek request must use strict JSON instructions, low temperature, bounded output, and validate the returned entry before accepting it. Without `DEEPSEEK_API_KEY`, generate deterministic entries and complete successfully.

- [ ] **Step 4: Wire build scripts**

Use:

```json
{
  "scripts": {
    "knowledge:build": "node scripts/build-knowledge.mjs",
    "test": "node --test tests/*.test.mjs",
    "build": "npm run knowledge:build && vite build"
  }
}
```

- [ ] **Step 5: Generate the initial artifact and verify GREEN**

Run: `npm run knowledge:build`

Expected: `generated/portfolio-knowledge.json` contains profile, skills/dossier, resume, and every current project.

Run: `node --test tests/build-knowledge.test.mjs`

Expected: all tests pass.

### Task 4: Runtime Retrieval And Assistant Integration

**Files:**
- Create: `server/knowledge-retriever.mjs`
- Create: `tests/knowledge-retriever.test.mjs`
- Modify: `server/assistant-handler.mjs`

- [ ] **Step 1: Write failing runtime tests**

Assert that:

- Project questions include the requested project and profile, not the entire knowledge file.
- General collaboration questions include profile and skills.
- English requests format English summaries.
- Missing or invalid generated knowledge returns an empty safe context.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/knowledge-retriever.test.mjs`

Expected: FAIL because the retriever does not exist.

- [ ] **Step 3: Implement cached artifact loading**

Load and validate `generated/portfolio-knowledge.json` once per server instance. Expose a retrieval function that uses the pure scorer and returns a bounded formatted context.

- [ ] **Step 4: Replace fixed factual prompt content**

Keep personality, scope, safety, language, and non-fabrication rules in `assistant-handler.mjs`. Remove the manually maintained factual list and append retrieved context to the system message for each question.

- [ ] **Step 5: Run runtime tests and verify GREEN**

Run: `node --test tests/knowledge-retriever.test.mjs`

Expected: all tests pass.

### Task 5: End-To-End Verification And Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the automatic pipeline**

Explain that website and resume edits are detected during `npm run build`, unchanged blocks are reused, and runtime requests retrieve only relevant entries.

- [ ] **Step 2: Run the complete test suite**

Run: `npm test`

Expected: all knowledge extraction, generation, and retrieval tests pass.

- [ ] **Step 3: Run two consecutive production builds**

Run: `npm run build && npm run build`

Expected: both builds pass; the second knowledge build reports zero changed blocks and makes no summarization requests.

- [ ] **Step 4: Verify the local assistant endpoint**

Start Vite, POST Chinese and English project questions to `/api/ask`, and confirm the server selects bounded relevant context without exposing the knowledge artifact or API key.

- [ ] **Step 5: Review generated content and repository diff**

Check that all public projects and both resumes are represented, no secrets are present, and unrelated website files remain unchanged.

- [ ] **Step 6: Commit implementation**

Commit the tests, scripts, generated artifact, server integration, dependency lockfile, and documentation as one reviewed feature change.

# Automatic Portfolio Knowledge Design

## Goal

The portfolio assistant must answer from the latest website and resume content without requiring a separately maintained prompt or knowledge document.

Updating project cards, About information, skills, contact details, or resume files must automatically update the assistant knowledge during the next build.

## Source Of Truth

Website content remains authoritative.

Structured content currently embedded in `script.js` will move into shared data modules. The website UI and the knowledge build process will import the same modules, so there is no duplicated hand-maintained knowledge base.

Knowledge sources:

- Profile and About dossier content
- Skills and working style
- Every published project, including bilingual descriptions, stack, highlights, and links
- Public contact information
- Chinese and English resume PDFs

Navigation labels, decorative copy, accessibility labels, animation text, and UI instructions are excluded.

When website and resume facts conflict, website content wins. The resume is supplementary.

## Build Pipeline

`npm run build` will run these stages:

1. `knowledge:build`
2. Vite production build

The knowledge builder will:

1. Import the shared website content modules.
2. Extract text from the current Chinese and English resume PDFs.
3. Split input into independent source blocks such as `profile`, `skills`, `resume`, and one block per project.
4. Normalize each block and calculate a SHA-256 source hash.
5. Compare hashes with the previous generated knowledge file.
6. Reuse unchanged knowledge entries.
7. Send only changed blocks to DeepSeek for compression and keyword generation.
8. Validate the returned JSON and merge it with unchanged entries.
9. Write the production knowledge artifact.

The generated artifact will contain:

```json
{
  "version": 1,
  "generatedAt": "ISO timestamp",
  "entries": [
    {
      "id": "project-yeverse",
      "type": "project",
      "title": "YeVerse",
      "keywords": ["YeVerse", "Three.js", "音乐档案"],
      "sourceHash": "sha256",
      "facts": {
        "zh": "Compact factual summary",
        "en": "Compact factual summary"
      },
      "links": []
    }
  ]
}
```

Hard facts such as names, dates, awards, URLs, technologies, and numbers will also be copied deterministically from source data. DeepSeek may shorten prose and generate retrieval keywords, but it may not replace hard facts.

## Incremental Generation

DeepSeek is called only when a block hash changes.

Examples:

- Editing LyricFlow only regenerates the LyricFlow entry.
- Replacing the Chinese resume only regenerates the Chinese resume entry.
- CSS, animation, and layout changes do not regenerate knowledge.
- A build with no content changes makes no DeepSeek request.

The previous generated artifact is the incremental cache. It will be kept in the repository so local and deployment builds can compare source hashes consistently.

## Runtime Retrieval

The assistant API will not send the full knowledge base with every question.

For each request it will:

1. Normalize the question and current interface language.
2. Score entries using title, aliases, generated keywords, tags, and direct substring matches.
3. Always include a compact profile entry.
4. Add the highest-scoring two or three relevant entries.
5. Send only those entries to DeepSeek with the assistant behavior rules.

This keeps normal prompts small while allowing project-specific answers to include precise details.

If no entry scores clearly, the API sends the profile, skills, and project index entries rather than the entire knowledge base.

## DeepSeek Build Contract

Changed blocks are sent with a strict JSON response schema. DeepSeek must:

- Preserve all supplied facts.
- Produce concise Chinese and English summaries.
- Generate retrieval keywords and aliases.
- Avoid unsupported inference.
- Exclude private or implementation-only data.
- Return JSON only.

The builder validates IDs, languages, field lengths, and required hard facts before accepting the response.

## Failure Handling

The public website build must not become unusable because DeepSeek is temporarily unavailable.

- If a changed block cannot be summarized, the builder creates a deterministic compact entry from the source block and logs a warning.
- If a previous valid entry exists, it is retained only when its source hash still matches.
- Invalid model JSON is rejected.
- Missing resume text does not remove website knowledge; the build continues with a warning.
- The runtime assistant loads the generated artifact once per server instance and returns a controlled fallback if it is missing or invalid.

## Security

- `DEEPSEEK_API_KEY` remains server/build-only.
- No API key or raw private prompt is written to `public/` or the browser bundle.
- Only public website and public resume information enters the generated artifact.
- Runtime requests keep the existing question-length and topic restrictions.

## Files And Boundaries

Expected implementation boundaries:

- `data/portfolio-content.js`: shared public profile and project facts
- `scripts/build-knowledge.mjs`: extraction, hashing, incremental generation, validation
- `server/knowledge-retriever.mjs`: query scoring and context selection
- `server/assistant-handler.mjs`: behavior prompt and DeepSeek answer request
- `generated/portfolio-knowledge.json`: generated, reviewable knowledge artifact
- Resume PDFs under `public/resume/`: supplementary source files

The exact module split may be adjusted to match existing imports, but generated knowledge must never become a manually edited source.

## Verification

Automated checks will cover:

- Unchanged content causes zero summarization requests.
- Changing one project regenerates only that project.
- Website facts override conflicting resume facts.
- Retrieval selects the expected project for Chinese and English questions.
- General questions receive profile and skills context.
- Invalid model output falls back without breaking the build.
- The production build completes and the existing chat UI still answers through `/api/ask`.

## Success Criteria

- No fixed factual knowledge list remains in the assistant system prompt.
- One website content edit updates both UI and assistant knowledge.
- One resume replacement updates knowledge on the next build.
- Normal user questions send only a small relevant context subset.
- Builds remain usable when the summarization API fails.

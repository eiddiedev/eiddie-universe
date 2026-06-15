import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";

import { parse } from "acorn";
import { parse as parseHtml } from "parse5";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const DATA_VARIABLES = ["RESUME_URLS", "PROJECT_DETAILS", "PAPER_MODAL_CONTENT"];
const DOSSIER_PRIORITIES = {
  profile: 100,
  skills: 85,
  education: 70,
  experience: 75,
  bio: 80,
  contact: 65,
  interests: 40,
  motto: 30,
  spider: 20,
  location: 45,
};

const normalizeText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const normalizePdfText = (value) =>
  normalizeText(value)
    .replace(/([\p{Script=Han}])\s+(?=[\p{Script=Han}])/gu, "$1")
    .replace(/\s+([，。；：！？、）])/g, "$1")
    .replace(/([（])\s+/g, "$1");

const decodeHtmlEntities = (value) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

const stripHtml = (value) =>
  normalizeText(
    decodeHtmlEntities(
      String(value ?? "")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<\/?(?:p|div|li|h[1-6]|br|ul|ol)[^>]*>/gi, " ")
        .replace(/<[^>]+>/g, " "),
    ),
  );

const findVariableInitializers = (source) => {
  const ast = parse(source, {
    ecmaVersion: "latest",
    sourceType: "module",
  });
  const initializers = new Map();

  for (const statement of ast.body) {
    if (statement.type !== "VariableDeclaration") continue;
    for (const declaration of statement.declarations) {
      const name = declaration.id?.type === "Identifier" ? declaration.id.name : "";
      if (DATA_VARIABLES.includes(name) && declaration.init) {
        initializers.set(name, source.slice(declaration.init.start, declaration.init.end));
      }
    }
  }

  return initializers;
};

const evaluateDataExpression = (expression, context = {}) =>
  vm.runInNewContext(`(${expression})`, Object.freeze({ ...context }), {
    timeout: 1000,
    displayErrors: true,
  });

const getAttribute = (node, name) =>
  node.attrs?.find((attribute) => attribute.name === name)?.value ?? "";

const getNodeText = (node) => {
  if (node.nodeName === "#text") return node.value ?? "";
  if (getAttribute(node, "aria-hidden") === "true") return "";
  return (node.childNodes ?? []).map(getNodeText).join(" ");
};

const collectElements = (node, predicate, results = []) => {
  if (predicate(node)) results.push(node);
  for (const child of node.childNodes ?? []) collectElements(child, predicate, results);
  return results;
};

const extractPageOverview = async (rootDir) => {
  const document = parseHtml(await readFile(resolve(rootDir, "index.html"), "utf8"));
  const titleNode = collectElements(document, (node) => node.tagName === "title")[0];
  const summaryNodes = collectElements(
    document,
    (node) => getAttribute(node, "class").split(/\s+/).includes("section-summary"),
  );
  const nameCopyNodes = collectElements(
    document,
    (node) => getAttribute(node, "class").split(/\s+/).includes("name-copy"),
  );
  const contactCopyNode = collectElements(
    document,
    (node) => getAttribute(node, "class").split(/\s+/).includes("contact-copy"),
  )[0];
  const englishRoles = nameCopyNodes
    .flatMap((node) => collectElements(node, (child) => child.tagName === "em"))
    .map((node) => normalizeText(getNodeText(node)));
  const chineseRoles = nameCopyNodes
    .flatMap((node) => collectElements(
      node,
      (child) => getAttribute(child, "class").split(/\s+/).includes("name-translation"),
    ))
    .map((node) => normalizeText(getNodeText(node)));
  const summaries = summaryNodes.map((node) => normalizeText(getNodeText(node)));
  const title = normalizeText(getNodeText(titleNode));

  return {
    id: "site-overview",
    type: "overview",
    title: title || "EIDDIE Portfolio",
    aliases: ["EIDDIE", "作品集", "portfolio"],
    keywords: splitTerms(englishRoles, chineseRoles, "frontend designer", "前端设计师"),
    priority: 90,
    content: {
      zh: normalizeText(
        `${title} ${chineseRoles.join("、")} ${normalizeText(getNodeText(contactCopyNode))}`,
      ),
      en: normalizeText(`${title} ${summaries.join(" ")} ${englishRoles.join(", ")}`),
    },
    links: [],
    source: "website",
  };
};

export const loadPortfolioSourceData = async ({ rootDir = process.cwd() } = {}) => {
  const scriptPath = resolve(rootDir, "script.js");
  const source = await readFile(scriptPath, "utf8");
  const initializers = findVariableInitializers(source);

  for (const name of DATA_VARIABLES) {
    if (!initializers.has(name)) {
      throw new Error(`Unable to find ${name} in ${scriptPath}`);
    }
  }

  const resumeUrls = evaluateDataExpression(initializers.get("RESUME_URLS"));
  const projects = evaluateDataExpression(initializers.get("PROJECT_DETAILS"));
  const dossier = evaluateDataExpression(initializers.get("PAPER_MODAL_CONTENT"), {
    RESUME_URLS: resumeUrls,
  });

  return { resumeUrls, projects, dossier };
};

const splitTerms = (...values) =>
  [...new Set(
    values
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .flatMap((value) => String(value ?? "").split(/[、,/|·]+/))
      .map(normalizeText)
      .filter(Boolean),
  )];

const projectToBlock = ([projectId, project]) => ({
  id: `project-${projectId}`,
  type: "project",
  title: project.title,
  aliases: splitTerms(projectId, project.title, project.linkLabel, project.githubLabel),
  keywords: splitTerms(
    project.type?.zh,
    project.type?.en,
    project.meta?.zh,
    project.meta?.en,
    project.signals?.zh,
    project.signals?.en,
  ),
  priority: 60,
  content: {
    zh: normalizeText(`${project.frontIntro?.zh ?? ""} ${project.description?.zh ?? ""}`),
    en: normalizeText(`${project.frontIntro?.en ?? ""} ${project.description?.en ?? ""}`),
  },
  hardFacts: {
    zh: {
      类型: project.type?.zh ?? "",
      技术栈: project.meta?.zh ?? "",
      亮点: project.signals?.zh ?? [],
    },
    en: {
      type: project.type?.en ?? "",
      stack: project.meta?.en ?? "",
      highlights: project.signals?.en ?? [],
    },
  },
  links: [project.link, project.githubLink].filter(Boolean),
  source: "website",
});

const dossierToBlock = ([cardId, card]) => ({
  id: cardId,
  type: cardId === "profile" ? "profile" : "dossier",
  title: card.en?.title || card.zh?.title || cardId,
  aliases: splitTerms(card.zh?.title, card.en?.title),
  keywords: splitTerms(card.zh?.title, card.en?.title, stripHtml(card.zh?.body).split(" ").slice(0, 16)),
  priority: DOSSIER_PRIORITIES[cardId] ?? 35,
  content: {
    zh: stripHtml(card.zh?.body),
    en: stripHtml(card.en?.body),
  },
  links: [],
  source: "website",
});

export const extractResumeText = async (filePath) => {
  const data = new Uint8Array(await readFile(filePath));
  const loadingTask = getDocument({
    data,
    useSystemFonts: true,
    isEvalSupported: false,
  });
  const document = await loadingTask.promise;
  const pages = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const text = await page.getTextContent();
      pages.push(text.items.map((item) => item.str ?? "").join(" "));
    }
  } finally {
    await document.cleanup();
    await loadingTask.destroy();
  }

  return normalizePdfText(pages.join("\n"));
};

export const extractPortfolioBlocks = async ({
  rootDir = process.cwd(),
  includeResumes = true,
} = {}) => {
  const { projects, dossier, resumeUrls } = await loadPortfolioSourceData({ rootDir });
  const pageOverview = await extractPageOverview(rootDir);
  const projectBlocks = Object.entries(projects).map(projectToBlock);
  const dossierBlocks = Object.entries(dossier)
    .filter(([cardId]) => cardId !== "resume")
    .map(dossierToBlock);
  const projectIndex = {
    id: "project-index",
    type: "index",
    title: "Projects",
    aliases: ["项目", "作品", "projects", "portfolio"],
    keywords: projectBlocks.flatMap((block) => [block.title, ...block.aliases]),
    priority: 55,
    content: {
      zh: `当前公开项目：${projectBlocks.map((block) => block.title).join("、")}。`,
      en: `Current public projects: ${projectBlocks.map((block) => block.title).join(", ")}.`,
    },
    links: projectBlocks.flatMap((block) => block.links),
    source: "website",
  };

  const blocks = [pageOverview, ...dossierBlocks, projectIndex, ...projectBlocks];
  if (!includeResumes) return blocks;

  for (const language of ["zh", "en"]) {
    const publicPath = resumeUrls[language];
    if (!publicPath) continue;

    try {
      const text = await extractResumeText(resolve(rootDir, "public", publicPath.replace(/^\//, "")));
      blocks.push({
        id: `resume-${language}`,
        type: "resume",
        title: language === "zh" ? "中文简历" : "English Resume",
        aliases: language === "zh" ? ["简历", "履历"] : ["resume", "cv"],
        keywords: language === "zh" ? ["教育", "项目", "荣誉", "技能"] : ["education", "projects", "honors", "skills"],
        priority: 50,
        content: {
          zh: language === "zh" ? text : "",
          en: language === "en" ? text : "",
        },
        links: [publicPath],
        source: "resume",
      });
    } catch (error) {
      console.warn(`[knowledge] Unable to read ${language} resume: ${error.message}`);
    }
  }

  return blocks;
};

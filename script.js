const root = document.documentElement;
const siteLoader = document.getElementById("site-loader");
const heroSection = document.querySelector(".hero-section");
const heroPeelElement = document.getElementById("hero-peel");
const nameSection = document.querySelector(".name-section");
const nameRows = [...document.querySelectorAll(".name-row")];
const topbar = document.querySelector(".topbar");
const topbarToggle = document.getElementById("topbar-toggle");
const topbarNav = document.getElementById("topbar-nav");
const topbarNavLinks = [...document.querySelectorAll(".topbar-nav a")];
const issueSections = [...document.querySelectorAll(".issue-section[data-issue]")];
const aboutSection = document.querySelector(".issue-section--about");
const aboutHeading = document.querySelector(".issue-section--about .section-heading");
const aboutPanel = document.querySelector(".issue-section--about .about-panel");
const skillsSection = document.querySelector(".issue-section--skills");
const projectsSection = document.querySelector(".issue-section--projects");
const contactSection = document.querySelector(".issue-section--contact");
const projectGrid = document.querySelector(".issue-section--projects .project-grid");
const projectCards = [...document.querySelectorAll(".issue-section--projects .project-card")];
const skillBadges = [...document.querySelectorAll(".issue-section--skills .tool-badge")];
const revealItems = [...document.querySelectorAll(".reveal")].filter(
  (item) => !item.classList.contains("project-card"),
);
const questionChips = document.querySelectorAll(".question-chip");
const answerBox = document.getElementById("assistant-answer");
const askForm = document.getElementById("assistant-ask-form");
const askInput = document.getElementById("assistant-question");
const askSubmit = document.getElementById("assistant-ask-submit");
const askStatus = document.getElementById("assistant-status");
const projectButtons = document.querySelectorAll(".project-card__button");
const projectModal = document.getElementById("project-modal");
const modalPanel = document.querySelector(".project-modal__panel");
const modalFront = document.getElementById("project-modal-front");
const modalMirror = document.getElementById("project-modal-mirror");
const modalTitle = document.getElementById("project-modal-title");
const modalType = document.getElementById("project-modal-type");
const modalDescription = document.getElementById("project-modal-description");
const modalDomain = document.getElementById("project-modal-domain");
const modalGithub = document.getElementById("project-modal-github");
const modalGithubNote = document.getElementById("project-modal-github-note");
const modalMeta = document.getElementById("project-modal-meta");
const modalSignals = document.getElementById("project-modal-signals");
const modalPreview = document.getElementById("project-modal-preview");
const modalProofs = document.getElementById("project-modal-proofs");
const modalProofTrigger = document.getElementById("project-modal-proof-trigger");
const modalProofSheet = document.getElementById("project-modal-proof-sheet");
const contactIcon = document.querySelector(".contact-callout__icon");
const copyContactButtons = [...document.querySelectorAll(".contact-link--copy[data-copy-value]")];
const languageToggle = document.getElementById("language-toggle");
const heroScrollLabel = document.querySelector(".hero-scroll__label");
const nameTranslationNodes = [...document.querySelectorAll(".name-translation")];
const nameLetterOverlayNodes = nameRows.map((row, index) => {
  const shell = row.querySelector(".name-letter-shell");
  if (!(shell instanceof HTMLElement)) return null;

  const overlay = document.createElement("span");
  overlay.className = "name-letter-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.textContent = nameTranslationNodes[index]?.textContent?.trim() ?? "";
  shell.append(overlay);
  return overlay;
});
const aboutFactBodies = [...document.querySelectorAll(".about-facts article p:not(.fact-label)")];
const contactCopy = document.querySelector(".contact-copy");
const modalProofHeading = document.querySelector(".project-modal__proof-heading");
const modalProofNote = document.querySelector(".project-modal__proof-note");

let activeProjectButton = null;
let activeProjectData = null;
let closeTimer = null;
let closeStageTimer = null;
let flipTimer = null;
let collapseAnimation = null;
let suppressedHoverButton = null;
let lastPointerPosition = null;
let assistantRequestId = 0;
let heroPeel = null;
let heroPeelTime = 0;
let currentLanguage = "zh";
let pendingAssistantQuestion = "";
const visibleIssueSections = new Set();
const issueIntersectionRatios = new Map();
const copyFeedbackTimers = new WeakMap();

const PANEL_TRANSITION_MS = 620;
const CLOSE_RETURN_DELAY_MS = 520;
const CLOSE_COLLAPSE_MS = 760;
const FLIP_DELAY_MS = 120;
const MODAL_EXIT_BUFFER_MS = 90;
const SKILL_BADGE_SEQUENCE = [7, 2, 10, 4, 1, 13, 8, 14, 9, 16, 6, 15, 5, 11, 3, 12];
const LANGUAGE_STORAGE_KEY = "site-language";
const defaultAssistantAnswer = answerBox?.textContent?.trim() ?? "";
const defaultAssistantStatus = askStatus?.textContent?.trim() ?? "";
const lowMemoryDevice =
  Boolean(navigator.connection?.saveData) ||
  (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 8);
const LOADER_MIN_VISIBLE_MS = 520;
const LANGUAGE_COPY = {
  zh: {
    buttonLabel: "CH",
    buttonAria: "Switch to English",
    htmlLang: "zh-CN",
    heroScroll: "向下滑动",
    nameTranslations: [
      "工程实现",
      "AI 智能",
      "全栈开发",
      "体验设计",
      "系统落地",
      "持续迭代",
    ],
    assistant: {
      defaultAnswer:
        "我更喜欢做那些有明确个性和记忆点的项目。对我来说，好的产品不是把功能机械拼起来，而是能让人一眼记住、愿意继续用下去。",
      defaultStatus: defaultAssistantStatus,
      emptyQuestion: "先输入一个和 EIDDIE 相关的问题，我再继续回答。",
      loadingAnswer: (question) => `正在整理关于“${question}”的回答...`,
      loadingStatus: "DeepSeek 正在生成回答，只回答和 EIDDIE 本人、经历、技能、项目、合作方式相关的问题。",
      followUpStatus: "也可以继续换个问法，直接聊我做的项目、技能和合作方式。",
      requestError: "暂时无法连接 DeepSeek，已先切回预设回答。",
      placeholder: "比如：如果我想和你一起做 AI 产品，你会先从哪里开始？",
      questions: [
        {
          label: "你最想做什么样的项目？",
          answer:
            "我更喜欢做那些有明确个性和记忆点的项目。对我来说，好的产品不是把功能机械拼起来，而是能让人一眼记住、愿意继续用下去。我会更容易被那种有方向感、有表达欲、同时又真的能落地的项目吸引。",
        },
        {
          label: "你常用哪些技术和工具？",
          answer:
            "我更习惯用全栈的方式去做产品，而不是只负责其中一个环节。前端、后端、数据库、AI 接入、部署上线这些部分我都能自己接起来，所以我可以把一个想法从 demo 一路推进到真正可用的版本。比起分得很细，我更擅长把整条链路做完整。",
        },
        {
          label: "你做产品时最在意什么？",
          answer:
            "我最在意的是一个产品最后能不能成立，而不是只停留在一个好看的想法上。成立意味着逻辑清楚、体验顺畅、细节可靠，也意味着它真的能被用户持续使用。对我来说，完成度和真实可用性比表面的热闹更重要。",
        },
        {
          label: "你想和什么样的人一起做事？",
          answer:
            "我喜欢和有创造力、有判断力、也有执行力的人一起做事。最好是那种愿意交流、也真的想把事情做成的人，而不是只按部就班地完成任务。像乔布斯说的“the crazy ones”，那种有灵魂、有想法的人会让我很有共鸣。",
        },
      ],
      facts: [
        "做 AI 产品、前端体验、后端能力和自动化流程的整合型开发。",
        "先抓核心体验，再搭系统骨架，最后把细节和质感一并补齐。",
        "我在意可用性、迭代速度、表达张力，以及产品上线后的真实存活能力。",
      ],
    },
    secondaryProjects: {
      "project-two.dev": {
        intro: "前台体验和后台逻辑同一个节奏推进。",
        description: "从界面系统到后端交付一体推进，强调完整产品感，而不是把功能零散拼接。",
        meta: "产品化 / UI / API",
      },
      "project-three.dev": {
        intro: "不是纯视觉实验，而是有明确功能目标的表达型作品。",
        description: "偏表达型的实验项目，但仍然保留明确功能，让视觉冲击和实际用途同时成立。",
        meta: "创意交互 / 动效 / 可用性",
      },
      "project-four.dev": {
        intro: "更偏系统侧的能力拼接，适合做复杂环境中的解决方案。",
        description: "把基础设施、边缘设备或网络环境相关能力组合起来，做成更偏系统层的项目。",
        meta: "系统实践 / 网络 / 硬件边缘",
      },
    },
    contactCopy: "如果你想找一个既能把东西做出来、又在意页面气质和产品感觉的人，我们可以聊聊。",
    modal: {
      proofTrigger: "查看上线证明",
      proofTriggerWithCount: (count) => `查看上线证明与用户反馈 (${count})`,
      proofHeading: "上线证明与用户反馈",
      proofNote: "补充证据放在这里，不占主预览位置。",
      previewAria: (title) => `播放 ${title ?? "项目演示视频"}`,
      previewPlay: "播放演示",
      previewPending: "视频待补充",
      previewTitle: "项目预览",
      previewVideoTitle: "项目演示视频",
      previewNote: "项目预览素材待补充。",
    },
  },
  en: {
    buttonLabel: "EN",
    buttonAria: "Switch to Chinese",
    htmlLang: "en",
    heroScroll: "Scroll Down",
    nameTranslations: [
      "Engineering",
      "AI Systems",
      "Full-Stack Build",
      "Experience Design",
      "System Delivery",
      "Continuous Iteration",
    ],
    assistant: {
      defaultAnswer:
        "I like projects with a clear identity and a real sense of memory. A good product, to me, is not a pile of features. It is something people remember immediately and want to keep using.",
      defaultStatus: "Ask something real.",
      emptyQuestion: "Enter a question about EIDDIE first, then I can answer it.",
      loadingAnswer: (question) => `Drafting a response about \"${question}\"...`,
      loadingStatus:
        "DeepSeek is generating an answer and will stay focused on EIDDIE, his background, skills, projects, and collaboration style.",
      followUpStatus: "Try another angle if you want. We can keep talking about projects, skills, or how I work.",
      requestError: "DeepSeek is unavailable right now. Reverted to the default answer.",
      placeholder: "For example: if we built an AI product together, where would you start first?",
      questions: [
        {
          label: "What kinds of projects do you most want to build?",
          answer:
            "I'm drawn to projects with a clear identity and a strong memory to them. I don't just want to stack features. I want to build things that people remember quickly and keep using. I'm especially interested in projects that have direction, personality, and real execution behind them.",
        },
        {
          label: "What tools and technologies do you use most?",
          answer:
            "I work in a full-stack way instead of owning only one slice of the product. I can connect frontend, backend, databases, AI integration, and deployment myself, which lets me take an idea from demo to something people can actually use. I'm strongest when I can carry the whole chain through.",
        },
        {
          label: "What matters most to you when building a product?",
          answer:
            "What matters most to me is whether a product truly holds up in the end, not whether it only starts as an attractive idea. That means the logic is clear, the experience is smooth, the details are reliable, and people can keep using it over time. Real usability and finish matter more to me than surface-level excitement.",
        },
        {
          label: "What kind of people do you want to work with?",
          answer:
            "I like working with people who have ideas, judgment, and real execution. Ideally they're willing to communicate and genuinely want to build something meaningful, not just complete a checklist. That crazy-ones energy still matters to me when I choose collaborators.",
        },
      ],
      facts: [
        "I build AI products across frontend experience, backend capability, and automation workflows as one connected system.",
        "I lock the core experience first, build the system frame next, then push detail and finish until the whole thing feels right.",
        "I care about usability, iteration speed, expressive tension, and whether a product can actually survive after launch.",
      ],
    },
    secondaryProjects: {
      "project-two.dev": {
        intro: "Interface quality and backend logic move forward in the same rhythm.",
        description: "A product built end to end, from interface system to backend delivery, with emphasis on coherence instead of stitching isolated features together.",
        meta: "Productization / UI / API",
      },
      "project-three.dev": {
        intro: "Not just a visual experiment, but an expressive build with a clear functional target.",
        description: "An expression-driven experimental project that still keeps a clear function, so visual impact and practical use can exist together.",
        meta: "Creative Interaction / Motion / Usability",
      },
      "project-four.dev": {
        intro: "A more systems-oriented build, suited to solving problems in complex environments.",
        description: "A systems-layer project that combines infrastructure, edge devices, or network-related capabilities into one solution.",
        meta: "Systems / Networking / Edge Hardware",
      },
    },
    contactCopy:
      "If you want someone who can actually ship the work and still care about interface quality and product feel, we should talk.",
    modal: {
      proofTrigger: "View launch proof",
      proofTriggerWithCount: (count) => `View launch proof and feedback (${count})`,
      proofHeading: "Launch Proof and User Feedback",
      proofNote: "Supporting evidence lives here without taking over the main preview.",
      previewAria: (title) => `Play ${title ?? "project demo video"}`,
      previewPlay: "Play Demo",
      previewPending: "Video Pending",
      previewTitle: "Project Preview",
      previewVideoTitle: "project demo video",
      previewNote: "Preview assets will be added here.",
    },
  },
};
const PROJECT_DETAILS = {
  edreading: {
    title: "EDReading",
    type: {
      zh: "AI阅读 / PWA应用 / 云端同步",
      en: "AI Reading / PWA App / Cloud Sync",
    },
    link: "https://www.eiddie.top",
    linkLabel: "www.eiddie.top",
    githubLink: "",
    githubLabel: "GitHub",
    githubNote: {
      zh: "比赛进行中，仓库暂不公开。",
      en: "The repository is private while the competition is ongoing.",
    },
    frontIntro: {
      zh: "AI 驱动的跨端英语外刊阅读与复习工具。",
      en: "An AI-powered cross-device tool for reading and reviewing English articles.",
    },
    description: {
      zh: "基于 Next.js、TypeScript、Supabase 和大模型接口开发的英语学习应用，支持外刊聚合、AI 精读分析、词典增强、PWA 安装与云端同步。核心目标是把阅读理解、表达积累和单词复习整合进同一个产品流程。项目已部署上线并获得真实用户使用反馈。",
      en: "An English learning product built with Next.js, TypeScript, Supabase, and large-model APIs. It combines article aggregation, AI close reading, dictionary enhancement, PWA installability, and cloud sync. The goal is to connect reading comprehension, language accumulation, and review into one product flow. It is already live with real user feedback.",
    },
    meta: {
      zh: "Next.js / TypeScript / Supabase / 大模型接口 / PWA / 云端同步",
      en: "Next.js / TypeScript / Supabase / LLM API / PWA / Cloud Sync",
    },
    signals: {
      zh: ["已部署上线", "真实用户反馈"],
      en: ["Live and deployed", "Real user feedback"],
    },
    cover: {
      profile: "logo-burst",
      logo: {
        asset: "/projects/edreading/edreading-logo-icon.png",
      },
      theme: {
        originX: "50%",
        originY: "43%",
        logoMuted: "rgba(199, 209, 212, 0.82)",
        logoActive: "#2cd8c9",
        logoGlow: "rgba(44, 216, 201, 0.34)",
        burstAccent: "#39e977",
        burstSoft: "rgba(247, 255, 252, 0.98)",
        dotMuted: "rgba(239, 246, 244, 0.12)",
        dotActive: "rgba(247, 255, 251, 0.38)",
        lineMuted: "rgba(154, 194, 191, 0.12)",
        rayLight: "rgba(255, 255, 255, 0.96)",
        rayInk: "rgba(6, 8, 11, 0.98)",
        panelTint: "rgba(176, 224, 216, 0.2)",
        borderActive: "rgba(121, 247, 217, 0.44)",
        shadowActive: "rgba(22, 118, 98, 0.42)",
      },
      impact: {
        text: "SYNC!",
        mode: "subtle",
      },
    },
    preview: {
      poster: "/projects/edreading/edreading-poster.png",
      videoSrc:
        "https://ediproject.oss-cn-shanghai.aliyuncs.com/%E6%BC%94%E7%A4%BA%E8%A7%86%E9%A2%91.mp4",
      videoType: "video/mp4",
      label: {
        zh: "真实项目预览",
        en: "Live project preview",
      },
      title: {
        zh: "点击播放完整功能演示",
        en: "Play the full product walkthrough",
      },
      note: {
        zh: "",
        en: "",
      },
      stats: [],
    },
    proofs: [
      {
        title: {
          zh: "用户小额打赏",
          en: "Small user tip",
        },
        description: {
          zh: "真实使用后的主动付费反馈，证明产品不只是展示稿。",
          en: "A voluntary payment from a real user, showing the product is more than a visual mockup.",
        },
        src: "/projects/edreading/proof-tip.jpg",
        alt: {
          zh: "EDReading 用户小额打赏证明截图",
          en: "Screenshot of an EDReading user tip as proof of real usage",
        },
      },
      {
        title: {
          zh: "后台使用痕迹",
          en: "Usage traces in the dashboard",
        },
        description: {
          zh: "后台截图用于证明产品已进入真实使用链路。",
          en: "Dashboard evidence showing the product has entered a real usage loop.",
        },
        src: "/projects/edreading/proof-dashboard.png",
        alt: {
          zh: "EDReading 用户后台证明截图",
          en: "Dashboard screenshot showing real EDReading usage",
        },
      },
    ],
  },
  futmap: {
    title: "Fut.Map",
    type: {
      zh: "足球数据 / 地图可视化 / 交互体验",
      en: "Football Data / Geo Viz / UX",
    },
    link: "https://fm.eiddie.top",
    linkLabel: "fm.eiddie.top",
    githubLink: "https://github.com/eiddiedev/Fut.Map",
    githubLabel: "GitHub / Fut.Map",
    frontIntro: {
      zh: "以 3D 地球和 2D 世界地图联动展示足球数据，打造更具沉浸感的探索体验。",
      en: "A football explorer linking a 3D globe and 2D map.",
    },
    description: {
      zh: "基于 Next.js、TypeScript、Three.js 和 Mapbox GL 构建，用 Framer Motion 做落地页转场，用 Three.js 与 Mapbox GL 实现 3D 地球和 2D 地图的联动展示，结合天地图底图与 Mapbox 渲染，兼顾国内场景下的地图合规性与交互表现。",
      en: "Built with Next.js, TypeScript, Three.js, and Mapbox GL, with Framer Motion driving the landing-page transitions. It links a 3D globe and a 2D world map to present football data, combining Tianditu basemaps with Mapbox rendering to balance map compliance in mainland use cases with strong interaction quality.",
    },
    meta: {
      zh: "Next.js / TypeScript / Three.js / Mapbox GL / Framer Motion / 天地图",
      en: "Next.js / TypeScript / Three.js / Mapbox GL / Framer Motion / Tianditu",
    },
    signals: {
      zh: ["3D 地球联动", "沉浸式探索"],
      en: ["3D globe sync", "Immersive exploration"],
    },
    cover: {
      profile: "football-ink",
      art: {
        asset: "/projects/futmap/futmap-cover-art.jpg",
      },
      logo: {
        asset: "/projects/futmap/futmap-logo-fut.png",
      },
      theme: {
        originX: "46%",
        originY: "28%",
        logoMuted: "rgba(244, 245, 239, 0.94)",
        logoActive: "rgba(247, 249, 245, 0.98)",
        logoGlow: "rgba(94, 229, 201, 0.16)",
        accent: "rgba(94, 229, 201, 0.82)",
        accentSoft: "rgba(94, 229, 201, 0.12)",
        inkSoft: "rgba(248, 248, 242, 0.16)",
        inkStrong: "rgba(247, 247, 241, 0.96)",
        lineSoft: "rgba(237, 237, 230, 0.18)",
        lineStrong: "rgba(10, 12, 16, 0.94)",
        netLine: "rgba(244, 244, 240, 0.18)",
        speedlineLight: "rgba(255, 255, 249, 0.82)",
        speedlineDark: "rgba(10, 12, 16, 0.94)",
        dotMuted: "rgba(244, 244, 238, 0.08)",
        dotActive: "rgba(248, 255, 252, 0.14)",
        borderActive: "rgba(244, 247, 241, 0.22)",
        shadowActive: "rgba(0, 0, 0, 0.46)",
      },
      impact: {
        text: "GOAL!",
        mode: "ink",
      },
    },
    preview: {
      label: {
        zh: "Fut.Map 项目预览待补充",
        en: "Fut.Map preview pending",
      },
      title: {
        zh: "演示视频待补充",
        en: "Demo video coming soon",
      },
      note: {
        zh: "当前先展示项目信息，演示视频后续补上。",
        en: "Project details are live first. The demo video will be added later.",
      },
      stats: [],
    },
    proofs: [],
  },
  scriptmind: {
    title: "ScriptMind",
    type: {
      zh: "字幕解析 / AI 学习 / 口语训练",
      en: "Subtitle Parsing / AI Learning / Speaking Practice",
    },
    link: "https://sm.eiddie.top",
    linkLabel: "sm.eiddie.top",
    githubLink: "https://github.com/eiddiedev/ScriptMind",
    githubLabel: "GitHub / ScriptMind",
    frontIntro: {
      zh: "把美剧字幕做成交互式英语学习，兼顾口语、剧情和跟读。",
      en: "Turns TV subtitles into interactive English study with speaking, story, and shadowing.",
    },
    description: {
      zh: "ScriptMind 是一个基于美剧字幕的英语学习 Web 应用，支持按季导入、按集学习和场景化练习。产品前端基于 Next.js 与 TypeScript 构建，后端采用 Postgres、pgvector 和 AI 解析流程，把原始字幕整理成可用于口语训练、剧情理解和表达学习的结构化内容。",
      en: "ScriptMind is a subtitle-based English learning web app built around season imports, episode study, and scene-based practice. The frontend uses Next.js and TypeScript, while the backend combines Postgres, pgvector, and an AI parsing pipeline to turn raw subtitles into structured material for speaking drills, story comprehension, and expression learning.",
    },
    meta: {
      zh: "Next.js / TypeScript / Postgres / pgvector / AI 字幕解析 / 场景化学习",
      en: "Next.js / TypeScript / Postgres / pgvector / AI Subtitle Parsing / Scene-Based Learning",
    },
    signals: {
      zh: ["按季导入", "按集学习", "场景化练习"],
      en: ["Season imports", "Episode study", "Scene-based practice"],
    },
    cover: {
      profile: "scriptmind-wave",
      art: {
        asset: "/projects/scriptmind/scriptmind-cover.jpeg",
      },
      logo: {
        asset: "/projects/scriptmind/scriptmind-logo.png",
      },
      theme: {
        originX: "32%",
        originY: "46%",
        logoMuted: "rgba(244, 245, 247, 0.94)",
        logoActive: "#ff8a3d",
        logoGlow: "rgba(114, 228, 255, 0.3)",
        burstAccent: "#ff8a3d",
        burstSoft: "rgba(214, 247, 255, 0.98)",
        dotMuted: "rgba(201, 229, 255, 0.12)",
        dotActive: "rgba(239, 248, 255, 0.34)",
        lineMuted: "rgba(173, 214, 255, 0.16)",
        rayLight: "rgba(231, 248, 255, 0.96)",
        rayInk: "rgba(10, 25, 74, 0.94)",
        panelTint: "rgba(112, 201, 255, 0.16)",
        borderActive: "rgba(255, 154, 90, 0.4)",
        shadowActive: "rgba(25, 91, 214, 0.34)",
      },
      impact: {
        text: "SPEAK!",
        mode: "subtle",
      },
    },
    preview: {
      poster: "/projects/scriptmind/scriptmind-cover.jpeg",
      label: {
        zh: "ScriptMind 项目预览待补充",
        en: "ScriptMind preview pending",
      },
      title: {
        zh: "演示视频待补充",
        en: "Demo video coming soon",
      },
      note: {
        zh: "当前先展示项目视觉与信息，演示视频后续补上。",
        en: "The card and project details are live first. A demo video will be added later.",
      },
      stats: [],
    },
    proofs: [],
  },
  bugpet: {
    title: "BugPet",
    type: {
      zh: "AI开发 / 桌面陪伴 / 宠物养成",
      en: "AI Coding / Desktop Companion / Pet Growth",
    },
    link: "",
    linkLabel: "",
    githubLink: "https://github.com/eiddiedev/BugPet",
    githubLabel: "GitHub / BugPet",
    frontIntro: {
      zh: "一个会感知专注状态、陪你把 vibe coding 持续推进下去的桌面宠物应用。",
      en: "A desktop pet that senses your focus rhythm and keeps you company through vibe coding sessions.",
    },
    description: {
      zh: "BugPet 是一款基于 Tauri、React 和 TypeScript 开发的轻量级桌面宠物应用，但它不是传统意义上的挂机摆件，而是面向 AI coding workflow 设计的陪伴型工具。它会结合开发状态变化与角色化反馈，在 Codex、Claude Code 等场景里提供更自然的专注提醒、陪伴感和沉浸节奏，并把你的效率成长与长期使用过程转化成一只会一起进化的桌面宠物。",
      en: "BugPet is a lightweight desktop pet built with Tauri, React, and TypeScript, but it is designed as a companion for AI coding workflows rather than a passive novelty app. It responds to shifts in your working state with character-driven feedback, adding focus cues, companionship, and a steadier sense of rhythm in Codex, Claude Code, and similar environments while turning your long-term progress into a pet that grows with you.",
    },
    meta: {
      zh: "Tauri / React / TypeScript / 桌面宠物 / AI Coding Workflow / 状态反馈",
      en: "Tauri / React / TypeScript / Desktop Pet / AI Coding Workflow / State Feedback",
    },
    signals: {
      zh: ["专注感知", "桌面陪伴", "成长反馈"],
      en: ["Focus sensing", "Desktop companion", "Growth feedback"],
    },
    cover: {
      profile: "bugpet-pixel",
      art: {
        asset: "/projects/bugpet/bugpet-cover.jpg",
      },
      logo: {
        asset: "/projects/bugpet/bugpet-logo.png",
      },
      theme: {
        originX: "50%",
        originY: "34%",
        logoMuted: "rgba(228, 225, 221, 0.9)",
        logoActive: "rgba(255, 202, 129, 0.98)",
        logoGlow: "rgba(255, 185, 107, 0.28)",
        burstAccent: "rgba(124, 110, 255, 0.9)",
        burstSoft: "rgba(238, 225, 255, 0.92)",
        dotMuted: "rgba(232, 231, 250, 0.14)",
        dotActive: "rgba(244, 241, 255, 0.32)",
        lineMuted: "rgba(149, 161, 255, 0.14)",
        rayLight: "rgba(243, 238, 255, 0.88)",
        rayInk: "rgba(18, 20, 34, 0.94)",
        panelTint: "rgba(123, 113, 204, 0.18)",
        borderActive: "rgba(255, 205, 145, 0.24)",
        shadowActive: "rgba(71, 59, 138, 0.36)",
        accent: "rgba(255, 188, 112, 0.88)",
        accentSoft: "rgba(255, 188, 112, 0.12)",
      },
      impact: {
        text: {
          zh: "PAWS!",
          en: "PAWS!",
        },
        mode: "subtle",
      },
    },
    preview: {
      poster: "/projects/bugpet/bugpet-cover.jpg",
      label: {
        zh: "BugPet 项目预览待补充",
        en: "BugPet preview pending",
      },
      title: {
        zh: "演示视频待补充",
        en: "Demo video coming soon",
      },
      note: {
        zh: "当前先展示项目视觉和产品定位，演示视频后续补上。",
        en: "The project visual and product framing are live first. A demo video will be added later.",
      },
      stats: [],
    },
    proofs: [],
  },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const easeOutCubic = (value) => 1 - (1 - value) ** 3;
const easeInCubic = (value) => value ** 3;
const easeInOutQuad = (value) =>
  value < 0.5 ? 2 * value * value : 1 - ((-2 * value + 2) ** 2) / 2;
const isLocalizedValue = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value) && "zh" in value && "en" in value;

const getStoredLanguage = () => {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === "en" ? "en" : stored === "zh" ? "zh" : null;
  } catch {
    return null;
  }
};

const storeLanguage = (language) => {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // ignore storage failures
  }
};

const getCopy = () => LANGUAGE_COPY[currentLanguage];
const getAssistantCopy = () => getCopy().assistant;
const getModalCopy = () => getCopy().modal;

const localizeValue = (value) => {
  if (isLocalizedValue(value)) return value[currentLanguage] ?? value.zh;
  return value;
};

const localizeProjectDetail = (detail) => {
  if (!detail) return null;

  return {
    ...detail,
    title: localizeValue(detail.title),
    type: localizeValue(detail.type),
    frontIntro: localizeValue(detail.frontIntro),
    description: localizeValue(detail.description),
    meta: localizeValue(detail.meta),
    githubNote: localizeValue(detail.githubNote),
    signals: localizeValue(detail.signals) ?? [],
    cover: detail.cover
      ? {
          ...detail.cover,
          logo: detail.cover.logo ? { ...detail.cover.logo } : null,
          impact: detail.cover.impact
            ? {
                ...detail.cover.impact,
                text: localizeValue(detail.cover.impact.text),
              }
            : null,
        }
      : null,
    preview: detail.preview
      ? {
          ...detail.preview,
          label: localizeValue(detail.preview.label),
          title: localizeValue(detail.preview.title),
          note: localizeValue(detail.preview.note),
        }
      : null,
    proofs: Array.isArray(detail.proofs)
      ? detail.proofs.map((proof) => ({
          ...proof,
          title: localizeValue(proof.title),
          description: localizeValue(proof.description),
          alt: localizeValue(proof.alt),
        }))
      : [],
  };
};

const getAssistantStatusKey = (value) => {
  if (!value) return null;

  const statusKeys = ["defaultStatus", "emptyQuestion", "loadingStatus", "followUpStatus", "requestError"];
  for (const language of ["zh", "en"]) {
    for (const key of statusKeys) {
      if (LANGUAGE_COPY[language].assistant[key] === value) {
        return key;
      }
    }
  }

  return null;
};

const applyStaticLanguage = () => {
  const copy = getCopy();

  document.documentElement.lang = copy.htmlLang;

  if (languageToggle) {
    languageToggle.textContent = copy.buttonLabel;
    languageToggle.setAttribute("aria-label", copy.buttonAria);
  }

  if (heroScrollLabel) {
    heroScrollLabel.textContent = copy.heroScroll;
  }

  nameTranslationNodes.forEach((node, index) => {
    const nextText = copy.nameTranslations[index];
    if (nextText) node.textContent = nextText;
    if (nameLetterOverlayNodes[index]) {
      nameLetterOverlayNodes[index].textContent = nextText ?? "";
    }
  });

  if (contactCopy) {
    contactCopy.textContent = copy.contactCopy;
  }

  if (modalProofHeading) {
    modalProofHeading.textContent = copy.modal.proofHeading;
  }

  if (modalProofNote) {
    modalProofNote.textContent = copy.modal.proofNote;
  }
};

const dismissSiteLoader = () => {
  if (!(siteLoader instanceof HTMLElement) || siteLoader.dataset.dismissed === "true") return;

  siteLoader.dataset.dismissed = "true";
  document.body.classList.remove("is-site-loading");
  siteLoader.classList.add("is-loaded");

  window.setTimeout(() => {
    siteLoader.hidden = true;
  }, 620);
};

const applyAssistantLanguage = () => {
  const assistantCopy = getAssistantCopy();
  const activeChip = [...questionChips].find((chip) => chip.classList.contains("is-active"));
  const currentAnswer = answerBox?.textContent?.trim() ?? "";
  const currentStatus = askStatus?.textContent?.trim() ?? "";

  questionChips.forEach((chip, index) => {
    const question = assistantCopy.questions[index];
    if (!question) return;
    chip.textContent = question.label;
    chip.dataset.answer = question.answer;
  });

  if (askInput) {
    askInput.placeholder = assistantCopy.placeholder;
  }

  aboutFactBodies.forEach((node, index) => {
    const nextText = assistantCopy.facts[index];
    if (nextText) node.textContent = nextText;
  });

  if (answerBox) {
    if (answerBox.classList.contains("is-loading") && pendingAssistantQuestion) {
      answerBox.textContent = assistantCopy.loadingAnswer(pendingAssistantQuestion);
    } else if (activeChip?.dataset.answer) {
      answerBox.textContent = activeChip.dataset.answer;
    } else if (
      !currentAnswer ||
      currentAnswer === LANGUAGE_COPY.zh.assistant.defaultAnswer ||
      currentAnswer === LANGUAGE_COPY.en.assistant.defaultAnswer
    ) {
      answerBox.textContent = assistantCopy.defaultAnswer;
    }
  }

  if (askStatus) {
    const statusKey = getAssistantStatusKey(currentStatus);
    askStatus.textContent = statusKey ? assistantCopy[statusKey] : assistantCopy.defaultStatus;
  }
};

const applySecondaryProjectLanguage = () => {
  const projectCopy = getCopy().secondaryProjects;

  projectButtons.forEach((button) => {
    const detail = projectCopy[button.dataset.domain ?? ""];
    if (!detail) return;

    button.dataset.description = detail.description;
    button.dataset.meta = detail.meta;

    const intro = button.querySelector("p");
    if (intro) intro.textContent = detail.intro;
  });
};

const applyLanguage = (language, { persist = true } = {}) => {
  currentLanguage = language === "en" ? "en" : "zh";
  if (persist) {
    storeLanguage(currentLanguage);
  }

  applyStaticLanguage();
  applyAssistantLanguage();
  applySecondaryProjectLanguage();
  hydrateProjectCards();

  if (activeProjectButton) {
    activeProjectData = getProjectDetail(activeProjectButton);
    populateModalContent(activeProjectData);
    const currentModalCard = modalFront?.querySelector(".project-card__button");
    syncModalCardScene(activeProjectButton, {
      scene: currentModalCard?.classList.contains("is-active-scene") ? "active" : "idle",
    });
  }
};

const setupHeroPeelPath = () => {
  if (!heroPeel || !heroPeelElement) return;

  heroPeel.setupDimensions();

  const width = heroPeelElement.offsetWidth;
  const height = heroPeelElement.offsetHeight;

  heroPeel.setPeelPath(
    width,
    height,
    width * 0.992,
    height * 0.972,
    width * 0.62,
    height * 0.28,
    width * -0.22,
    height * -0.26,
  );

  heroPeel.setTimeAlongPath(heroPeelTime);
};

const setupHeroPeel = () => {
  if (!heroPeelElement || typeof window.Peel !== "function" || heroPeel) return;

  heroPeel = new window.Peel(heroPeelElement, {
    corner: window.Peel.Corners.BOTTOM_RIGHT,
    setPeelOnInit: false,
    topShadowBlur: 8,
    topShadowAlpha: 0.22,
    topShadowOffsetX: 1,
    topShadowOffsetY: 2,
    backReflection: false,
    backShadowAlpha: 0.16,
    backShadowSize: 0.04,
    bottomShadowDarkAlpha: 0.22,
    bottomShadowLightAlpha: 0.06,
  });

  heroPeel.setFadeThreshold(1.01);
  setupHeroPeelPath();
  heroPeel.setTimeAlongPath(0);
};

const normalizeProjectUrl = (value) => {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const getProjectDetail = (button) => {
  const projectId = button.dataset.projectId;
  const projectDetail = projectId ? PROJECT_DETAILS[projectId] : null;

  if (projectDetail) return localizeProjectDetail(projectDetail);

  const title =
    button.dataset.title ??
    button.querySelector("strong")?.textContent?.trim() ??
    "Project";
  const type =
    button.dataset.type ??
    button.querySelector(".project-card__type")?.textContent?.trim() ??
    "Project Type";
  const frontIntro = button.querySelector("p")?.textContent?.trim() ?? "";
  const linkLabel = button.dataset.domain ?? "";

  return {
    title,
    type,
    link: normalizeProjectUrl(linkLabel),
    linkLabel,
    frontIntro,
    description: button.dataset.description ?? frontIntro,
    meta: button.dataset.meta ?? "",
    signals: [],
    preview: null,
    proofs: [],
  };
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const sanitizeClassToken = (value = "") => String(value).replace(/[^a-z0-9_-]/gi, "");

const getProjectCardIndexLabel = (button) =>
  button.dataset.projectIndex ??
  button.querySelector(".project-card__index")?.textContent?.trim() ??
  "";

const applyProjectCoverTheme = (button, cover) => {
  const theme = cover?.theme ?? {};
  const styleEntries = [
    ["--cover-logo-asset", cover?.logo?.asset ? `url("${cover.logo.asset}")` : ""],
    ["--cover-art-asset", cover?.art?.asset ? `url("${cover.art.asset}")` : ""],
    ["--cover-origin-x", theme.originX],
    ["--cover-origin-y", theme.originY],
    ["--cover-logo-muted", theme.logoMuted],
    ["--cover-logo-active", theme.logoActive],
    ["--cover-logo-glow", theme.logoGlow],
    ["--cover-burst-accent", theme.burstAccent],
    ["--cover-burst-soft", theme.burstSoft],
    ["--cover-dot-muted", theme.dotMuted],
    ["--cover-dot-active", theme.dotActive],
    ["--cover-line-muted", theme.lineMuted],
    ["--cover-ray-light", theme.rayLight],
    ["--cover-ray-ink", theme.rayInk],
    ["--cover-panel-tint", theme.panelTint],
    ["--cover-accent", theme.accent],
    ["--cover-accent-soft", theme.accentSoft],
    ["--cover-ink-soft", theme.inkSoft],
    ["--cover-ink-strong", theme.inkStrong],
    ["--cover-line-soft", theme.lineSoft],
    ["--cover-line-strong", theme.lineStrong],
    ["--cover-net-line", theme.netLine],
    ["--cover-speedline-light", theme.speedlineLight],
    ["--cover-speedline-dark", theme.speedlineDark],
    ["--cover-border-active", theme.borderActive],
    ["--cover-shadow-active", theme.shadowActive],
  ];

  styleEntries.forEach(([property, value]) => {
    if (value) {
      button.style.setProperty(property, value);
    } else {
      button.style.removeProperty(property);
    }
  });
};

const buildLogoBurstCardMarkup = ({ indexLabel, detail, cover }) => {
  const impactText = cover?.impact?.text ?? "";
  const impactMode = sanitizeClassToken(cover?.impact?.mode);
  const impactClass = impactMode ? ` project-card__impact--${impactMode}` : "";

  return `
    <span class="project-card__cover" aria-hidden="true">
      <span class="project-card__cover-panel"></span>
      <span class="project-card__cover-burst"></span>
      <span class="project-card__cover-dots"></span>
      <span class="project-card__cover-rays"></span>
      <span class="project-card__cover-bubble"></span>
      <span class="project-card__cover-fragments"></span>
      <span class="project-card__logo">
        <span class="project-card__logo-mark"></span>
      </span>
    </span>
    <span class="project-card__impact${impactClass}" aria-hidden="true">${escapeHtml(impactText)}</span>
    <span class="project-card__copy">
      <span class="project-card__index">${escapeHtml(indexLabel)}</span>
      <strong>${escapeHtml(detail.title)}</strong>
      <span class="project-card__type">${escapeHtml(detail.type)}</span>
      <p>${escapeHtml(detail.frontIntro)}</p>
    </span>
  `;
};

const buildFootballInkCardMarkup = ({ indexLabel, detail, cover }) => {
  const impactText = cover?.impact?.text ?? "";
  const impactMode = sanitizeClassToken(cover?.impact?.mode);
  const impactClass = impactMode ? ` project-card__impact--${impactMode}` : "";

  return `
    <span class="project-card__cover" aria-hidden="true">
      <span class="project-card__cover-panel"></span>
      <span class="project-card__cover-dots"></span>
      <span class="project-card__cover-rays"></span>
      <span class="project-card__cover-goal"></span>
      <span class="project-card__cover-net"></span>
      <span class="project-card__cover-burst"></span>
      <span class="project-card__cover-shot"></span>
      <span class="project-card__cover-ball"></span>
      <span class="project-card__cover-fragments"></span>
      <span class="project-card__logo">
        <span class="project-card__logo-mark"></span>
      </span>
    </span>
    <span class="project-card__impact${impactClass}" aria-hidden="true">${escapeHtml(impactText)}</span>
    <span class="project-card__copy">
      <span class="project-card__index">${escapeHtml(indexLabel)}</span>
      <strong>${escapeHtml(detail.title)}</strong>
      <span class="project-card__type">${escapeHtml(detail.type)}</span>
      <p>${escapeHtml(detail.frontIntro)}</p>
    </span>
  `;
};

const resetProjectCardVariants = (button) => {
  button.classList.remove(
    "project-card__button--pow",
    "project-card__button--bang",
    "project-card__button--crash",
    "project-card__button--wham",
    "project-card__button--logo-burst",
    "project-card__button--bugpet-pixel",
    "project-card__button--football-ink",
    "project-card__button--scriptmind-wave",
  );
};

const renderProjectCardCover = (button, localizedDetail) => {
  const cover = localizedDetail.cover;
  if (!cover?.profile) return false;

  if (cover.profile === "logo-burst") {
    const indexLabel = getProjectCardIndexLabel(button);
    resetProjectCardVariants(button);
    button.classList.add("project-card__button--logo-burst");
    button.dataset.coverProfile = cover.profile;
    applyProjectCoverTheme(button, cover);
    button.innerHTML = buildLogoBurstCardMarkup({ indexLabel, detail: localizedDetail, cover });
    return true;
  }

  if (cover.profile === "football-ink") {
    const indexLabel = getProjectCardIndexLabel(button);
    resetProjectCardVariants(button);
    button.classList.add("project-card__button--football-ink");
    button.dataset.coverProfile = cover.profile;
    applyProjectCoverTheme(button, cover);
    button.innerHTML = buildFootballInkCardMarkup({ indexLabel, detail: localizedDetail, cover });
    return true;
  }

  if (cover.profile === "scriptmind-wave") {
    const indexLabel = getProjectCardIndexLabel(button);
    resetProjectCardVariants(button);
    button.classList.add("project-card__button--logo-burst", "project-card__button--scriptmind-wave");
    button.dataset.coverProfile = cover.profile;
    applyProjectCoverTheme(button, cover);
    button.innerHTML = buildLogoBurstCardMarkup({ indexLabel, detail: localizedDetail, cover });
    return true;
  }

  if (cover.profile === "bugpet-pixel") {
    const indexLabel = getProjectCardIndexLabel(button);
    resetProjectCardVariants(button);
    button.classList.add("project-card__button--logo-burst", "project-card__button--bugpet-pixel");
    button.dataset.coverProfile = cover.profile;
    applyProjectCoverTheme(button, cover);
    button.innerHTML = buildLogoBurstCardMarkup({ indexLabel, detail: localizedDetail, cover });
    return true;
  }

  return false;
};

const hydrateProjectCards = () => {
  projectButtons.forEach((button) => {
    const projectId = button.dataset.projectId;
    const projectDetail = projectId ? PROJECT_DETAILS[projectId] : null;
    if (!projectDetail) return;

    const localizedDetail = localizeProjectDetail(projectDetail);

    if (renderProjectCardCover(button, localizedDetail)) {
      button.setAttribute(
        "aria-label",
        currentLanguage === "zh"
          ? `${localizedDetail.title}，${localizedDetail.type}`
          : `${localizedDetail.title}, ${localizedDetail.type}`,
      );
      return;
    }

    const title = button.querySelector("strong");
    const type = button.querySelector(".project-card__type");
    const intro = button.querySelector("p");

    if (title) title.textContent = localizedDetail.title;
    if (type) type.textContent = localizedDetail.type;
    if (intro) intro.textContent = localizedDetail.frontIntro;
    button.setAttribute(
      "aria-label",
      currentLanguage === "zh"
        ? `${localizedDetail.title}，${localizedDetail.type}`
        : `${localizedDetail.title}, ${localizedDetail.type}`,
    );
  });
};

const getToolBadgeNumber = (badge) => {
  const badgeClass = [...badge.classList].find((className) => /^tool-badge--\d+$/.test(className));
  return badgeClass ? Number.parseInt(badgeClass.replace("tool-badge--", ""), 10) : null;
};

const initializeSkillBadges = () => {
  if (skillBadges.length === 0) return;

  const badgeOrder = new Map(SKILL_BADGE_SEQUENCE.map((badgeNumber, index) => [badgeNumber, index]));

  skillBadges.forEach((badge, fallbackIndex) => {
    const badgeNumber = getToolBadgeNumber(badge) ?? fallbackIndex + 1;
    const order = badgeOrder.get(badgeNumber) ?? fallbackIndex;
    const angle = (order / Math.max(skillBadges.length, 1)) * Math.PI * 2 - Math.PI * 0.56;
    const enterRadius = 14 + (order % 4) * 3.2;
    const driftRadius = 3.4 + (order % 3) * 1.45;
    const enterX = Math.cos(angle) * enterRadius;
    const enterY = Math.sin(angle) * enterRadius + 18;
    const enterRotate = ((order % 2 === 0 ? -1 : 1) * (4 + (order % 4) * 1.2));
    const driftX = Math.cos(angle + Math.PI / 3) * driftRadius;
    const driftY = -5.4 - (order % 4) * 1.15;
    const driftRotate = ((badgeNumber % 2 === 0 ? 1 : -1) * (0.38 + (order % 3) * 0.12));
    const driftScale = 0.009 + (order % 4) * 0.002;
    const floatDuration = 8.6 + (order % 5) * 0.8;
    const floatDelay = order * -0.53;

    badge.style.setProperty("--badge-order", String(order));
    badge.style.setProperty("--badge-enter-x", `${enterX.toFixed(2)}px`);
    badge.style.setProperty("--badge-enter-y", `${enterY.toFixed(2)}px`);
    badge.style.setProperty("--badge-enter-rotate", `${enterRotate.toFixed(2)}deg`);
    badge.style.setProperty("--badge-drift-x", `${driftX.toFixed(2)}px`);
    badge.style.setProperty("--badge-drift-y", `${driftY.toFixed(2)}px`);
    badge.style.setProperty("--badge-drift-rotate", `${driftRotate.toFixed(2)}deg`);
    badge.style.setProperty("--badge-drift-scale", driftScale.toFixed(4));
    badge.style.setProperty("--badge-float-duration", `${floatDuration.toFixed(2)}s`);
    badge.style.setProperty("--badge-float-delay", `${floatDelay.toFixed(2)}s`);
    badge.style.setProperty("--badge-pop", "0");
    badge.style.setProperty("--badge-float", "0");
    badge.style.setProperty("--badge-burst-y", "0px");
    badge.style.setProperty("--badge-burst-scale", "0");
    badge.style.setProperty("--badge-burst-rotate", "0deg");
  });
};

const setTopbarMenuState = (isOpen) => {
  if (!topbar || !topbarToggle) return;
  topbar.classList.toggle("is-open", isOpen);
  topbarToggle.setAttribute("aria-expanded", String(isOpen));
};

const trimContactIconBackground = () => {
  if (!(contactIcon instanceof HTMLImageElement) || contactIcon.dataset.trimmed === "true") return;

  const applyTrim = () => {
    if (!contactIcon.naturalWidth || !contactIcon.naturalHeight) return;

    const canvas = document.createElement("canvas");
    canvas.width = contactIcon.naturalWidth;
    canvas.height = contactIcon.naturalHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    context.drawImage(contactIcon, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;

    for (let index = 0; index < data.length; index += 4) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const brightness = (red + green + blue) / 3;
      const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);

      if (brightness > 247 && saturation < 22) {
        data[index + 3] = 0;
      } else if (brightness > 232 && saturation < 38) {
        const softness = (247 - brightness) / 15;
        data[index + 3] = Math.min(data[index + 3], Math.round(Math.max(softness, 0) * 255));
      }
    }

    context.putImageData(imageData, 0, 0);
    contactIcon.dataset.trimmed = "true";
    contactIcon.src = canvas.toDataURL("image/png");
  };

  if (contactIcon.complete) {
    applyTrim();
  } else {
    contactIcon.addEventListener("load", applyTrim, { once: true });
  }
};

const fallbackCopyText = (value) => {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  textarea.style.inset = "0 auto auto 0";
  document.body.append(textarea);
  textarea.select();

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } catch (_error) {
    copied = false;
  }

  textarea.remove();
  return copied;
};

const copyTextToClipboard = async (value) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (_error) {
      return fallbackCopyText(value);
    }
  }

  return fallbackCopyText(value);
};

const setCopyFeedbackState = (button, state) => {
  button.classList.remove("is-copied", "is-copy-failed");

  const existingTimer = copyFeedbackTimers.get(button);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
  }

  if (!state) return;

  button.classList.add(state);
  button.dataset.copyStatus = "COPIED";

  const resetTimer = window.setTimeout(() => {
    button.classList.remove("is-copied", "is-copy-failed");
    button.dataset.copyStatus = "COPIED";
    copyFeedbackTimers.delete(button);
  }, 1400);

  copyFeedbackTimers.set(button, resetTimer);
};

const initializeContactCopyButtons = () => {
  copyContactButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const copyValue = button.dataset.copyValue?.trim();
      if (!copyValue) return;

      const copied = await copyTextToClipboard(copyValue);
      setCopyFeedbackState(button, copied ? "is-copied" : "is-copy-failed");
    });
  });
};

const updateHeroProgress = () => {
  if (!heroSection) return;

  const rect = heroSection.getBoundingClientRect();
  const scrollable = rect.height - window.innerHeight;
  const progress = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;
  const liftProgress = easeOutCubic(clamp((progress - 0.018) / 0.18, 0, 1));
  const peelIntro = easeOutCubic(clamp(progress / 0.06, 0, 1));
  const peelBuild = easeInOutQuad(clamp(progress / 0.58, 0, 1));
  const travelProgress = easeInOutQuad(clamp((progress - 0.6) / 0.34, 0, 1));
  const peelProgress = Math.min(0.998, 0.03 * peelIntro + 0.968 * peelBuild);

  document.body.classList.toggle("is-hero-active", progress < 0.92);
  root.style.setProperty("--hero-progress", progress.toFixed(3));
  root.style.setProperty("--hero-lift-progress", liftProgress.toFixed(3));
  root.style.setProperty("--hero-detach-progress", travelProgress.toFixed(3));
  root.style.setProperty("--hero-lift-x", `${liftProgress * -18}px`);
  root.style.setProperty("--hero-lift-y", `${liftProgress * -26}px`);
  root.style.setProperty("--hero-lift-rotate", `${liftProgress * -4.2}deg`);
  root.style.setProperty("--hero-tilt-x", `${travelProgress * 8}deg`);
  root.style.setProperty("--hero-tilt-y", `${travelProgress * -18}deg`);
  root.style.setProperty("--hero-residue-opacity", `${Math.max(travelProgress * 0.78, liftProgress * 0.08)}`);
  root.style.setProperty("--hero-residue-size", `${28 + travelProgress * 168}px`);
  root.style.setProperty("--hero-shadow-opacity", `${0.42 + liftProgress * 0.18 + travelProgress * 0.11}`);
  root.style.setProperty("--hero-shift-x", `${travelProgress * window.innerWidth * -0.82}px`);
  root.style.setProperty("--hero-shift-y", `${travelProgress * window.innerHeight * -0.96}px`);
  root.style.setProperty("--hero-rotate", `${travelProgress * -20}deg`);
  root.style.setProperty("--hero-scale", `${1 + liftProgress * 0.012 - travelProgress * 0.098}`);

  if (heroPeel) {
    heroPeelTime = peelProgress;
    heroPeel.setTimeAlongPath(peelProgress);
  }
};

const updateNameProgress = () => {
  if (!nameSection || nameRows.length === 0) return;

  const rect = nameSection.getBoundingClientRect();
  const total = rect.height - window.innerHeight * 0.45;
  const progress = total > 0 ? clamp((window.innerHeight * 0.2 - rect.top) / total, 0, 1) : 0;

  nameRows.forEach((row, index) => {
    const start = index * 0.12;
    const end = start + 0.26;
    const rowProgress = clamp((progress - start) / (end - start), 0, 1);
    row.style.setProperty("--row-progress", rowProgress.toFixed(3));
  });
};

const updateProjectsProgress = () => {
  if (!projectsSection || !projectGrid || projectCards.length === 0) return;

  const rect = projectGrid.getBoundingClientRect();
  const start = window.innerHeight * 0.92;
  const end = window.innerHeight * 0.24;
  const distance = start - end;
  const sectionProgress = distance > 0 ? clamp((start - rect.top) / distance, 0, 1) : 0;
  const cardFlow = clamp((sectionProgress - 0.05) / 0.82, 0, 1);
  const titleEnter = easeOutCubic(clamp((sectionProgress - 0.02) / 0.17, 0, 1));
  const titleHoldEnd = 0.82;
  const titleExitWindow = 0.1;
  const titleExit = easeOutCubic(clamp((sectionProgress - titleHoldEnd) / titleExitWindow, 0, 1));

  projectsSection.style.setProperty("--projects-progress", sectionProgress.toFixed(3));
  projectsSection.style.setProperty("--projects-title-enter", titleEnter.toFixed(3));
  projectsSection.style.setProperty("--projects-title-exit", titleExit.toFixed(3));

  projectCards.forEach((card, index) => {
    const cardStart = 0.14 + index * 0.06;
    const cardEnd = 0.62 + index * 0.075;
    const cardRaw = clamp((cardFlow - cardStart) / (cardEnd - cardStart), 0, 1);
    const cardProgress = easeInOutQuad(cardRaw);
    card.style.setProperty("--project-pop", cardProgress.toFixed(3));
  });
};

const updateIssueFiveSixTransition = () => {
  if (!projectsSection || !contactSection) return;

  const contactRect = contactSection.getBoundingClientRect();
  const start = window.innerHeight * 0.9;
  const end = window.innerHeight * 0.18;
  const distance = start - end;
  const progress = distance > 0 ? clamp((start - contactRect.top) / distance, 0, 1) : 0;

  root.style.setProperty("--issue-56-progress", progress.toFixed(3));
};

const updateSkillsTransition = () => {
  if (!skillsSection) return;

  const rect = skillsSection.getBoundingClientRect();
  const isPhoneViewport = window.innerWidth <= 560;
  const start = window.innerHeight * 0.99;
  const end = window.innerHeight * -0.12;
  const distance = start - end;
  const progress = distance > 0 ? clamp((start - rect.top) / distance, 0, 1) : 0;

  const titleRaw = clamp((progress - 0.14) / 0.22, 0, 1);
  const webRaw = clamp((progress - (isPhoneViewport ? 0.54 : 0.64)) / (isPhoneViewport ? 0.24 : 0.2), 0, 1);
  const webDensityRaw = clamp(
    (progress - (isPhoneViewport ? 0.62 : 0.74)) / (isPhoneViewport ? 0.18 : 0.14),
    0,
    1,
  );
  const iconsRaw = clamp((progress - (isPhoneViewport ? 0.7 : 0.9)) / (isPhoneViewport ? 0.22 : 0.16), 0, 1);
  const aboutExitRaw = clamp((progress - 0.28) / 0.46, 0, 1);

  const titleProgress = easeInOutQuad(titleRaw);
  const webProgress = easeInOutQuad(webRaw);
  const webDensityProgress = easeInOutQuad(webDensityRaw);
  const iconsProgress = easeInOutQuad(iconsRaw);
  const aboutExitProgress = easeInOutQuad(aboutExitRaw);

  skillsSection.style.setProperty("--skills-progress", progress.toFixed(3));
  skillsSection.style.setProperty("--skills-title-progress", titleProgress.toFixed(3));
  skillsSection.style.setProperty("--skills-web-progress", webProgress.toFixed(3));
  skillsSection.style.setProperty("--skills-web-density-progress", webDensityProgress.toFixed(3));
  skillsSection.style.setProperty("--skills-icons-progress", iconsProgress.toFixed(3));

  if (aboutSection) {
    aboutSection.style.setProperty("--about-exit-progress", aboutExitProgress.toFixed(3));
  }

  skillBadges.forEach((badge) => {
    const order = Number.parseFloat(badge.style.getPropertyValue("--badge-order")) || 0;
    const normalizedOrder = skillBadges.length > 1 ? order / (skillBadges.length - 1) : 0;
    const badgeSpread = isPhoneViewport ? 0.46 : 0.68;
    const badgeWindow = isPhoneViewport ? 0.42 : 0.32;
    const badgeStart = normalizedOrder * badgeSpread;
    const badgeEnd = Math.min(badgeStart + badgeWindow, 1);
    const badgeRaw = clamp((iconsProgress - badgeStart) / (badgeEnd - badgeStart), 0, 1);
    const badgePop = easeOutCubic(clamp((badgeRaw - 0.06) / 0.84, 0, 1));
    const badgeFloat = easeInOutQuad(clamp((badgeRaw - 0.82) / 0.18, 0, 1));
    const burstEnvelope = Math.sin(badgeRaw * Math.PI);
    const burstLift = burstEnvelope * (1 - badgeRaw * 0.22) * (isPhoneViewport ? 10 : 18);
    const burstScale = burstEnvelope * (isPhoneViewport ? 0.04 : 0.07);
    const burstRotate = burstEnvelope * (order % 2 === 0 ? -1 : 1) * 1.35;

    badge.style.setProperty("--badge-pop", badgePop.toFixed(3));
    badge.style.setProperty("--badge-float", badgeFloat.toFixed(3));
    badge.style.setProperty("--badge-burst-y", `${burstLift.toFixed(2)}px`);
    badge.style.setProperty("--badge-burst-scale", burstScale.toFixed(4));
    badge.style.setProperty("--badge-burst-rotate", `${burstRotate.toFixed(2)}deg`);
  });
};

const updateAboutEntryTransition = () => {
  if (!aboutSection || !aboutHeading || !aboutPanel) {
    root.style.setProperty("--about-enter-progress", "0");
    root.style.setProperty("--about-heading-enter", "0");
    root.style.setProperty("--about-panel-enter", "0");
    return;
  }

  const sectionRect = aboutSection.getBoundingClientRect();
  const headingRect = aboutHeading.getBoundingClientRect();
  const panelRect = aboutPanel.getBoundingClientRect();

  const sectionStart = window.innerHeight * 0.94;
  const sectionEnd = window.innerHeight * 0.44;
  const sectionDistance = sectionStart - sectionEnd;
  const progress =
    sectionDistance > 0 ? clamp((sectionStart - sectionRect.top) / sectionDistance, 0, 1) : 0;

  const headingStart = window.innerHeight * 0.64;
  const headingEnd = window.innerHeight * 0.26;
  const headingDistance = headingStart - headingEnd;
  const headingRaw =
    headingDistance > 0 ? clamp((headingStart - headingRect.top) / headingDistance, 0, 1) : 0;

  const panelStart = window.innerHeight * 0.82;
  const panelEnd = window.innerHeight * 0.34;
  const panelDistance = panelStart - panelEnd;
  const panelRaw =
    panelDistance > 0 ? clamp((panelStart - panelRect.top) / panelDistance, 0, 1) : 0;

  const headingEnter = easeOutCubic(headingRaw);
  const panelEnter = easeOutCubic(panelRaw);

  root.style.setProperty("--about-enter-progress", progress.toFixed(3));
  root.style.setProperty("--about-heading-enter", headingEnter.toFixed(3));
  root.style.setProperty("--about-panel-enter", panelEnter.toFixed(3));
};

const resetIssueProgress = () => {
  issueSections.forEach((section) => section.classList.remove("is-current"));
  document.body.classList.remove("is-skills-active");
  delete document.body.dataset.issue;
  root.style.setProperty("--bridge-progress", "0");
  root.style.setProperty("--accent-opacity", "0.16");
  root.style.setProperty("--thread-opacity", "0.24");
  root.style.setProperty("--section-dim", "0.16");
  root.style.setProperty("--issue-56-progress", "0");
  root.style.setProperty("--about-enter-progress", "0");
  root.style.setProperty("--about-heading-enter", "0");
  root.style.setProperty("--about-panel-enter", "0");
  aboutSection?.style.setProperty("--about-exit-progress", "0");
  skillsSection?.style.setProperty("--skills-progress", "0");
  skillsSection?.style.setProperty("--skills-title-progress", "0");
  skillsSection?.style.setProperty("--skills-web-progress", "0");
  skillsSection?.style.setProperty("--skills-web-density-progress", "0");
  skillsSection?.style.setProperty("--skills-icons-progress", "0");
  skillBadges.forEach((badge) => {
    badge.style.setProperty("--badge-pop", "0");
    badge.style.setProperty("--badge-float", "0");
    badge.style.setProperty("--badge-burst-y", "0px");
    badge.style.setProperty("--badge-burst-scale", "0");
    badge.style.setProperty("--badge-burst-rotate", "0deg");
  });
};

const getIssueFocus = (rect) => {
  const viewportAnchor = window.innerHeight * 0.48;
  const sectionCenter = rect.top + rect.height / 2;
  const distance = Math.abs(sectionCenter - viewportAnchor);
  const maxDistance = window.innerHeight * 0.72 + rect.height * 0.16;
  return clamp(1 - distance / maxDistance, 0, 1);
};

const getIssueProgress = (rect) => {
  const total = rect.height + window.innerHeight * 0.38;
  return total > 0 ? clamp((window.innerHeight * 0.22 - rect.top) / total, 0, 1) : 0;
};

const updateIssueProgress = () => {
  if (issueSections.length === 0) return;

  const candidates = issueSections
    .filter((section) => visibleIssueSections.has(section))
    .map((section) => {
      const rect = section.getBoundingClientRect();
      const focus = getIssueFocus(rect);
      const ratio = issueIntersectionRatios.get(section) ?? 0;
      return {
        section,
        rect,
        focus,
        score: focus * 0.72 + ratio * 0.28,
      };
    });

  if (candidates.length === 0) {
    resetIssueProgress();
    return;
  }

  const activeCandidate = candidates.reduce((best, candidate) =>
    candidate.score > best.score ? candidate : best,
  );

  const activeIssue = activeCandidate.section.dataset.issue ?? "";
  const progress = getIssueProgress(activeCandidate.rect);
  const stage = clamp((Number(activeIssue) - 3) / 3, 0, 1);
  const accentOpacity = clamp(0.24 - stage * 0.1 + Math.sin(progress * Math.PI) * 0.05, 0.08, 0.26);
  const threadOpacity = clamp(0.34 - stage * 0.1 + (1 - progress) * 0.08, 0.12, 0.4);
  const sectionDim = clamp(0.14 + stage * 0.14 + Math.abs(progress - 0.5) * 0.06, 0.14, 0.34);

  issueSections.forEach((section) => {
    section.classList.toggle("is-current", section === activeCandidate.section);
  });

  document.body.dataset.issue = activeIssue;
  document.body.classList.toggle("is-skills-active", activeIssue === "04");
  root.style.setProperty("--bridge-progress", progress.toFixed(3));
  root.style.setProperty("--accent-opacity", accentOpacity.toFixed(3));
  root.style.setProperty("--thread-opacity", threadOpacity.toFixed(3));
  root.style.setProperty("--section-dim", sectionDim.toFixed(3));
};

let ticking = false;

const updateScene = () => {
  ticking = false;
  updateHeroProgress();
  updateNameProgress();
  updateIssueProgress();
  updateAboutEntryTransition();
  updateSkillsTransition();
  updateProjectsProgress();
  updateIssueFiveSixTransition();
};

const requestSceneUpdate = () => {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateScene);
};

const issueObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      issueIntersectionRatios.set(entry.target, entry.intersectionRatio);

      if (entry.isIntersecting) {
        visibleIssueSections.add(entry.target);
        entry.target.classList.add("is-visible");
      } else {
        visibleIssueSections.delete(entry.target);
      }
    });

    requestSceneUpdate();
  },
  {
    threshold: [0, 0.16, 0.32, 0.48, 0.64, 0.8],
    rootMargin: "-16% 0px -16% 0px",
  },
);

currentLanguage = getStoredLanguage() ?? "zh";
document.body.classList.toggle("is-low-memory-device", lowMemoryDevice);
initializeSkillBadges();
issueSections.forEach((section) => issueObserver.observe(section));
setupHeroPeel();
applyLanguage(currentLanguage, { persist: false });
updateScene();
trimContactIconBackground();
initializeContactCopyButtons();
window.addEventListener("scroll", requestSceneUpdate, { passive: true });
window.addEventListener("resize", () => {
  setupHeroPeelPath();
  requestSceneUpdate();
});

languageToggle?.addEventListener("click", () => {
  applyLanguage(currentLanguage === "zh" ? "en" : "zh");
});

topbarToggle?.addEventListener("click", () => {
  setTopbarMenuState(!topbar?.classList.contains("is-open"));
});

topbarNavLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setTopbarMenuState(false);
  });
});

document.addEventListener("click", (event) => {
  if (!topbar?.classList.contains("is-open")) return;
  if (event.target instanceof Node && topbar.contains(event.target)) return;
  setTopbarMenuState(false);
});

const clearQuestionChipState = () => {
  questionChips.forEach((chip) => chip.classList.remove("is-active"));
};

const setAssistantState = ({
  answer,
  status = getAssistantCopy().defaultStatus,
  isLoading = false,
  disableInput = false,
}) => {
  if (answerBox && typeof answer === "string") {
    answerBox.textContent = answer;
    answerBox.classList.toggle("is-loading", isLoading);
  }

  if (askStatus) {
    askStatus.textContent = status;
  }

  if (askInput) {
    askInput.disabled = disableInput;
  }

  if (askSubmit) {
    askSubmit.disabled = disableInput;
  }
};

const askPortfolioAssistant = async (question, fallbackAnswer = getAssistantCopy().defaultAnswer) => {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    setAssistantState({
      answer: fallbackAnswer,
      status: getAssistantCopy().emptyQuestion,
    });
    return;
  }

  const currentRequestId = ++assistantRequestId;
  pendingAssistantQuestion = trimmedQuestion;

  setAssistantState({
    answer: getAssistantCopy().loadingAnswer(trimmedQuestion),
    status: getAssistantCopy().loadingStatus,
    isLoading: true,
    disableInput: true,
  });

  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: trimmedQuestion,
        language: currentLanguage,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || getAssistantCopy().requestError);
    }

    if (currentRequestId !== assistantRequestId) return;

    setAssistantState({
      answer: data.answer || fallbackAnswer,
      status: getAssistantCopy().followUpStatus,
    });
  } catch (error) {
    if (currentRequestId !== assistantRequestId) return;

    setAssistantState({
      answer: fallbackAnswer,
      status: error instanceof Error ? getAssistantCopy().requestError : getAssistantCopy().requestError,
    });
  } finally {
    if (currentRequestId === assistantRequestId) {
      pendingAssistantQuestion = "";
      setAssistantState({
        answer: answerBox?.textContent?.trim() ?? fallbackAnswer,
        status: askStatus?.textContent?.trim() ?? getAssistantCopy().defaultStatus,
        disableInput: false,
      });
    }
  }
};

questionChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    clearQuestionChipState();
    chip.classList.add("is-active");
    setAssistantState({
      answer: chip.dataset.answer ?? getAssistantCopy().defaultAnswer,
      status: getAssistantCopy().defaultStatus,
    });
  });
});

askForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const question = askInput?.value?.trim() ?? "";
  if (!question) {
    setAssistantState({
      answer: getAssistantCopy().defaultAnswer,
      status: getAssistantCopy().emptyQuestion,
    });
    askInput?.focus();
    return;
  }

  clearQuestionChipState();
  void askPortfolioAssistant(question);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -10% 0px",
  },
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 70, 210)}ms`;
  revealObserver.observe(item);
});

const getCenteredRect = () => {
  const maxWidth = Math.min(window.innerWidth - 32, 560);
  const maxHeight = Math.min(window.innerHeight - 24, 820);
  const width = Math.min(maxWidth, maxHeight * 0.68);
  const height = Math.min(maxHeight, width / 0.68);

  return {
    top: (window.innerHeight - height) / 2,
    left: (window.innerWidth - width) / 2,
    width,
    height,
  };
};

const applyPanelRect = (rect) => {
  if (!modalPanel) return;
  modalPanel.style.top = `${rect.top}px`;
  modalPanel.style.left = `${rect.left}px`;
  modalPanel.style.width = `${rect.width}px`;
  modalPanel.style.height = `${rect.height}px`;
};

const applyPanelTransform = ({ x = 0, y = 0, scaleX = 1, scaleY = 1 }) => {
  if (!modalPanel) return;
  modalPanel.style.setProperty("--panel-x", `${x}px`);
  modalPanel.style.setProperty("--panel-y", `${y}px`);
  modalPanel.style.setProperty("--panel-scale-x", `${scaleX}`);
  modalPanel.style.setProperty("--panel-scale-y", `${scaleY}`);
};

const getTransformFromRect = (fromRect, toRect) => {
  const fromCenterX = fromRect.left + fromRect.width / 2;
  const fromCenterY = fromRect.top + fromRect.height / 2;
  const toCenterX = toRect.left + toRect.width / 2;
  const toCenterY = toRect.top + toRect.height / 2;

  return {
    x: fromCenterX - toCenterX,
    y: fromCenterY - toCenterY,
    scaleX: fromRect.width / toRect.width,
    scaleY: fromRect.height / toRect.height,
  };
};

const getTransformString = ({ x = 0, y = 0, scaleX = 1, scaleY = 1 }) =>
  `translate3d(${x}px, ${y}px, 0) scale(${scaleX}, ${scaleY})`;

const cancelCollapseAnimation = () => {
  if (!collapseAnimation) return;
  collapseAnimation.cancel();
  collapseAnimation = null;
};

const clearModalTimers = () => {
  clearTimeout(closeTimer);
  clearTimeout(closeStageTimer);
  clearTimeout(flipTimer);
  cancelCollapseAnimation();
};

const setProjectCardScene = (element, scene = "idle") => {
  if (!(element instanceof HTMLElement)) return;

  element.classList.remove("is-hovered", "is-active-scene", "is-returning");

  if (scene === "hovered") {
    element.classList.add("is-hovered");
  }

  if (scene === "active") {
    element.classList.add("is-active-scene");
  }
};

const setModalCardScene = (scene = "idle") => {
  const modalCards = [
    modalFront?.querySelector(".project-card__button"),
    modalMirror?.querySelector(".project-card__button"),
  ];

  modalCards.forEach((card) => setProjectCardScene(card, scene));
};

const syncHoveredProjectCard = () => {
  if (!lastPointerPosition) return;

  if (projectModal && !projectModal.hidden && projectModal.classList.contains("is-visible")) {
    projectButtons.forEach((button) => {
      if (!button.classList.contains("is-source-hidden")) {
        setProjectCardScene(button, "idle");
      }
    });
    return;
  }

  const hoveredElement = document.elementFromPoint(
    lastPointerPosition.clientX,
    lastPointerPosition.clientY,
  );
  const hoveredButton = hoveredElement?.closest?.(".project-card__button");

  projectButtons.forEach((button) => {
    const isInteractive =
      !button.classList.contains("is-hover-suppressed") &&
      !button.classList.contains("is-source-hidden");

    if (isInteractive && button === hoveredButton) {
      setProjectCardScene(button, "hovered");
      return;
    }

    setProjectCardScene(button, "idle");
  });
};

const updatePointerPosition = (event) => {
  lastPointerPosition = { clientX: event.clientX, clientY: event.clientY };
};

const releaseSuppressedProjectHover = () => {
  suppressedHoverButton?.classList.remove("is-hover-suppressed");
  suppressedHoverButton = null;
};

const isPointerOutsideElement = (element) => {
  if (!(element instanceof HTMLElement) || !lastPointerPosition) return true;

  const { clientX, clientY } = lastPointerPosition;
  const rect = element.getBoundingClientRect();
  return (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  );
};

const queueSuppressedProjectHoverRelease = () => {
  requestAnimationFrame(() => {
    if (!suppressedHoverButton || isPointerOutsideElement(suppressedHoverButton)) {
      releaseSuppressedProjectHover();
    }
  });
};

const suppressProjectHover = (button) => {
  releaseSuppressedProjectHover();
  if (!(button instanceof HTMLElement)) return;

  suppressedHoverButton = button;
  suppressedHoverButton.classList.add("is-hover-suppressed");
};

const getProjectCardCloneMarkup = (button, { extraClasses = "", stripped = false, scene = "active" } = {}) => {
  const variantClasses = [...button.classList].filter((className) =>
    className.startsWith("project-card__button--"),
  );
  const cloneClasses = [
    "project-card__button",
    ...variantClasses,
    "project-card__button--modal",
    scene === "hovered" ? "is-hovered" : "",
    scene === "active" ? "is-active-scene" : "",
    extraClasses,
  ]
    .filter(Boolean)
    .join(" ");

  const clone = document.createElement("div");
  clone.className = cloneClasses;
  clone.setAttribute("aria-hidden", "true");
  if (button.dataset.projectId) clone.dataset.projectId = button.dataset.projectId;
  if (button.dataset.coverProfile) clone.dataset.coverProfile = button.dataset.coverProfile;
  if (button.getAttribute("style")) clone.setAttribute("style", button.getAttribute("style"));
  clone.innerHTML = button.innerHTML;

  if (stripped) {
    clone
      .querySelectorAll(
        ".project-card__copy, .project-card__impact, .project-card__logo, .project-card__index, strong, .project-card__type, p",
      )
      .forEach((element) => element.remove());

    const echoPanel = document.createElement("span");
    echoPanel.className = "project-modal__echo-panel";
    const echoLines = document.createElement("span");
    echoLines.className = "project-modal__echo-lines";
    clone.append(echoPanel, echoLines);
  }

  return clone.outerHTML;
};

const syncModalCardScene = (button, { scene = "active" } = {}) => {
  if (!modalFront || !modalMirror) return;

  modalFront.innerHTML = getProjectCardCloneMarkup(button, {
    extraClasses: "project-modal__card",
    scene,
  });
  modalMirror.innerHTML = getProjectCardCloneMarkup(button, {
    extraClasses: "project-modal__card project-modal__card--echo",
    stripped: true,
    scene,
  });
};

const clearModalCardScene = () => {
  if (modalFront) modalFront.innerHTML = "";
  if (modalMirror) modalMirror.innerHTML = "";
};

const clearModalProjectContent = () => {
  const previewVideo = modalPreview?.querySelector("video");
  if (previewVideo instanceof HTMLVideoElement) {
    previewVideo.pause();
    previewVideo.removeAttribute("src");
    previewVideo.querySelectorAll("source").forEach((source) => source.remove());
    previewVideo.load();
  }

  if (modalSignals) modalSignals.replaceChildren();
  if (modalPreview) modalPreview.replaceChildren();
  if (modalProofs) modalProofs.replaceChildren();
  if (modalProofTrigger) {
    modalProofTrigger.hidden = true;
    modalProofTrigger.textContent = getModalCopy().proofTrigger;
  }
  closeProofSheet();
};

const renderProjectSignals = (signals = []) => {
  if (!modalSignals) return;

  modalSignals.replaceChildren();
  modalSignals.hidden = signals.length === 0;

  signals.forEach((signal) => {
    const chip = document.createElement("span");
    chip.className = "project-modal__signal";
    chip.textContent = signal;
    modalSignals.append(chip);
  });
};

const createPreviewMedia = (preview) => {
  const hasVideo = Boolean(preview?.videoSrc);
  const mediaWrapper = hasVideo ? document.createElement("button") : document.createElement("div");
  mediaWrapper.className = "project-modal__preview-frame";

  if (hasVideo) {
    mediaWrapper.type = "button";
    mediaWrapper.classList.add("project-modal__preview-frame--interactive");
    mediaWrapper.dataset.previewPlay = "true";
    mediaWrapper.dataset.videoSrc = preview.videoSrc ?? "";
    mediaWrapper.dataset.videoType = preview.videoType ?? "video/mp4";
    mediaWrapper.setAttribute(
      "aria-label",
      getModalCopy().previewAria(preview.title ?? getModalCopy().previewVideoTitle),
    );
  } else {
    mediaWrapper.classList.add("project-modal__preview-frame--pending");
  }

  if (preview?.poster) {
    const poster = document.createElement("img");
    poster.className = "project-modal__preview-poster";
    poster.src = preview.poster;
    poster.alt = preview.label ?? "";
    poster.loading = "lazy";
    mediaWrapper.append(poster);
  }

  const overlay = document.createElement("div");
  overlay.className = "project-modal__preview-overlay";

  const badge = document.createElement("span");
  badge.className = "project-modal__preview-badge";
  badge.textContent = hasVideo ? getModalCopy().previewPlay : getModalCopy().previewPending;

  const play = document.createElement("span");
  play.className = "project-modal__preview-play";
  play.setAttribute("aria-hidden", "true");
  play.textContent = hasVideo ? "▶" : "•";

  const copy = document.createElement("div");
  copy.className = "project-modal__preview-copy";

  const title = document.createElement("strong");
  title.className = "project-modal__preview-title";
  title.textContent = preview?.title ?? getModalCopy().previewTitle;

  const note = document.createElement("p");
  note.className = "project-modal__preview-note";
  note.textContent = preview?.note ?? getModalCopy().previewNote;

  copy.append(title, note);
  overlay.append(badge, play, copy);
  mediaWrapper.append(overlay);

  return mediaWrapper;
};

const renderProjectPreview = (projectDetail) => {
  if (!modalPreview) return;

  modalPreview.replaceChildren();
  const preview = projectDetail.preview ?? {};
  const card = document.createElement("section");
  card.className = "project-modal__preview-card";

  if (!preview.videoSrc) {
    card.classList.add("project-modal__preview-card--pending");
  }

  card.append(createPreviewMedia(preview));

  if (Array.isArray(preview.stats) && preview.stats.length > 0) {
    const stats = document.createElement("div");
    stats.className = "project-modal__preview-stats";

    preview.stats.forEach((item) => {
      const stat = document.createElement("div");
      stat.className = "project-modal__preview-stat";

      const label = document.createElement("span");
      label.textContent = item.label;
      const value = document.createElement("strong");
      value.textContent = item.value;

      stat.append(label, value);
      stats.append(stat);
    });

    card.append(stats);
  }

  modalPreview.append(card);
};

const renderProjectProofs = (proofs = []) => {
  if (!modalProofs) return;

  modalProofs.replaceChildren();

  proofs.forEach((proof) => {
    const figure = document.createElement("figure");
    figure.className = "project-modal__proof";

    const image = document.createElement("img");
    image.className = "project-modal__proof-image";
    image.src = proof.src;
    image.alt = proof.alt ?? proof.title;
    image.loading = "lazy";

    const caption = document.createElement("figcaption");
    caption.className = "project-modal__proof-copy";

    const kicker = document.createElement("span");
    kicker.className = "project-modal__proof-kicker";
    kicker.textContent = "Real Signal";

    const title = document.createElement("strong");
    title.className = "project-modal__proof-title";
    title.textContent = proof.title;

    const description = document.createElement("p");
    description.className = "project-modal__proof-description";
    description.textContent = proof.description;

    caption.append(kicker, title, description);
    figure.append(image, caption);
    modalProofs.append(figure);
  });
};

const openProofSheet = () => {
  if (!modalProofSheet) return;
  modalProofSheet.hidden = false;
  projectModal?.classList.add("is-proof-open");
};

const closeProofSheet = () => {
  projectModal?.classList.remove("is-proof-open");
  if (modalProofSheet) modalProofSheet.hidden = true;
};

const renderProjectProofTrigger = (proofs = []) => {
  if (!modalProofTrigger) return;

  const hasProofs = proofs.length > 0;
  modalProofTrigger.hidden = !hasProofs;
  modalProofTrigger.textContent = hasProofs
    ? getModalCopy().proofTriggerWithCount(proofs.length)
    : getModalCopy().proofTrigger;
};

const populateModalContent = (projectDetail) => {
  if (modalTitle) modalTitle.textContent = projectDetail.title ?? "Project";
  if (modalType) modalType.textContent = projectDetail.type ?? "Project Type";
  if (modalDescription) {
    modalDescription.textContent = projectDetail.description ?? projectDetail.frontIntro ?? "";
  }

  renderProjectSignals(projectDetail.signals ?? []);
  renderProjectPreview(projectDetail);
  renderProjectProofs(projectDetail.proofs ?? []);
  renderProjectProofTrigger(projectDetail.proofs ?? []);

  if (modalDomain) {
    const href = projectDetail.link ?? "";
    modalDomain.textContent = projectDetail.linkLabel ?? href;
    modalDomain.href = href || "#";
    modalDomain.hidden = !href;
  }

  if (modalGithub) {
    const href = projectDetail.githubLink ?? "";
    modalGithub.textContent = projectDetail.githubLabel ?? "GitHub";
    modalGithub.href = href || "#";
    modalGithub.hidden = !href;
  }

  if (modalGithubNote) {
    const note = projectDetail.githubNote ?? "";
    modalGithubNote.textContent = note;
    modalGithubNote.hidden = !note.trim();
  }

  if (modalMeta) {
    modalMeta.textContent = projectDetail.meta ?? "";
    modalMeta.hidden = !(projectDetail.meta ?? "").trim();
  }
};

const lockBodyScroll = () => {
  const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = "hidden";
  document.body.style.paddingRight = scrollbarGap > 0 ? `${scrollbarGap}px` : "";
};

const unlockBodyScroll = () => {
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
};

const openModal = (button) => {
  if (!projectModal || !modalPanel || !modalFront) return;

  releaseSuppressedProjectHover();

  const projectDetail = getProjectDetail(button);
  const startRect = button.getBoundingClientRect();
  const centeredRect = getCenteredRect();

  activeProjectData = projectDetail;
  populateModalContent(projectDetail);
  syncModalCardScene(button, { scene: "active" });
  projectButtons.forEach((item) => {
    setProjectCardScene(item, "idle");
    item.classList.remove("is-source-hidden");
  });

  activeProjectButton = button;
  clearModalTimers();
  setProjectCardScene(button, "idle");
  button.classList.add("is-source-hidden");

  projectModal.hidden = false;
  projectModal.classList.remove("is-closing");
  projectModal.classList.remove("is-collapsing");
  projectModal.classList.remove("is-open");
  applyPanelRect(centeredRect);
  applyPanelTransform({});
  projectModal.classList.add("is-visible");
  lockBodyScroll();
  cancelCollapseAnimation();
  const isPhoneViewport = window.innerWidth <= 560;
  const mobileOpenDelay = isPhoneViewport ? 520 : FLIP_DELAY_MS;
  collapseAnimation = modalPanel.animate(
    [
      {
        transform: getTransformString(getTransformFromRect(startRect, centeredRect)),
        opacity: 1,
      },
      {
        transform: getTransformString({}),
        opacity: 1,
      },
    ],
    {
      duration: PANEL_TRANSITION_MS,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both",
    },
  );
  collapseAnimation.onfinish = () => {
    collapseAnimation = null;
  };
  collapseAnimation.oncancel = () => {
    collapseAnimation = null;
  };
  flipTimer = window.setTimeout(() => {
    projectModal.classList.add("is-open");
  }, mobileOpenDelay);
};

const closeModal = () => {
  if (!projectModal || !modalPanel) return;

  clearModalTimers();
  closeProofSheet();
  if (activeProjectButton) {
    suppressProjectHover(activeProjectButton);
    activeProjectButton.blur();
    setProjectCardScene(activeProjectButton, "idle");
    activeProjectButton.classList.add("is-source-hidden");
  }
  projectModal.classList.add("is-closing");
  projectModal.classList.remove("is-collapsing");
  projectModal.classList.remove("is-open");
  const centeredRect = getCenteredRect();
  applyPanelRect(centeredRect);
  applyPanelTransform({});

  closeStageTimer = window.setTimeout(() => {
    const targetRect = activeProjectButton?.getBoundingClientRect();
    if (!targetRect || !projectModal?.classList.contains("is-visible")) return;
    const currentRect = modalPanel.getBoundingClientRect();
    const fromTransform = getTransformFromRect(currentRect, targetRect);

    projectModal.classList.add("is-collapsing");
    setModalCardScene("idle");
    cancelCollapseAnimation();
    applyPanelRect(targetRect);
    applyPanelTransform({});
    collapseAnimation = modalPanel.animate(
      [
        {
          transform: getTransformString(fromTransform),
          opacity: 1,
        },
        {
          transform: getTransformString({}),
          opacity: 1,
        },
      ],
      {
        duration: CLOSE_COLLAPSE_MS,
        easing: "cubic-bezier(0.28, 0.2, 0.18, 1)",
        fill: "both",
      },
    );
    collapseAnimation.onfinish = () => {
      collapseAnimation = null;
    };
    collapseAnimation.oncancel = () => {
      collapseAnimation = null;
    };
  }, CLOSE_RETURN_DELAY_MS);

  closeTimer = window.setTimeout(() => {
    const returningButton = activeProjectButton;
    projectModal.classList.remove("is-closing");
    projectModal.classList.remove("is-collapsing");
    projectModal.classList.remove("is-visible");
    projectModal.hidden = true;
    cancelCollapseAnimation();
    applyPanelTransform({});
    clearModalCardScene();
    clearModalProjectContent();
    unlockBodyScroll();
    activeProjectButton = null;
    activeProjectData = null;

    if (returningButton) {
      setProjectCardScene(returningButton, "idle");
      returningButton.classList.remove("is-source-hidden");
      queueSuppressedProjectHoverRelease();
    }
  }, CLOSE_RETURN_DELAY_MS + CLOSE_COLLAPSE_MS + MODAL_EXIT_BUFFER_MS);
};

projectButtons.forEach((button) => {
  button.addEventListener("click", () => openModal(button));
});

modalPreview?.addEventListener("click", async (event) => {
  const trigger = event.target instanceof Element ? event.target.closest("[data-preview-play='true']") : null;
  if (!(trigger instanceof HTMLButtonElement) || !activeProjectData?.preview?.videoSrc) return;

  const frame = document.createElement("div");
  frame.className = "project-modal__preview-frame";
  const video = document.createElement("video");
  video.className = "project-modal__preview-video";
  video.controls = true;
  video.playsInline = true;
  video.preload = "none";
  video.poster = activeProjectData.preview.poster ?? "";

  const source = document.createElement("source");
  source.src = activeProjectData.preview.videoSrc;
  source.type = activeProjectData.preview.videoType ?? "video/mp4";
  video.append(source);

  frame.append(video);
  trigger.replaceWith(frame);

  try {
    await video.play();
  } catch (_error) {
    video.controls = true;
  }
});

modalProofTrigger?.addEventListener("click", () => {
  if (!activeProjectData?.proofs?.length) return;
  openProofSheet();
});

projectModal?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.close === "true") {
    closeModal();
    return;
  }
  if (target.dataset.proofClose === "true") {
    closeProofSheet();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setTopbarMenuState(false);
    if (projectModal?.classList.contains("is-proof-open")) {
      closeProofSheet();
      return;
    }
    closeModal();
  }
});

window.addEventListener(
  "pointermove",
  (event) => {
    updatePointerPosition(event);

    if (suppressedHoverButton && isPointerOutsideElement(suppressedHoverButton)) {
      releaseSuppressedProjectHover();
      return;
    }

    syncHoveredProjectCard();
  },
  { passive: true },
);

window.addEventListener(
  "pointerdown",
  (event) => {
    updatePointerPosition(event);
  },
  { passive: true },
);

window.addEventListener("resize", () => {
  setTopbarMenuState(false);

  if (!projectModal || projectModal.hidden || !projectModal.classList.contains("is-visible")) return;
  const centeredRect = getCenteredRect();

  if (projectModal.classList.contains("is-closing") && activeProjectButton) {
    if (projectModal.classList.contains("is-collapsing")) {
      const targetRect = activeProjectButton.getBoundingClientRect();
      applyPanelRect(targetRect);
      applyPanelTransform({});
      return;
    }

    applyPanelRect(centeredRect);
    applyPanelTransform({});
    return;
  }

  applyPanelRect(centeredRect);

  if (!projectModal.classList.contains("is-open") && activeProjectButton) {
    applyPanelTransform(getTransformFromRect(activeProjectButton.getBoundingClientRect(), centeredRect));
    return;
  }

  applyPanelTransform({});
});

const loaderStartTime = performance.now();
const completeInitialLoad = () => {
  const elapsed = performance.now() - loaderStartTime;
  const remaining = Math.max(0, LOADER_MIN_VISIBLE_MS - elapsed);
  window.setTimeout(dismissSiteLoader, remaining);
};

if (document.readyState === "complete") {
  completeInitialLoad();
} else {
  window.addEventListener("load", completeInitialLoad, { once: true });
}

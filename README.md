# EIDDIE Portfolio

个人作品集网站，线上地址：[eiddie.me](https://www.eiddie.me)  
Personal portfolio site, live at [eiddie.me](https://www.eiddie.me)

这个项目不是一个通用模板，而是围绕我自己的表达方式、项目气质和页面节奏做出来的个人网站。  
This is not a generic template. It is a portfolio site shaped around my own visual taste, project language, and interaction rhythm.

## Overview｜项目概览

网站以章节叙事的方式展开，从首屏海报、名字拆解、About、Skill Universe、Projects 到 Contact，重点放在视觉表达、滚动切换、项目展示和整体氛围控制上。  
The site unfolds as a section-based narrative, moving through the hero poster, name deconstruction, About, Skill Universe, Projects, and Contact, with the focus placed on visual expression, scroll transitions, project presentation, and overall atmosphere.

除了静态展示，这个网站还包含一个作品集专属的 AI 问答模块，用来回答与我本人、项目、技能和合作方式相关的问题。  
In addition to the visual presentation, the site also includes a portfolio-specific AI Q&A module for answering questions related to me, my projects, my skills, and how I work.

## Highlights｜项目亮点

- 海报式首屏与强视觉导向的个人品牌表达  
  Poster-style hero and visually led personal branding
- 分章节滚动叙事与连续的 section 过渡  
  Section-based scroll narrative with continuous transitions
- About / Skills / Projects / Contact 的整体节奏统一  
  A unified rhythm across About / Skills / Projects / Contact
- 可交互的项目卡片与项目详情弹窗  
  Interactive project cards and project detail modal
- 作品集专属 AI 问答体验  
  A portfolio-specific AI Q&A experience
- 中英文切换  
  Chinese / English language toggle
- 桌面端与移动端适配  
  Responsive behavior across desktop and mobile

## Design Direction｜设计方向

这个项目追求的不是“标准作品集 UI”，而是更偏编辑感、海报感和叙事感的浏览体验。  
This project is not aiming for a standard portfolio UI, but for something more editorial, poster-like, and narrative-driven.

我更在意这些事情：  
The priorities behind it are:

- 页面有没有明确的气质  
  Whether the page has a distinct visual identity
- section 之间的切换是否自然  
  Whether transitions between sections feel coherent
- 项目展示是否有记忆点  
  Whether project presentation leaves a strong impression
- 技术实现是否真正服务于体验，而不是只堆功能  
  Whether the technical implementation genuinely serves the experience instead of just adding features

## Built With｜技术实现

- Vite
- HTML
- CSS
- Vanilla JavaScript
- DeepSeek API
- Playwright

## Project Structure｜项目结构

```text
.
├── api/
│   └── ask.js
├── server/
│   └── assistant-handler.mjs
├── public/
├── index.html
├── styles.css
├── script.js
├── vite.config.js
└── package.json
```

## AI Assistant｜AI 问答

网站内的 AI assistant 不是通用聊天组件，而是围绕这个作品集本身设计的交互模块。  
The AI assistant in this project is not a generic chat widget, but a module designed specifically for this portfolio.

它的作用包括：  
It is used to:

- 回答和我本人、项目、技能、合作方式有关的问题  
  Answer questions related to me, my projects, my skills, and collaboration style
- 跟随当前页面语言输出中英文回答  
  Follow the current site language for Chinese / English output
- 保持作品集内部的一致语气和表达方式  
  Maintain a response style that matches the portfolio itself

与 AI 相关的核心代码在：  
Core AI-related files:

- [server/assistant-handler.mjs](./server/assistant-handler.mjs)
- [api/ask.js](./api/ask.js)
- [vite.config.js](./vite.config.js)

## Repository Notes｜仓库说明

这个仓库主要用于展示项目本身，而不是提供完整的通用部署文档。  
This repository is primarily for showcasing the project itself, not for serving as a full generic deployment guide.

出于展示和隐私考虑，一些部署细节、环境配置和个人化内容不会在 README 里展开。  
For presentation and privacy reasons, some deployment details, environment configuration, and personalized content are intentionally not expanded in the README.

## Live Site｜线上预览

[https://eiddie.me](https://www.eiddie.me)

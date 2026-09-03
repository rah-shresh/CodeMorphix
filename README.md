# ⚡ CodeMorphix - AI Powered Code Translation Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-API-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 📌 Overview

**CodeMorphix** is a full-stack, AI-powered web application designed to translate source code seamlessly across multiple programming languages while preserving underlying code logic, structural semantics, and algorithmic functionality. 

Driven by **Google Gemini AI** for high-accuracy translation and analysis, and integrated with the **Piston API** for real-time sandboxed code execution, CodeMorphix provides developers with an end-to-end platform to translate, execute, verify, explain, and debug code instantly in a modern, ultra-responsive SaaS UI.

---

## ✨ Features

- 🔄 **Multi-Language Code Translation**: Effortless code translation across modern languages (Python, JavaScript, TypeScript, C++, Java, Rust, Go, C#, PHP, Ruby, etc.) preserving exact variable logic and patterns.
- 🧠 **AI Code Understanding & Generation**: Context-aware AST logic preservation powered by Google's Gemini API.
- ⚡ **Real-Time Sandboxed Code Execution**: Run original and translated code side-by-side using isolated execution containers via the Piston API.
- ✅ **Output Verification**: Compare output streams (`stdout`, `stderr`) between source and target languages to confirm logical equivalence.
- 🔍 **Error Detection & Suggestions**: Automated static and semantic error detection with actionable fix recommendations.
- 📝 **Code Explanation Feature**: Get deep, line-by-line breakdown explanations of complex algorithms and language constructs.
- 🔐 **Secure Authentication**: OAuth & Credentials authentication powered by Auth.js (NextAuth.js v5) with PostgreSQL user session management.
- 🎨 **Modern SaaS UI**: Glassmorphism design system built with Monaco Code Editor integration, responsive layouts, syntax highlighting, dark mode aesthetics, and micro-interactions.
- 📥 **Copy & Export Functionality**: Quick 1-click clipboard copy and code snippet file download options.

---

## 🛠️ Tech Stack

### **Frontend & UI**
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Library**: [React 19](https://react.dev/)
- **Code Editor**: [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

### **Backend & Database**
- **Runtime & API**: Next.js API Routes / Server Actions (Node.js)
- **Database ORM**: [Prisma 7.8](https://www.prisma.io/)
- **Database Engine**: PostgreSQL (Neon Serverless DB / Supabase)
- **Authentication**: Auth.js (`next-auth@v5`) with `@auth/prisma-adapter` & bcryptjs

### **AI & Execution Engines**
- **AI Model**: [Google Gemini API (`@google/genai`)](https://ai.google.dev/)
- **Code Execution**: [Piston Engine API](https://github.com/engineer-man/piston)

### **Deployment**
- **Hosting**: [Vercel](https://vercel.com)

---

## 🏗️ Architecture & Working Flow

```mermaid
flowchart TD
    subgraph Client ["Client Interface (Next.js / React 19)"]
        UI["Monaco Editor UI"]
        Input["Source Code + Target Lang Selection"]
    end

    subgraph AuthLayer ["Security & Session"]
        Auth["Auth.js (NextAuth v5)"]
        DB[("Neon PostgreSQL via Prisma ORM")]
    end

    subgraph CoreEngine ["Backend Processing Pipeline"]
        Router["Next.js Route Handlers / API Routes"]
        Proxy["Proxy Handler / Sanitizer"]
    end

    subgraph ExternalServices ["External Engines & APIs"]
        Gemini["Google Gemini AI API"]
        Piston["Piston Code Execution Engine"]
    end

    UI -->|"1. Submit Source Code"| Input
    Input -->|"2. Request via API"| Router
    Router <-->|"Verify Session"| Auth
    Auth <-->|"Query User / History"| DB
    Router -->|"3. Forward Code Context"| Proxy
    Proxy -->|"4. Request AI Translation"| Gemini
    Gemini -->|"5. Return Translated Code & Explanation"| Proxy
    Proxy -->|"6. Execute Output Verification"| Piston
    Piston -->|"7. Send Execution Logs"| Proxy
    Proxy -->|"8. Formulate Response"| Router
    Router -->|"9. Render Translated Snippet & Results"| UI
```

### Process Step-by-Step:
1. **Source Code Input**: The user inputs source code into the Monaco Editor and selects a target language.
2. **Contextual Analysis & Translation**: The payload passes through Next.js proxy route handlers to the Google Gemini API, applying custom prompt engineering for strict code translation and logic retention.
3. **Sandboxed Code Execution**: Input and generated code snippets are submitted to the Piston API to run in isolated micro-containers.
4. **Verification & Diff Analysis**: Console output streams are collected, verified for correctness, and returned to the client alongside detailed code explanations.

---

## 📁 Directory Structure

```text
code-morphix/
├── prisma/
│   ├── schema.prisma         # Database schema models (Users, Accounts, Sessions, History)
│   └── prisma.config.ts      # Prisma Client & environment configuration
├── public/                   # Static assets, icons, SVGs, and branding assets
├── src/
│   ├── app/                  # Next.js App Router (Pages, Layouts, API endpoints)
│   │   ├── api/              # API route handlers (translation, execution, verify)
│   │   ├── auth/             # Sign-in / Sign-up authentication pages
│   │   ├── dashboard/        # Main translation workspace view
│   │   ├── layout.tsx        # Global root layout & providers
│   │   └── page.tsx          # Landing page
│   ├── components/           # Modular React components
│   │   ├── editor/           # Monaco editor wrapper & controls
│   │   ├── ui/               # Reusable UI elements (Buttons, Cards, Modals)
│   │   └── layout/           # Header, Sidebar, Navigation UI
│   ├── lib/                  # Core utility logic & service integration
│   │   ├── gemini.ts         # Google Gemini AI client & prompt helpers
│   │   ├── piston.ts         # Piston API execution service interface
│   │   ├── db.ts             # Prisma client instance
│   │   └── utils.ts          # Helper utilities & class mergers
│   ├── types/                # TypeScript type definitions & interfaces
│   ├── auth.ts               # Auth.js setup, providers & handlers
│   └── proxy.ts              # API proxy and request parsing configuration
├── .env.example              # Environment variables template
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies and build scripts
├── tsconfig.json             # TypeScript compiler settings
└── README.md                 # Project documentation
```

---

## 🚀 Installation & Setup

Follow these step-by-step instructions to run CodeMorphix locally on your machine.

### Prerequisites

Ensure you have the following installed:
- **Node.js**: `v18.x` or higher
- **npm** (or **pnpm** / **yarn**)
- **PostgreSQL Database**: Local PostgreSQL instance, or a serverless database (e.g., [Neon](https://neon.tech) / [Supabase](https://supabase.com))
- **Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/codemorphix.git
cd codemorphix
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and fill in your credential values (see the [Environment Variables](#-environment-variables-setup) section below).

### Step 4: Setup Database & Generate Prisma Client

Run the Prisma migrations to initialize your database schema:

```bash
npx prisma db push
```

Generate the Prisma client:

```bash
npx prisma generate
```

### Step 5: Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🔑 Environment Variables Setup

Create a `.env` file in the project root with the following configuration:

```env
# Database Connection URL (PostgreSQL / Neon / Supabase)
DATABASE_URL="postgresql://postgres:password@localhost:5432/code_translator?schema=public"

# Auth.js (NextAuth v5) Configuration
# Secret key generated via: npx auth secret
AUTH_SECRET="your-32-character-long-secret-key"

# Google OAuth Credentials (Optional: For Google Sign-In)
AUTH_GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Application Public URL
NEXTAUTH_URL="http://localhost:3000"

# Google Gemini API Key (Required for AI Translations)
# Get your key at: https://aistudio.google.com/
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
```

---

## 💻 Usage Instructions

### 1. Code Translation
1. Paste or type your source code into the left Monaco Code Editor panel.
2. Select your **Source Language** (or allow Auto-Detect) and your desired **Target Language**.
3. Click **"Translate Code"**.
4. The translated code will appear in the right editor panel with syntax highlighting.

### 2. Live Execution & Verification
1. Click **"Run Code"** to execute both the original and translated snippets side-by-side using the Piston API engine.
2. Inspect output logs (`stdout` / `stderr`) to verify that both codes yield identical logical output.

### 3. AI Code Explanation
1. Click **"Explain Code"** under any code panel.
2. View a comprehensive, markdown-rendered explanation detailing algorithm steps, variables, and language-specific optimizations.

### 4. Downloading & Exporting
- Click **"Copy"** to copy the code directly to your clipboard.
- Click **"Download"** to save the translated code file with the appropriate extension (e.g., `.py`, `.cpp`, `.rs`).

---

## 📷 Screenshots

*(Add your application screenshots here)*

| Landing Page | Translation Workspace |
| :---: | :---: |
| ![Landing Page Preview](https://via.placeholder.com/600x350?text=CodeMorphix+Landing+Page) | ![Workspace Preview](https://via.placeholder.com/600x350?text=Translation+Workspace+UI) |

| Live Execution & Logs | Code Explanation |
| :---: | :---: |
| ![Execution Preview](https://via.placeholder.com/600x350?text=Live+Execution+%26+Verification) | ![Explanation Preview](https://via.placeholder.com/600x350?text=AI+Code+Explanation) |

---

## 🔮 Future Scope & Roadmap

- [ ] **Multi-File / Directory Translation**: Support translating entire project repositories and multi-file structures.
- [ ] **Custom AI Prompt Tuning**: Allow users to select specific code optimization goals (e.g., *Optimize for Memory*, *Optimize for Speed*, *Idiomatic Style*).
- [ ] **CLI Tool Integration**: Develop an official `codemorphix-cli` npm package to translate code directly from the command line.
- [ ] **VST/VS Code Extension**: Bring CodeMorphix directly into IDEs via a VS Code extension.
- [ ] **Team Workspaces & Shared History**: Collaborative workspaces with saved translation history and snippet sharing.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check out the [Issues page](../../issues).

### Steps to Contribute:
1. Fork the Project repository.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more details.

---

<p align="center">
  Crafted with ❤️ for developers building with <b>CodeMorphix</b>
</p>

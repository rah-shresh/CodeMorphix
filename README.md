# CodeMorphix

**Translate. Execute. Verify.**

CodeMorphix is a premium, next-generation AI Code Translator and Verification Platform built for modern developers. Translate code across multiple languages with semantic precision, run the code in a remote sandboxed environment safely, and immediately verify the output equivalency.

---

## Key Features

1. **AI Code Translation**: Seamlessly convert code snippets or complete repositories using Gemini models, retaining variables, structures, and semantic meaning.
2. **Remote Safe Execution**: Execute both the original source and the translated code safely in an isolated remote sandbox.
3. **Equivalency Verification**: Compare execution outputs (`stdout`/`stderr`) dynamically to guarantee correct translation logic.
4. **Dark Glassmorphic UI**: Beautiful terminal console and split/diff editors matching the state-of-the-art developer tools dashboard.

---

## Supported Languages

* Python
* JavaScript
* TypeScript
* C
* C++
* Java
* Go
* Rust

---

## Getting Started

First, install the local dependencies:

```bash
npm install
```

Next, set up the environment variables:
Create a `.env` file (see `.env.example` as a template) and add your keys:
- `DATABASE_URL`: PostgreSQL connection string (e.g. Supabase)
- `GEMINI_API_KEY`: Google Gemini AI Developer Key
- `AUTH_SECRET`: NextAuth authentication encryption secret

Generate the Prisma Client and migrate the database:

```bash
npx prisma db push
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to experience **CodeMorphix**.

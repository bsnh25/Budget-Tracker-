# KiaBiyu Budget Tracker — Agent Guidelines & DevOps Standards

This document establishes the DevOps, Security, and Code Quality guidelines for the **KiaBiyu Budget Tracker** project. All agents working on this workspace must strictly adhere to these standards.

---

## 1. Git Commit Message Standards (Conventional Commits)
All commits must follow the **Conventional Commits** specification. The format should be:
```
<type>(<scope>): <short description>

[optional body describing the details]

[optional footer(s) for issue tracking or breaking changes]
```

### Allowed Types:
- `feat`: A new user-facing feature.
- `fix`: A bug fix.
- `docs`: Documentation updates only.
- `style`: Changes that do not affect the meaning of the code (whitespace, formatting, semicolons, etc.).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Changes to the build process, auxiliary tools, or libraries/dependencies.

### Examples:
- `feat(auth): integrate Supabase multi-profile real-time sync`
- `fix(categories): resolve missing closing div in Settings view`
- `style(donut): improve contrast of category allocation percentage text`

---

## 2. Security & Credentials Protection (No Leaks)
- **Environment Variables**: Local configurations must reside in `.env` or `.env.local` files. These files are strictly ignored in `.gitignore`.
- **Sensitive Keyfiles**: Private keys (`*.pem`, `*.key`, `*.p12`), service accounts, and credentials files must never be checked into Git.
- **GitHub Secrets**: Inject sensitive items (Supabase keys, API endpoints, credentials) dynamically during GitHub Actions runs via secrets (e.g., `${{ secrets.SUPABASE_ANON_KEY }}`).

---

## 3. GitHub Actions CI/CD Pipeline
Every pull request or push to `main` must run the automated compilation check to guarantee standard code quality:
- **Lint Check**: Use light linter tools like Oxlint (`npx oxlint`) or ESLint for rapid verification.
- **Build Compilation**: Execute `npm run build` to verify that assets compile into the distribution directory without warning logs or TypeScript/Rollup exceptions.

---

## 4. Gradle Configuration Standards
If any backend service is introduced in Java or Kotlin:
- Use the **Gradle Wrapper** (`./gradlew`) in all scripts and CI environments.
- Maintain dependencies inside `build.gradle` or `build.gradle.kts` using correct scope boundaries (`implementation`, `runtimeOnly`, `testImplementation`).
- Never store API keys or database passwords directly in `build.gradle`; extract them to the local `gradle.properties` (which is gitignored) or inject them via environment variables.

---

## 5. Dockerization Guidelines
When creating containers:
- Use **multi-stage builds** to build high-performance, minimal-sized images (e.g., building in `node:alpine` and copying static files to an `nginx:alpine` layer).
- Follow the principle of least privilege: configure non-root users (`USER node` or custom non-root accounts) inside the final image instead of running as `root`.
- Do not store environment variable values inside `Dockerfile` layers; let Docker Compose or deployment systems inject them dynamically.

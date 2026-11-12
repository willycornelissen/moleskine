# EGM Implementation Readiness Review Report: Stage 9

**Target:** `/home/willycornelissen/Desktop/Dablio/moleskine/docs/designs/personal_journal.md` (`Lines 257-376`)

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-implementation-readiness` | completed |
| `egm-codebase-details` | completed |
| `egm-style` | completed |

## Severity Breakdown
* 🔴 **Blocker**: 4
* 🟡 **Major**: 6
* 🟢 **Nit**: 3
* **Total Findings**: 13

---

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. Missing Execution Phasing & Testable Checkpoints - Severity: Blocker
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** Lines 257–366 (`Detailed Implementation Plan`)
* **Discrepancy Description**: The plan violates the "Phasing & Checkpoints" mandate of the `Implementation Readiness Standard`. It presents a flat list of 32 target files grouped by technical architectural layer rather than an ordered sequence of implementation phases. An implementer (human or AI) cannot deduce the dependency-ordered build path. There are no intermediate gates confirming that the codebase remains buildable, type-checked, and testable throughout execution.
* **Rationale & Recommendation**: Restructure the 32 tasks into 5 incremental, dependency-ordered phases, each terminating in a testable milestone:
  * **Phase 1: Project Tooling & Contracts** (`package.json`, `vite.config.ts`, `tsconfig.json`, Tailwind, `.env.example`, `src/types/note.ts`). *Gate:* `npx tsc --noEmit` passes.
  * **Phase 2: Services & Data Layer** (`firebase.ts`, `notesRepository.ts`, `searchService.ts`, `exportService.ts`, and corresponding unit tests). *Gate:* `npm test` runs with 100% pass on services.
  * **Phase 3: Reactive State & Custom Hooks** (`useAuth.ts`, `useNotes.ts`, `useSearch.ts`, `useDraftBuffer.ts`, and corresponding hook tests). *Gate:* Hook test suite passes.
  * **Phase 4: UI Components & App Assembly** (`AuthGuard`, `Header`, `SyncBadge`, `NoteEditor`, `SearchBar`, `NoteList`, `NoteCard`, `BackupModal`, `App.tsx`, `main.tsx`). *Gate:* Component tests pass; `npm run build` generates `dist/`.
  * **Phase 5: Security, CI/CD & Deploy Pipeline** (`firestore.rules`, `.github/workflows/deploy.yml`). *Gate:* CI workflow linter and build simulation pass.

---

### 2. Missing Core Runtime & Routing Dependency (`react-router-dom`) - Severity: Blocker
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Lines 262–264 (`package.json`) and Line 348 (`src/main.tsx`)
* **Discrepancy Description**: Line 348 states that `src/main.tsx` renders `App` wrapped in `HashRouter`, and Section 8 (Line 207) prescribes `HashRouter` from React Router. However, `react-router-dom` is completely omitted from the dependencies list in `package.json` (Line 264). Following the plan sequentially leads to an unresolvable module compilation error upon implementing `src/main.tsx`.
* **Rationale & Recommendation**: Add `react-router-dom` explicitly to the production `dependencies` in `package.json` at Line 264.

---

### 3. Zero-Decision Violation: Search Engine Implementation Ambiguity - Severity: Blocker
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** Lines 297–299 (`src/services/searchService.ts`)
* **Discrepancy Description**: Line 299 states: *"Construção de índice invertido (`MiniSearch` ou Map de tags), método `search(query, selectedTags)` com suporte a interseção booleana."* Offering an "or" choice between a third-party library (`MiniSearch`) and a custom data structure (`Map<string, Set<string>>`) forces the implementer to make an architectural choice, directly violating the Zero-Decision Rule. Furthermore, `MiniSearch` is installed in `package.json` (Line 264), yet its indexing contract and fields are left undefined.
* **Rationale & Recommendation**: Resolve the ambiguity decisively in the document. Specify `MiniSearch` as the search engine, define the exact indexed fields (`fields: ['text', 'tags']`, `idField: 'id'`), document search options (`combineWith: 'AND'`, prefix matching), and provide the typed function signature:
  `searchNotes(query: string, selectedTags: string[]): NoteDocument[]`.

---

### 4. Uncalibrated Firestore Security Rules Environment Injection - Severity: Blocker
* **Reviewer Lens:** `egm-codebase-details` / `egm-implementation-readiness`
* **Affected Scope:** Lines 280–282 (`firestore.rules`) and Lines 198–200
* **Discrepancy Description**: Line 282 prescribes: *"Restrição de leitura e escrita exclusivamente ao UID do autor"*, and Line 199 defines `request.auth.uid == "COLOQUE_AQUI_O_UID_DO_AUTOR"`. Firestore security rules operate entirely server-side and cannot resolve client environment variables (`import.meta.env`). The plan provides no execution instructions for how the author's UID is injected into `firestore.rules`. Committing or deploying this placeholder causes all database operations to fail with `PERMISSION_DENIED`.
* **Rationale & Recommendation**: Define the exact operational mechanism: either specify a build/pre-deploy script (e.g., `scripts/build-rules.mjs` that reads `AUTHOR_UID` and templates `firestore.rules`) or document that the author's actual Firebase UID must be directly hardcoded into `firestore.rules` prior to deployment.

---

### 5. Severe Test Coverage Plan Deficit Against Standard - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** Lines 350–366 (`Suíte de Testes Automatizados`) and Line 370 (`Verification Plan`)
* **Discrepancy Description**: The Verification Plan (Line 370) requires $\ge 80\%$ test coverage in branches and lines across all service modules and custom hooks. However, the plan only specifies 5 test files, covering 2 of 4 services and 1 of 4 hooks. The following critical business modules have zero test files scheduled:
  * `src/services/exportService.ts`
  * `src/hooks/useAuth.ts`
  * `src/hooks/useNotes.ts`
  * `src/hooks/useSearch.ts`
  An implementer cannot reach 80% coverage without inventing unapproved test files.
* **Rationale & Recommendation**: Add the missing test files to Section 5 (`Suíte de Testes Automatizados`):
  * `src/__tests__/exportService.test.ts` (JSON formatting, Markdown YAML frontmatter generation, ZIP archive compilation).
  * `src/__tests__/useAuth.test.ts` (Login flow, logout, unauthorized UID blocking and state reset).
  * `src/__tests__/useNotes.test.ts` (Firestore snapshot synchronization, optimistic updates, conflict branching).
  * `src/__tests__/useSearch.test.ts` (Debounced query processing, multi-tag intersection, memoization).

---

### 6. Missing Critical DevDependencies and Test Runner Infrastructure - Severity: Major
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Lines 262–264 (`package.json`)
* **Discrepancy Description**: Line 264 fails to specify essential devDependencies required by TypeScript, Vitest, and ESLint:
  * `@types/react`, `@types/react-dom`, `@types/node` (TypeScript build will fail in strict mode).
  * `@vitest/coverage-v8` (Mandatory for `npm test -- --coverage` at Line 370).
  * `jsdom` (Mandatory for Vitest browser environment at Line 267).
  * `@testing-library/jest-dom` and `@testing-library/user-event` (Mandatory for DOM matchers and user event simulation in component tests).
  * `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` (Mandatory for `npm run lint` at Line 371).
* **Rationale & Recommendation**: Explicitly split `package.json` into production `dependencies` and development `devDependencies`, listing all required typing and testing packages.

---

### 7. Missing Linter and Test Setup Configuration Files in Target Scope - Severity: Major
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Lines 261–286 (`Target Files to Create/Modify`)
* **Discrepancy Description**: Line 371 mandates `npm run lint com ESLint`, and Line 267 specifies a `jsdom` environment with testing libraries. However, no ESLint configuration file (`eslint.config.js` or `.eslintrc.cjs`) nor Vitest test setup file (`src/test/setup.ts` for registering `@testing-library/jest-dom` matchers) are included in the Target Files list.
* **Rationale & Recommendation**: Add `eslint.config.js` and `src/test/setup.ts` to Subsection 1 (`Configuração do Projeto e Build`) with their concrete scope and responsibilities.

---

### 8. Incomplete `.env.example` Specification Contradicting Client Initialization - Severity: Major
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Lines 277–279 (`.env.example`) vs Lines 154–161 (`firebaseConfig`)
* **Discrepancy Description**: Line 279 states that `.env.example` contains only `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_AUTHOR_UID`. However, the architecture's Firebase initialization snippet (Lines 154–161) requires:
  `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID`. Without `VITE_FIREBASE_AUTH_DOMAIN`, Firebase Auth popups fail.
* **Rationale & Recommendation**: Update Line 279 to list all 7 environment variables consumed by `src/services/firebase.ts`.

---

### 9. Undefined Conflict Resolution Algorithm and Repository Method Signatures - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** Lines 294–296 (`src/services/notesRepository.ts`)
* **Discrepancy Description**: Line 296 specifies: *"lógica de ramificação de nota em caso de conflito de timestamp"*. Firestore client SDK `setDoc` and `updateDoc` do not automatically branch on timestamp mismatches. The plan omits:
  1. The exact TypeScript method signatures (`createNote(note: Omit<NoteDocument, 'id'>): Promise<string>`, `updateNote(note: NoteDocument, baseUpdatedAt: number): Promise<void>`).
  2. How remote modification is detected prior to write.
  3. The exact payload structure generated for the conflict copy (`isConflict: true`, `conflictOriginId: note.id`).
* **Rationale & Recommendation**: Provide the full TypeScript interface signature for `NotesRepository` and define the deterministic conflict resolution routine.

---

### 10. Missing CI/CD Secrets Injection and GitHub Pages Prerequisites - Severity: Major
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Lines 283–285 (`.github/workflows/deploy.yml`)
* **Discrepancy Description**: Vite bakes environment variables (`import.meta.env.*`) at build time (`npm run build`). Line 285 fails to specify passing GitHub repository secrets (`secrets.VITE_FIREBASE_API_KEY`, etc.) into the CI build environment step. Deploying without secrets produces a broken bundle with undefined credentials. Furthermore, `actions/deploy-pages` requires prior execution of `actions/configure-pages` and `actions/upload-pages-artifact` with workflow permissions `pages: write` and `id-token: write`.
* **Rationale & Recommendation**: Detail the CI workflow steps including job permissions, configuration actions, and secret-to-env mapping for the `npm run build` step.

---

### 11. Subjective UI Framing and Marketing Fluff - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Line 273, Line 336, Line 341
* **Discrepancy Description**: Several descriptions use subjective or promotional wording instead of direct technical specifications:
  * Line 273: *"paleta neutra e tipografia legível"* (subjective styling fluff).
  * Line 336: *"estado vazio amigável"* (subjective persona descriptor).
  * Line 341: *"Painel de exportação de dados em um clique"* (promotional fluff).
* **Rationale & Recommendation**: Editorial Action: `CALIBRATE`. Replace with factual descriptions:
  * Line 273: "Configuração de classes utilitárias de tipografia sans-serif e escala monocromática (gray-50 a gray-900)."
  * Line 336: "Renderiza mensagem 'Nenhuma nota encontrada' e botão de reset de filtros quando o resultado for vazio."
  * Line 341: "Janela modal com botões de acionamento para exportação JSON e download de arquivo Markdown ZIP."

---

### 12. Uncalibrated Claim on Test Coverage Scope - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Line 370 (`Verification Plan`)
* **Discrepancy Description**: Line 370 asserts a requirement of $\ge 80\%$ branch and line coverage across all services and hooks, yet the document fails to schedule test files for 5 of those 8 units. Asserting a coverage gate without specifying the test files that satisfy it is uncalibrated.
* **Rationale & Recommendation**: Editorial Action: `CALIBRATE`. Align the Verification Plan text with the comprehensive list of test files established in Major 1.

---

### 13. Ambiguous Note Editing State Flow in Component Hierarchy - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** Line 330 (`src/components/NoteEditor.tsx`) and Line 339 (`src/components/NoteCard.tsx`)
* **Discrepancy Description**: Line 339 notes that `NoteCard` contains an "Editar" button, but Line 330 does not define how `NoteEditor` receives a note for editing, nor whether `NoteEditor` supports an editing mode versus creation mode.
* **Rationale & Recommendation**: Document that `NoteEditor` accepts `selectedNote?: NoteDocument | null` and `onSave: (note: Partial<NoteDocument>) => Promise<void>`, resetting to creation mode upon completion.

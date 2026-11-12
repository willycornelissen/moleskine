# Goldfish Annotated Review Report

Status: resolved
**Target:** `docs/designs/personal_journal.md` (`full file`, Lines 1–376)

## Prioritized Findings & AI Suggestions

### ACT-01: Infeasible Offline Conflict Branching under Native Firestore SDK [`egm-zoom-out` & `egm-design`] - Severity: Blocker
*   **Affected Scope:** [Lines 179–187](docs/designs/personal_journal.md#L179-L187) (`### 6. Resolução de Conflitos Offline e Integridade de Dados`), [Lines 130–131](docs/designs/personal_journal.md#L130-L131) (`NoteDocument`), [Lines 294–296](docs/designs/personal_journal.md#L294-L296) (`notesRepository.ts`), [Lines 354–356](docs/designs/personal_journal.md#L354-L356) (`notesRepository.test.ts`)
*   **Discrepancy Description:** The specification mandates a custom branching conflict resolution strategy: *"Ao sincronizar, o cliente compara o timestamp updatedAt do documento recebido com a versão local base. Caso o documento tenha sido modificado remotamente... ramifica a alteração local como uma nota independente: [Cópia de Conflito...]"*. Under Firebase Web SDK with `persistentLocalCache`, offline mutations enqueued in IndexedDB are pushed directly via Last-Write-Wins (LWW) without pre-commit interception hooks, and Firestore transactions fail offline (`unavailable`). For a single-user personal journal (Non-Goal NG1), distributed conflict branching is unfeasible and represents a YAGNI violation.
*   **Rationale:** Eliminates impossible synchronization hooks, prevents data loss confusion, and adheres to clean architecture principles.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:** Standardize explicitly on Firestore's native Last-Write-Wins (LWW) resolution based on `updatedAt`. Remove `isConflict` and `conflictOriginId` from `NoteDocument`. Rely on `useDraftBuffer` in `localStorage` for preserving in-flight drafts during editing.
*   ***Proposed Edit:***
    *   Location: Section 6 (`### 6. Resolução de Conflitos Offline e Integridade de Dados`)
    *   Change: Replace Section 6 with:
        ```markdown
        ### 6. Resolução de Conflitos e Integridade de Dados

        Por se tratar de uma aplicação de usuário único (Não-Meta NG1) com persistência nativa offline via `persistentLocalCache`, as atualizações concorrentes seguem o modelo determinístico nativo do Firestore:
        * **Resolução Last-Write-Wins (LWW):** O Firestore aplica a última gravação recebida baseada no timestamp `updatedAt`.
        * **Proteção de Rascunhos em Edição:** O hook `useDraftBuffer` retém continuamente o texto digitado no `localStorage`. Caso uma aba seja fechada ou a conexão caia durante a digitação, o texto local é restaurado sem perda de dados.
        * **Eliminação de Ramificação Redundante:** Não são mantidas cópias duplicadas de conflito (`isConflict`), preservando a integridade da linha do tempo do diário sem poluição de dados.
        ```
        And remove `isConflict` and `conflictOriginId` from `NoteDocument` in Section 3.

---

### ACT-02: Cold Start Quota Exhaustion under Firebase Spark Plan [`egm-design` & `egm-zoom-out`] - Severity: Blocker
*   **Affected Scope:** [Lines 26–28](docs/designs/personal_journal.md#L26-L28) (Goal G4), [Lines 171–178](docs/designs/personal_journal.md#L171-L178) (`### 5. Mecânica de Busca em Memória e Economia de Cotas`)
*   **Discrepancy Description:** Subscribing to the entire `/notes` collection across 10,000 notes causes 10,000 document reads in a single cold start (new device, incognito window, cleared cache). 5 cold reloads exhaust the entire 50,000 daily read limit of the Firebase Spark plan.
*   **Rationale:** Protects the zero-cost guarantee of Goal G4 and avoids application downtime.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:** Scope the default active listener to the 200 most recent notes ordered by `updatedAt desc`. Subsequent accesses are served at zero read cost from the IndexedDB cache. Provide an explicit button to load earlier history if required.
*   ***Proposed Edit:***
    *   Location: Section 5 (`### 5. Mecânica de Busca em Memória e Economia de Cotas`)
    *   Change: Update Section 5 to mandate:
        ```markdown
        1. **Consulta Delimitada do Conjunto Ativo (Working Set):** O listener inicial do Firestore assina apenas as 200 notas mais recentes:
           `query(collection(db, 'notes'), orderBy('updatedAt', 'desc'), limit(200))`
           Isso garante que um carregamento a frio em dispositivo sem cache consuma no máximo 200 leituras (0,4% da cota diária do plano Spark).
        2. **Reutilização de Cache IndexedDB:** Uma vez carregadas no IndexedDB local, leituras subsequentes e recarregamentos de página são atendidos diretamente pelo cache sem custo de requisições de rede.
        3. **Carregamento sob Demanda de Histórico Antigo:** A interface inclui ação explícita ("Carregar notas anteriores") para recuperar páginas anteriores caso o usuário busque registros com mais de 200 entradas.
        ```

---

### ACT-03: Missing Firestore Rules CI/CD Deployment & User-Scoped Paths [`egm-design`, `egm-codebase-details`, `egm-zoom-out`] - Severity: Blocker
*   **Affected Scope:** [Lines 188–213](docs/designs/personal_journal.md#L188-L213) (Sections 7 & 8), [Lines 280–286](docs/designs/personal_journal.md#L280-L286) (`firestore.rules` & `deploy.yml`)
*   **Discrepancy Description:** The security snippet hardcodes `"COLOQUE_AQUI_O_UID_DO_AUTOR"`, and `.github/workflows/deploy.yml` only deploys static assets to GitHub Pages. It has zero capability to deploy `firestore.rules` to Cloud Firestore. Changes to rules will never reach production, leaving the database unconfigured or expired.
*   **Rationale:** Enforces production database security without hardcoding static strings or manual console uploads.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:** Structure documents under `/users/{userId}/notes/{noteId}` with `request.auth.uid == userId`, and add a dedicated CI/CD step in GitHub Actions using `w9jds/firebase-action` with `FIREBASE_TOKEN` to deploy rules automatically.
*   ***Proposed Edit:***
    *   Location: Section 7 (`firestore.rules`) & Section 8 (`deploy.yml`)
    *   Change: Replace rules snippet with:
        ```javascript
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /users/{userId}/notes/{noteId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }
          }
        }
        ```
        And update Section 8 and `deploy.yml` description to include:
        `Deploy de Regras no Firebase: Execução de 'firebase deploy --only firestore:rules' autenticado via secret FIREBASE_TOKEN.`

---

### ACT-04: Missing Execution Phasing & Dependency Checkpoints [`egm-implementation-readiness`] - Severity: Blocker
*   **Affected Scope:** [Lines 257–366](docs/designs/personal_journal.md#L257-L366) (`Detailed Implementation Plan`)
*   **Discrepancy Description:** The implementation plan presents a flat list of 32 files without dependency order or testable milestones, violating the Implementation Readiness Standard.
*   **Rationale:** Establishes unambiguous build order and verified checkpoints for implementation subagents.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:** Reorganize the target files into 5 sequential phases, each with its explicit verification gate.
*   ***Proposed Edit:***
    *   Location: Section `## Detailed Implementation Plan`
    *   Change: Restructure into:
        *   **Fase 1: Infraestrutura, Configurações e Contratos Base** (`package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `.env.example`, `eslint.config.js`, `src/test/setup.ts`, `src/types/note.ts`). *Gate:* `npx tsc --noEmit`.
        *   **Fase 2: Serviços, Acesso a Dados e Testes Unitários** (`src/services/firebase.ts`, `src/services/notesRepository.ts`, `src/services/searchService.ts`, `src/services/exportService.ts`, `src/__tests__/notesRepository.test.ts`, `src/__tests__/searchService.test.ts`, `src/__tests__/exportService.test.ts`). *Gate:* `npm test` 100% verde nos serviços.
        *   **Fase 3: Estado Reativo, Custom Hooks e Testes** (`src/hooks/useAuth.ts`, `src/hooks/useNotes.ts`, `src/hooks/useSearch.ts`, `src/hooks/useDraftBuffer.ts`, `src/hooks/useHashFilter.ts`, `src/__tests__/useAuth.test.ts`, `src/__tests__/useNotes.test.ts`, `src/__tests__/useSearch.test.ts`, `src/__tests__/useDraftBuffer.test.ts`). *Gate:* Testes de hooks aprovados.
        *   **Fase 4: Componentes de Interface e Montagem da SPA** (`AuthGuard.tsx`, `Header.tsx`, `SyncBadge.tsx`, `NoteEditor.tsx`, `SearchBar.tsx`, `NoteList.tsx`, `NoteCard.tsx`, `BackupModal.tsx`, `App.tsx`, `main.tsx`, e testes de componentes). *Gate:* `npm run build` gerando `dist/` sem erros.
        *   **Fase 5: Regras de Segurança, CI/CD e Publicação** (`firestore.rules`, `.github/workflows/deploy.yml`). *Gate:* Validação da esteira CI e deploy estático.

---

### ACT-05: Premature Optimization: Eliminate `minisearch` and Inverted Index Over-Engineering [`egm-zoom-out`, `egm-implementation-readiness`] - Severity: Major
*   **Affected Scope:** [Lines 171–178](docs/designs/personal_journal.md#L171-L178), [Line 264](docs/designs/personal_journal.md#L264), [Lines 297–299](docs/designs/personal_journal.md#L297-L299), [Lines 311–313](docs/designs/personal_journal.md#L311-L313)
*   **Discrepancy Description:** The design introduces `minisearch` and custom `Map` inverted indices, creating duplicate state, memory overhead, and implementation ambiguity ("MiniSearch ou Map de tags"). For up to 10,000 plain text notes, native `notes.filter(...)` with `useMemo` executes in $<6$ ms on V8 without external libraries.
*   **Rationale:** Eliminates external dependencies, cuts bundle size, and prevents cache desynchronization.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:** Remove `minisearch` from dependencies. Implement search and tag filtering directly via `useMemo` and pure TypeScript filtering in `searchService.ts` / `useSearch.ts`.
*   ***Proposed Edit:***
    *   Location: Section 5, `package.json`, and `searchService.ts`
    *   Change: Remove `minisearch`. Define `searchNotes(notes: NoteDocument[], query: string, selectedTags: string[]): NoteDocument[]` using native array filtering with case-insensitive substring and tag intersection.

---

### ACT-06: Removal of `react-router-dom` Bloat in Favor of Native `useHashFilter` [`egm-zoom-out`, `egm-codebase-details`] - Severity: Major
*   **Affected Scope:** [Lines 207–208](docs/designs/personal_journal.md#L207-L208), [Line 264](docs/designs/personal_journal.md#L264), [Line 348](docs/designs/personal_journal.md#L348)
*   **Discrepancy Description:** Mandating `HashRouter` from `react-router-dom` adds 30 kB to the bundle for a single-page view with one tag query parameter, and `react-router-dom` was omitted from `package.json`.
*   **Rationale:** Saves 30 kB of bundle size and eliminates unnecessary dependency churn.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:** Replace `react-router-dom` with a lightweight custom hook `useHashFilter.ts` (~15 lines) listening to browser `hashchange`.
*   ***Proposed Edit:***
    *   Location: Section 8 and `main.tsx`
    *   Change: Remove `HashRouter`. Use `useHashFilter` to sync `#/tag/:tagName` directly with URL hash.

---

### ACT-07: Code-Splitting of `jszip` to Protect Initial Bundle Budget [`egm-zoom-out`, `egm-design`] - Severity: Major
*   **Affected Scope:** [Line 249](docs/designs/personal_journal.md#L249), [Line 264](docs/designs/personal_journal.md#L264), [Lines 300–302](docs/designs/personal_journal.md#L300-L302), [Lines 340–342](docs/designs/personal_journal.md#L340-L342)
*   **Discrepancy Description:** Statically bundling `jszip` (~35 kB gzipped) on the initial load path risks exceeding the strict 250 kB initial bundle budget for a monthly export task.
*   **Rationale:** Keeps initial render lean and preserves first-contentful-paint latency.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:** Dynamically import `jszip` via `const JSZip = (await import('jszip')).default` inside `exportService.ts` on demand when the user opens `BackupModal`.
*   ***Proposed Edit:***
    *   Location: Section Non-Functional Requirements & `exportService.ts`
    *   Change: Explicitly note dynamic import for `jszip` and lazy loading of `BackupModal`.

---

### ACT-08: Complete Test Coverage Schedule for $\ge 80\%$ Target [`egm-implementation-readiness`] - Severity: Major
*   **Affected Scope:** [Lines 350–366](docs/designs/personal_journal.md#L350-L366) (`Suíte de Testes`)
*   **Discrepancy Description:** Only 5 test files were listed, leaving `exportService`, `useAuth`, `useNotes`, and `useSearch` without test contracts, making the 80% coverage requirement impossible to fulfill without unapproved additions.
*   **Rationale:** Guarantees comprehensive behavioral test coverage adhering to ECC TDD standards.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:** Add `src/__tests__/exportService.test.ts`, `src/__tests__/useAuth.test.ts`, `src/__tests__/useNotes.test.ts`, and `src/__tests__/useSearch.test.ts` to the target files schedule.
*   ***Proposed Edit:***
    *   Location: Detailed Implementation Plan, Subseção 5
    *   Change: Add entries for the 4 missing test modules.

---

### ACT-09: Complete DevDependencies, ESLint Config and Test Setup [`egm-codebase-details`] - Severity: Major
*   **Affected Scope:** [Lines 262–264](docs/designs/personal_journal.md#L262-L264) (`package.json`)
*   **Discrepancy Description:** `package.json` omitted required packages: `@types/react`, `@types/react-dom`, `@types/node`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/jest-dom`, and config files `eslint.config.js` and `src/test/setup.ts`.
*   **Rationale:** Prevents build breaks in strict TypeScript and Vitest execution.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:** Explicitly itemize `devDependencies` in `package.json` and add `eslint.config.js` and `src/test/setup.ts` to Phase 1 target files.
*   ***Proposed Edit:***
    *   Location: `package.json` entry and Phase 1 files
    *   Change: Include full typing and testing packages and setup files.

---

### ACT-10: Complete `.env.example` Variable List [`egm-codebase-details`] - Severity: Major
*   **Affected Scope:** [Lines 277–279](docs/designs/personal_journal.md#L277-L279) (`.env.example`)
*   **Discrepancy Description:** Only 3 variables were listed, whereas `firebase.ts` initialization requires 7 variables (`VITE_FIREBASE_AUTH_DOMAIN`, etc.).
*   **Rationale:** Prevents runtime authentication popup crashes.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:** Update `.env.example` to enumerate all 7 Firebase environment variables.
*   ***Proposed Edit:***
    *   Location: Item `.env.example`
    *   Change: List `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_AUTHOR_UID`.

---

### ACT-11: Add Mandatory `## Risks & Mitigations` Section [`egm-structural`, `egm-zoom-out`] - Severity: Nit
*   **Affected Scope:** Root Document Structure
*   **Discrepancy Description:** Missing dedicated `## Risks & Mitigations` section required by the EGM Feature Spec Standard.
*   **Rationale:** Consolidates operational failure modes into an explicit mitigation matrix.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:** Add `## Risks & Mitigations` mapping Spark quota limits, write conflicts, browser storage eviction, and auth lockout to concrete mitigations.
*   ***Proposed Edit:***
    *   Location: Between `Non-Functional Requirements` and `Detailed Implementation Plan`
    *   Change: Insert `## Risks & Mitigations` section.

---

### ACT-12: Resolve Settled Open Questions [`egm-structural`, `egm-comprehension`] - Severity: Nit
*   **Affected Scope:** [Lines 38–42](docs/designs/personal_journal.md#L38-L42) (`## Open Questions`)
*   **Discrepancy Description:** Questions regarding tag lowercase normalization and draft saving are already decided in the document.
*   **Rationale:** Eliminates ambiguity for downstream implementation.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:** Remove the decided questions from `## Open Questions` and document them as settled architectural choices.
*   ***Proposed Edit:***
    *   Location: `## Open Questions`
    *   Change: State "Nenhuma questão técnica em aberto; premissas consolidadas nas seções 2 e 5."

---

### ACT-13: Standardize on Firestore Client Auto-ID [`egm-zoom-out`, `egm-comprehension`] - Severity: Nit
*   **Affected Scope:** [Line 124](docs/designs/personal_journal.md#L124) (`NoteDocument`)
*   **Discrepancy Description:** Mentions `UUID v4 ou Firestore Doc ID` ambiguously.
*   **Rationale:** Eliminates external `uuid` dependency.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:** Standardize on `doc(collection(db, 'notes')).id`.
*   ***Proposed Edit:***
    *   Location: Section 3 `NoteDocument`
    *   Change: `id: string; // ID gerado nativamente pelo Firestore client SDK via doc(collection(db, 'notes')).id`.

---

### ACT-14: Calibrate Latency SLA and Debounce Timers [`egm-style`] - Severity: Nit
*   **Affected Scope:** Lines 26, 53, 247, 248
*   **Discrepancy Description:** Inconsistent numerical targets (50ms vs 10ms for search; 500ms vs 300ms for debounce).
*   **Rationale:** Enforces numerical precision and consistency.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:** Standardize on search latency $\le 15\text{ ms}$ (95º percentil) and draft buffer debounce de $300\text{ ms}$.
*   ***Proposed Edit:***
    *   Location: Goals, CUJ 2, Non-Functional Requirements
    *   Change: Unify to $\le 15\text{ ms}$ and $300\text{ ms}$.

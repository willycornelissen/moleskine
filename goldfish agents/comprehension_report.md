# Comprehension Test Report

**Target File:** `/home/willycornelissen/Desktop/Dablio/moleskine/docs/designs/personal_journal.md`  
**Feature Range:** Lines 1–256  
**Detailed Range:** Lines 257–376  
**Mode:** REVIEW  

---

### What this proposes
The document proposes `moleskine`, a single-user, offline-first personal notes web application built as a React and Vite Single Page Application (SPA) deployed statically to GitHub Pages. It relies on Cloud Firestore configured with client-side IndexedDB multi-tab caching (`persistentLocalCache`) to provide zero-cost persistence and seamless reading and writing while disconnected from the internet. Data access is restricted strictly to a single author through Google Authentication and Firestore security rules matching the author's unique UID. The application provides sub-10ms client-side full-text search and tag filtering via in-memory indexing, an automatic draft buffer in `localStorage`, and single-click export of notes to structured JSON and Markdown-in-ZIP files.

### How the existing system works, per this document
Per this document, there is no pre-existing codebase or live deployment of `moleskine`—it is a greenfield architectural proposal. The document contrasts its proposed model against the author's current pain points with existing tools: local tools like Obsidian and Logseq require native device installations and complex synchronization setups, cloud platforms like Notion and Evernote are resource-heavy and internet-dependent, and simple browser `localStorage` solutions lack cloud backup and cross-device continuity. `moleskine` is designed from scratch to bridge this gap with immediate browser accessibility, offline resilience, and zero infrastructure cost.

---

### Findings

#### Finding 1
* **Severity:** Major
* **Affected Scope:** Section 6 (Resolução de Conflitos Offline e Integridade de Dados, lines 179–187) and Detailed Implementation Plan items 11 & 29 (`notesRepository.ts` & `notesRepository.test.ts`, lines 294–296, 354–356).
* **Discrepancy Description & Rationale:** *Vague Explanation of Offline Conflict Interception under Firestore SDK.*  
The document states that when notes are edited offline across multiple devices, the client compares the incoming document's `updatedAt` with the local base version upon sync and branches conflicting local changes into a separate `[Cópia de Conflito]` note. However, because persistence is configured directly with Firebase Firestore's native `persistentLocalCache` (lines 164–168), the Firebase JS SDK internally queues mutations in IndexedDB and automatically syncs them to the server upon reconnection using last-write-wins. The document does not explain how the client intercepts or preempts Firestore SDK's automatic write queue before the local write overwrites the remote document, nor does it specify whether writes are staged in an application-level store prior to Firestore commits. A new team member cannot implement this without unstated synchronization architecture details.

#### Finding 2
* **Severity:** Major
* **Affected Scope:** Section 7 (Regras de Segurança do Firestore, lines 188–203), Section 8 (Pipeline de Deploy, lines 208–213), and Detailed Implementation Plan items 7 & 8 (`firestore.rules` and `.github/workflows/deploy.yml`, lines 280–286).
* **Discrepancy Description & Rationale:** *Assumed Workflow Prerequisites for Deploying Security Rules.*  
The document provides the configuration for `firestore.rules` containing a placeholder string (`"COLOQUE_AQUI_O_UID_DO_AUTOR"`), and references `VITE_AUTHOR_UID` in `.env.example`. However, the CI/CD pipeline (`deploy.yml`) is specified solely to install dependencies, run Vitest, build with Vite, and deploy static assets to GitHub Pages via `actions/deploy-pages`. There is no workflow, script, or documentation detailing how `firestore.rules` is provisioned to Cloud Firestore (e.g., via `firebase-tools` CLI in CI or manual upload in the Firebase Console), nor how the placeholder UID is populated into the security rules file. A fresh reader has no operational instructions for establishing the backend security perimeter.

#### Finding 3
* **Severity:** Nit
* **Affected Scope:** Section "Open Questions" (lines 38–42) vs. Section 2 (lines 104–106), Section 3 (line 126), Non-Functional Requirements (line 248), and Detailed Implementation Plan (lines 314–316, 330, 365).
* **Discrepancy Description & Rationale:** *Inconsistency Between Open Questions and Detailed Technical Specifications.*  
The "Open Questions" section asks whether tags should be normalized to lowercase and whether saving should be debounced or explicit. However, later sections already specify both decisions: tags are explicitly defined as automatically lowercased (`lowercase`, lines 104, 126, 330, 365), and saving is defined as a hybrid mechanism (a continuous draft buffer debounced to `localStorage` plus an explicit button/shortcut for committing to Firestore). Retaining these as open questions introduces unnecessary ambiguity regarding whether the specification is settled. Additionally, Open Questions mentions a "debounce de 500ms" (line 41), whereas Non-Functional Requirements and `useDraftBuffer` specify a "debounce de 300ms" (lines 248, 316).

#### Finding 4
* **Severity:** Nit
* **Affected Scope:** Section 5 (Mecânica de Busca em Memória e Economia de Cotas, lines 175–177) and Detailed Implementation Plan items 1, 12, 28 (lines 264, 297–299, 351–353).
* **Discrepancy Description & Rationale:** *Ambiguity Between MiniSearch and Custom Inverted Index.*  
The technical plan states that in-memory search is performed using "o `MiniSearch` ou busca por substrings tokenizadas" (line 176) and "índice invertido (`MiniSearch` ou Map de tags)" (line 299), while `package.json` includes `minisearch`. The document should specify whether `minisearch` is the definitive library for text indexing and how it coordinates with the tag map (`Map<string, Set<string>>`), rather than leaving it as an "either/or" choice in the implementation plan.

#### Finding 5
* **Severity:** Nit
* **Affected Scope:** Section 3 (Modelo de Dados e Esquema TypeScript, line 124) and Detailed Implementation Plan item 1 (line 264).
* **Discrepancy Description & Rationale:** *Ambiguous ID Generation Strategy.*  
Line 124 defines `id: string; // Identificador único UUID v4 ou Firestore Doc ID`, but `uuid` is not listed among the project dependencies in `package.json` (line 264). The document should specify whether IDs will be generated via Firestore's client-side auto-ID generation (`doc(collection(db, 'notes')).id`) or the web platform's native `crypto.randomUUID()`.

# Goldfish Review Report (Critic Stage 7)

**Target:** `/home/willycornelissen/Desktop/Dablio/moleskine/docs/designs/personal_journal.md` (`Lines 1-256`)  
**Standard:** `feature-spec-standard`  
**Mode:** `REVIEW`  
**Report Destination:** `critic_report.md`

---

## Reviewer Status

| Reviewer | Lens Focus | Status |
| :--- | :--- | :--- |
| `egm-design` | Architecture, Scalability, Spark Quotas, Concurrency & Edge Cases | completed |
| `egm-structural` | Standard Compliance, Heading Hierarchy, Symmetry & Consistency | completed |
| `egm-style` | Objectivity, Technical Precision, Redundancy & Tone | completed |

---

## Severity Summary

| Severity | Count | Primary Areas |
| :--- | :---: | :--- |
| 🔴 **Blocker** | 3 | Offline Conflict Branching with Firestore LWW, Missing Risks & Mitigations Section, Missing Firestore Rules CI/CD Pipeline |
| 🟡 **Major** | 4 | Spark Read Quota Exhaustion on Cold Start, Contradictory Open Questions vs Implemented Decisions, In-Memory Index Heap & Main-Thread ZIP Crash, Circular Justifications in Alternatives |
| 🟢 **Nit** | 5 | Inconsistent Performance SLA (50ms vs 10ms), Debounce Timing Inconsistency (500ms vs 300ms), Untemplated Placeholder in Security Snippet, Hyperbolic Marketing Copy, Bilingual Heading Inconsistency |

---

## Prioritized Findings

### 🔴 BLOCKERS

#### 1. Infeasible Offline Conflict Branching via Native Firestore JS SDK
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** Lines 179–187 (`### 6. Resolução de Conflitos Offline e Integridade de Dados`), Lines 129–132 (`NoteDocument` schema)
* **Discrepancy Description:**  
  The specification mandates a custom branching conflict resolution strategy: *"Ao sincronizar, o cliente compara o timestamp updatedAt do documento recebido com a versão local base. Caso o documento tenha sido modificado remotamente... ramifica a alteração local como uma nota independente: [Cópia de Conflito...]"*.  
  Under standard Firebase Web SDK with `persistentLocalCache`, offline mutations enqueued in the local write queue are automatically synchronized to the server upon reconnection using an authoritative **Last-Write-Wins (LWW)** strategy. The client SDK does not expose a pre-commit sync interceptor to pause, inspect, or branch mutations queued in IndexedDB before they hit Firestore. Furthermore, Firestore offline operations do NOT support transactions (transactions fail immediately if offline). Therefore, an offline client cannot conditionally check remote document versions prior to committing.
* **Rationale & Recommendation:**  
  Relying on an unimplementable client-side conflict interception will cause silent data loss or overwrites when multi-device edits occur.  
  **Recommendation:** Explicitly define the concurrency strategy:
  1. Either accept native Firestore Last-Write-Wins (LWW) with field-level merging / timestamp check on editor load, OR
  2. Implement an append-only revision/event log pattern (e.g., storing revisions in `/notes/{noteId}/revisions/{revId}` or creating drafts as distinct documents before committing via an idempotent merge). Clarify exactly how the conflict detector intercepts out-of-order writes without breaking Firestore's native cache synchronization.

---

#### 2. Missing Mandatory "Risks & Mitigations" Section (Standard Violation)
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** Lines 1–256 (Document Root Hierarchy)
* **Discrepancy Description:**  
  The specification violates the **feature-spec-standard** (`feature-spec-standard.md`, Lines 20–24, 35–36). The standard explicitly mandates:
  > *"The specification must explicitly call out its own constraints. It must identify potential failure modes, security implications, scalability limits, and how they will be mitigated."*  
  There is no dedicated `## Risks & Mitigations` or `## Risks & Limits` section in the document.
* **Rationale & Recommendation:**  
  Risks are partially scattered under Non-Functional Requirements or assumed away. A critic or fresh engineer cannot evaluate unmitigated edge cases if failure modes (quota exhaustion, offline sync collisions, browser storage limits, single-account lockout) are not consolidated into an explicit Risks & Mitigations matrix.  
  **Recommendation:** Add a top-level `## Risks & Mitigations` section before or after `Non-Functional Requirements`, mapping key operational risks (Firestore Spark quota limits, IndexedDB eviction by browser storage pressure, data corruption, Auth account takeover) to concrete mitigations.

---

#### 3. Unprotected Firestore Database: Missing Rules Deployment in CI/CD Pipeline
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** Lines 188–213 (`### 7. Regras de Segurança do Firestore` & `### 8. Roteamento Estático e Pipeline de Deploy`)
* **Discrepancy Description:**  
  Goal G1 and Section 7 state that privacy and access control rely entirely on `firestore.rules` (`request.auth.uid == AUTHOR_UID`). However, Section 8 defines a CI/CD pipeline (`.github/workflows/deploy.yml`) that only runs `npm ci`, `npm test`, `npm run build`, and `actions/deploy-pages` to GitHub Pages.  
  GitHub Pages only serves static frontend bundles. It has zero capability to deploy Firestore security rules to Google Cloud Firebase.
* **Rationale & Recommendation:**  
  If the automated deployment pipeline does not include `firebase-tools` or `w9jds/firebase-action` with service account credentials (`FIREBASE_SERVICE_ACCOUNT_TOKEN`), changes to `firestore.rules` will never be applied to production. The database will remain in default test mode (which expires in 30 days) or default closed mode, completely breaking production security.  
  **Recommendation:** Update Section 8 to include a dedicated CI/CD job or step using Firebase CLI (`firebase deploy --only firestore:rules`) with a secure GitHub repository secret (`FIREBASE_TOKEN` or Google Cloud Workload Identity Federation).

---

### 🟡 MAJOR FINDINGS

#### 4. Cold Start Quota Exhaustion under Firebase Spark Plan
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** Lines 26–27 (Goal G3), Lines 171–178 (`### 5. Mecânica de Busca em Memória e Economia de Cotas`)
* **Discrepancy Description:**  
  Goal G3 targets up to 10,000 notes. Section 5 describes an initial synchronization where `onSnapshot` queries `/notes`. When the application is accessed on a new device, a private/incognito window, after browser cache clearance, or across different browsers, reading the entire collection from Firestore generates **10,000 document reads in a single cold start**.  
  The Firebase Spark plan has a strict free limit of **50,000 reads per day**. Five cold starts or testing refreshes will consume 100% of the daily quota, shutting down the app for 24 hours.
* **Rationale & Recommendation:**  
  Unbounded collection subscription violates Goal G4 ("Custo Zero de Infraestrutura / Plano Spark").  
  **Recommendation:**
  1. Implement pagination or lazy loading: only synchronize the most recent $N$ notes (e.g., 200–500 notes or last 90 days) by default (`query(collection(db, 'notes'), orderBy('updatedAt', 'desc'), limit(300))`).
  2. Provide an explicit "Carregar histórico completo" / "Sync completo" option for cold devices.
  3. Store note metadata (title, tags, timestamps, snippet) in a compact index document or keep note bodies lazily loaded on selection.

---

#### 5. Contradictory "Open Questions" vs Concrete Design Decisions
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** Lines 38–42 (`## Open Questions`) vs Lines 104–106 (`NoteEditor`) & Line 248 (`Non-Functional Requirements`)
* **Discrepancy Description:**  
  `## Open Questions` poses two questions as unresolved:
  * *Questão 1:* Tag lowercase normalization ("Saúde" vs "saúde").
  * *Questão 2:* Continuous auto-save with debounce vs explicit "Salvar" button.  
  However, later in the same document:
  * Line 104 explicitly resolves Questão 1: *"tags... normalizadas automaticamente em minúsculas (lowercase)"*.
  * Lines 106 & 248 explicitly resolve Questão 2: *"Botão explícito de confirmação e atalho de teclado (Ctrl + Enter)"* combined with a draft buffer saving to `localStorage` with a 300ms debounce.
* **Rationale & Recommendation:**  
  A design document at the Critic / Approval stage should not present decided architecture as open questions. This introduces confusion for implementation subagents and reviewers.  
  **Recommendation:** Remove these two entries from `## Open Questions` and replace with a "Decisões Arquiteturais Registradas" subsection, or clear the `## Open Questions` section if no unresolved design questions remain.

---

#### 6. In-Memory Search Heap & Main-Thread ZIP Export Freezes on Mobile
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** Lines 26 (Goal G3), Lines 114–117 (`BackupModal`), Lines 171–178 (`searchService`)
* **Discrepancy Description:**  
  The spec requires maintaining an in-memory inverted search index (MiniSearch) and tag mapping for up to 10,000 notes directly in browser RAM, and generating a `.zip` archive containing 10,000 individual Markdown files via JSZip in `BackupModal`.  
  On mobile devices (iOS Safari / Android Chrome), allocating full-text index structures and running synchronous JSON stringification + JSZip compression of 10,000 records on the UI main thread will cause severe frame drops, UI freezes (5–15 seconds), or browser tab eviction due to memory pressure (>100MB RAM spike).
* **Rationale & Recommendation:**  
  The specification provides no execution boundary (Web Workers) or batching for intensive CPU/memory tasks.  
  **Recommendation:**
  1. Specify that `searchService` indexes only tokenized title, tags, and first 200 characters of text rather than unbounded bodies, or offload indexing and search to a Dedicated Web Worker (`worker.ts`).
  2. Implement chunked/streaming compression with progress reporting in `exportService` to avoid blocking the main event loop.

---

#### 7. Circular Justifications and Glazing in "Alternatives Considered"
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 221, 226, 231, 236 (`## Alternatives Considered`)
* **Discrepancy Description:**  
  All four alternatives share an identical formulaic rejection prefix:  
  * *"Rejeitado pelo autor: O autor estabeleceu como requisito essencial..."*  
  * *"Rejeitado pelo autor: Contraria a restrição de custo zero..."*  
  * *"Rejeitado pelo autor: A auditoria técnica apontou duplicidade..."*  
  * *"Rejeitado pelo autor: Para um diário pessoal (< 20.000 notas)..."*  
  Attributing technical decisions to personal author mandate (*"Rejeitado pelo autor"*) is circular reasoning and appeal to authority.
* **Rationale & Recommendation:**  
  Technical specifications must be grounded in objective constraints (cost, operational complexity, latency, bandwidth, maintainability), not personal preference.  
  **Recommendation:** Refactor rejection rationales to remove the phrase *"Rejeitado pelo autor"* and frame them directly around technical trade-offs:  
  * *Ex:* *"Rejection Rationale: Incompatible with the zero-installation web requirement; requires native platform binaries and manual sync setup on mobile devices."*

---

### 🟢 NITS (Copy Clarity, Formatting & Polish)

#### 8. Inconsistent Search Latency SLA Metric
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Line 26 (Goal G3: *"inferior a 50 milissegundos"*) vs Line 53 (CUJ 2: *"em menos de 10ms"*) vs Line 173 (*"latência sub-10ms"*) vs Line 247 (*"$\le 10\text{ ms}$"*)
* **Discrepancy Description:**  
  Goal G3 specifies a performance threshold of $< 50\text{ ms}$, while CUJ 2, Section 5, and Section Non-Functional Requirements specify $< 10\text{ ms}$.
* **Rationale & Recommendation:**  
  Normalize the latency target throughout the document to a unified, measurable threshold (e.g., *"latência de filtragem $\le 15\text{ ms}$ no 95º percentil"*).

---

#### 9. Discrepancy in Keystroke Debounce Timers
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Line 41 (*"debounce de 500ms"*) vs Line 248 (*"debounce de 300 ms"*)
* **Discrepancy Description:**  
  Open Question 2 cites a 500ms debounce interval, whereas Section Non-Functional Requirements defines a 300ms debounce interval.
* **Rationale & Recommendation:**  
  Unify the specification to 300ms across all sections.

#### 10. Hyperbolic & Marketing Tone in Technical Descriptions
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 11, 20, 66, 114
* **Discrepancy Description:**  
  Phrases like *"suporte transparente a funcionamento offline"*, *"carregamento imediato"*, *"latência de interação próxima a zero"*, and *"painel de exportação em um clique"* are subjective marketing jargon.
* **Rationale & Recommendation:**  
  Replace with neutral, engineering-focused language:
  * *"suporte transparente"* $\rightarrow$ *"persistência local gerenciada pelo Firebase IndexedDB cache"*.
  * *"carregamento imediato"* $\rightarrow$ *"SPA estática com carregamento inicial otimizado via CDN"*.
  * *"próxima a zero"* $\rightarrow$ *"sem chamadas de rede bloqueantes"*.
  * *"em um clique"* $\rightarrow$ *"com acionamento direto pelo usuário"*.

#### 11. Untemplated Placeholder in Security Rules Snippet
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** Line 199 (`firestore.rules` code snippet)
* **Discrepancy Description:**  
  The snippet contains the raw string `"COLOQUE_AQUI_O_UID_DO_AUTOR"`.
* **Rationale & Recommendation:**  
  Using informal Portuguese placeholders in a production configuration snippet creates copy-paste hazards. Replace with standard configuration syntax or a parameter comment, e.g., `request.auth.uid == "${AUTHOR_UID}"; // Substituído via CI ou variável de ambiente`.

#### 12. Bilingual Heading Inconsistency
* **Reviewer Lens:** `egm-style` / `egm-structural`
* **Affected Scope:** Section Headers (Lines 9, 13, 22, 30, 38, 43, 62, 216, 240) vs Subheadings (Lines 64, 97, 118, etc.)
* **Discrepancy Description:**  
  H2 headers are in English (`## Overview`, `## The Problem`, `## Goals`, `## Technical Plan (Architecture)`), whereas all H3 headers (`### 1. Visão Geral...`, `### 2. Hierarquia...`) and all body copy are written in Portuguese.
* **Rationale & Recommendation:**  
  Adopt a consistent language strategy. Either standardize all headers to Portuguese (e.g., `## Visão Geral`, `## O Problema`, `## Objetivos`, `## Plano Técnico`), or maintain standard English headers with English subheadings.

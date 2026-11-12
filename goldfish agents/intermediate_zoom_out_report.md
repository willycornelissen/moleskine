# Goldfish Review Report: Intermediate Zoom Out Review (Stage 8)

**Target:** `/home/willycornelissen/Desktop/Dablio/moleskine/docs/designs/personal_journal.md` (`Lines 1-376`)  
**Standard:** `zoom-out-standard`  
**Mode:** `REVIEW`  
**Reviewer:** `egm-zoom-out`  
**Report Destination:** `intermediate_zoom_out_report.md`

---

## Reviewer Status

| Reviewer | Lens Focus | Status |
| :--- | :--- | :--- |
| `egm-zoom-out` | Simplicity, YAGNI, Minimal Contract, Anti-Weeds & Anti-Creep | completed |

---

## Severity Summary

| Severity | Count | Primary Areas |
| :--- | :---: | :--- |
| 🔴 **Blocker** | 2 | Rejection of Revision-Tree Creep (Enforce LWW), Cold-Start Read Quota Blowout |
| 🟡 **Major** | 4 | Rejection of Web Workers Creep & Elimination of MiniSearch, Removal of `react-router-dom` Bloat, Dynamic Import of JSZip, Missing Rules Deployment CI Step |
| 🟢 **Nit** | 4 | Standardize Firestore Client Auto-IDs, Settle Decided Open Questions, Add Mandatory Risks & Mitigations Section, Unify Latency & Debounce SLA Metrics |

---

## Prioritized Findings

### 🔴 BLOCKERS

#### 1. Infeasible Offline Conflict Branching vs. Speculative Revision Creep
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 179–187 (`6. Resolução de Conflitos Offline...`), Lines 130–131 (`NoteDocument`), Lines 294–296 (`notesRepository.ts`), Lines 354–356 (`notesRepository.test.ts`)
* **Discrepancy Description:**  
  The document attempts to build client-side conflict branching (`[Cópia de Conflito]`, `isConflict: true`) on top of Firebase's native offline cache (`persistentLocalCache`). As established in earlier reviews, Firestore JS SDK queues offline writes in IndexedDB and commits them via Last-Write-Wins (LWW) upon reconnection without exposing pre-commit interception hooks. The Critic review proposed either adopting LWW or creating an append-only revision subcollection (`/notes/{noteId}/revisions/{revId}`).  
  From a high-altitude zoom-out perspective, implementing multi-revision trees, branch merging, or subcollection synchronization for a **single-user personal journal** (Non-Goal NG1) is a textbook **YAGNI violation** and architectural feature-creep that multiplies Firestore document reads and write costs.
* **Rationale & Recommendation:**  
  1. Firmly reject the revision-tree subcollection proposal.
  2. Eliminate the custom branching conflict logic, `isConflict`, and `conflictOriginId` from `NoteDocument`.
  3. Standardize explicitly on Firestore's native **Last-Write-Wins (LWW)** model based on `updatedAt`.
  4. Protect uncommitted in-flight thoughts through the existing lightweight `useDraftBuffer` in `localStorage`. This solves 100% of real single-user loss scenarios without adding distributed consensus complexity.

---

#### 2. Cold-Start Collection Query Threatening Zero-Cost Quota (Goal G4)
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Goal G4 (Lines 27–28), Section 5 (Lines 171–178), Section 11 (`notesRepository.ts`, Lines 294–296)
* **Discrepancy Description:**  
  Goal G3 targets up to 10,000 notes. Section 5 specifies that `onSnapshot` subscribes to the collection `/notes`. On any cold device, private browsing session, or cleared cache, this unbounded query triggers **10,000 document reads immediately**. The Firebase Spark tier allows **50,000 reads/day**. Just five cold loads exhaust the entire daily quota, completely breaking Goal G4 ("Custo Zero de Infraestrutura").
* **Rationale & Recommendation:**  
  Preserve high-altitude simplicity without engineering a heavy paginated cursor state machine:
  1. Scope the default initial listener to the recent working set: `query(collection(db, 'notes'), orderBy('updatedAt', 'desc'), limit(200))`.
  2. For a personal diary, 98% of interactions involve recent notes. Once loaded, the IndexedDB cache retains them with zero subsequent read cost.
  3. Provide an explicit, on-demand action ("Carregar histórico anterior") only when the user searches or navigates past the cached window.

---

### 🟡 MAJOR FINDINGS

#### 3. Rejection of Web Workers Creep & Elimination of `minisearch` Bloat
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Section 5 (Lines 171–178), `package.json` (Line 264), `searchService.ts` (Lines 297–299), `useSearch.ts` (Lines 311–313)
* **Discrepancy Description:**  
  The spec specifies `minisearch`, a secondary in-memory `Map<string, Set<string>>` index, and incremental diff listeners. In response to potential mobile CPU freezes, the Critic stage proposed adding Dedicated Web Workers (`worker.ts`).  
  From a high-altitude perspective, introducing Web Workers, message-passing serialization, worker build plugins, and multi-thread state sync is an **anti-weed trap caused by premature optimization**. For 10,000 plain-text journal notes (~300 characters each), total payload is ~3 MB. In modern V8/JavaScript runtimes, an un-indexed native array filter (`notes.filter(...)`) executes across 10,000 items in under **4 to 6 milliseconds** on the main thread.
* **Rationale & Recommendation:**  
  1. Reject Web Workers entirely.
  2. Drop `minisearch` and custom `Map` inverted indices from dependencies and design.
  3. Implement search and tag filtering as a pure, memoized computation (`useMemo`) over the in-memory array of loaded notes.
  4. This satisfies Goal G3 (<50ms latency), cuts bundle size by ~15 kB, eliminates multi-index desynchronization bugs, and keeps the data pipeline minimalist.

---

#### 4. Removal of `react-router-dom` Bloat in Favor of Native Hash Hook
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Section 8 (Lines 207–208), `package.json` (Line 264), `main.tsx` (Line 348)
* **Discrepancy Description:**  
  The document mandates `HashRouter` from React Router, yet `react-router-dom` is omitted from `package.json`. More importantly, the entire application consists of a single primary view with one interactive state parameter (`tag`). Importing the 30 kB `react-router-dom` bundle for this purpose violates YAGNI and unnecessarily consumes 12% of the strict 250 kB gzipped bundle budget.
* **Rationale & Recommendation:**  
  1. Do not add `react-router-dom`.
  2. Implement a 15-line custom hook (`useHashFilter.ts`) that listens to the native browser `hashchange` event and reads/sets `window.location.hash` (e.g., `#/tag/viagem`).
  3. This provides 100% static GitHub Pages URL shareability with zero dependencies.

---

#### 5. Critical Path Bundle Protection via Dynamic Import of `jszip`
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Line 249 (`Bundle Size`), Line 264 (`package.json`), Lines 300–302 (`exportService.ts`), Lines 340–342 (`BackupModal.tsx`)
* **Discrepancy Description:**  
  Non-Functional Requirements set a strict limit of $<250$ kB gzipped for the initial JavaScript bundle. Statically importing `jszip` (~35 kB gzipped) on the initial load path for an export operation used once a month wastes critical first-contentful-paint bandwidth.
* **Rationale & Recommendation:**  
  Apply code-splitting: lazy-load `BackupModal` and dynamically import `jszip` inside `exportService.ts` (`const JSZip = (await import('jszip')).default`). This keeps the initial critical path lean and well within the 250 kB ceiling.

---

#### 6. Missing Automated Rules Deployment in CI/CD Workflow
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Section 7 (Lines 188–203), Section 8 (Lines 208–213), Detailed Plan item 8 (`deploy.yml`, Lines 283–286)
* **Discrepancy Description:**  
  Goal G1 places 100% of the database security boundary on `firestore.rules`. However, `.github/workflows/deploy.yml` only deploys static frontend assets to GitHub Pages. It completely lacks a deployment step for Firestore security rules, leaving the cloud database unconfigured or expired in test mode.
* **Rationale & Recommendation:**  
  Add a concise deployment step to `.github/workflows/deploy.yml` using `w9jds/firebase-action` or `firebase-tools` with a repository secret `FIREBASE_TOKEN` (`firebase deploy --only firestore:rules`). In addition, structure rules under user-scoped paths (`/users/{userId}/notes/{noteId}`) with `request.auth.uid == userId` to avoid maintenance-heavy hardcoded UID strings.

---

### 🟢 NITS (Simplicity Polish & Standard Alignment)

#### 7. Ambiguous ID Generation Strategy
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Line 124 (`NoteDocument`), Line 264 (`package.json`)
* **Discrepancy Description:**  
  Line 124 states `UUID v4 ou Firestore Doc ID`, but `uuid` is not in `package.json`.
* **Rationale & Recommendation:**  
  Standardize solely on Firestore's native client auto-ID generation: `doc(collection(db, 'notes')).id`. It is collision-resistant, generates synchronously offline, and requires zero dependencies.

---

#### 8. Formalize Settled Open Questions as Concrete Constraints
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 38–42 (`## Open Questions`) vs Lines 104–106 & Line 248
* **Discrepancy Description:**  
  `## Open Questions` asks about lowercase tag normalization and debounce vs. explicit save, but both are already decided in the document. Retaining decided topics in Open Questions creates confusion for downstream ECC planning.
* **Rationale & Recommendation:**  
  Delete the answered questions from `## Open Questions`.

---

#### 9. Add Mandatory "Risks & Mitigations" Section per Feature Spec Standard
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Root Document Structure
* **Discrepancy Description:**  
  The `feature-spec-standard` requires an explicit `## Risks & Mitigations` section. Currently, risks (Spark quota exhaustion, browser cache eviction, account lockout) are scattered.
* **Rationale & Recommendation:**  
  Add `## Risks & Mitigations` consolidating the key failure modes and their concrete mitigations.

---

#### 10. Unify Latency SLA and Debounce Timing Across Sections
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Line 26 (50ms) vs Line 53 (10ms) vs Line 247 (10ms); Line 41 (500ms) vs Line 248 (300ms)
* **Discrepancy Description:**  
  Minor numerical inconsistencies across sections.
* **Rationale & Recommendation:**  
  Standardize on:
  * Search latency: $\le 15$ ms.
  * Draft buffer debounce: $300$ ms.

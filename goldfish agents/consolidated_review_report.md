# Relatório Consolidado de Revisão EGM: Goldfish Review Swarm

**Documento Alvo:** `docs/designs/personal_journal.md`  
**Data:** 2026-11-11  
**Autor:** Willy Garabini Cornelissen  
**Modo:** `Uninterrupted Full Flow` (Estágios 5, 6, 7, 8 e 9)  

---

## 1. Visão Geral da Auditoria

O documento formal de design técnico foi submetido à auditoria rigorosa e imparcial através das 5 lentes do **Elephant-Goldfish Model (EGM)**, executadas de forma isolada em contextos independentes:

| Estágio | Nome da Etapa | Lentes / Subagentes | Escopo Auditado | Relatório de Origem | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Stage 5** | Initial Zoom Out | `egm-zoom-out`, `egm-inventive-catalyst` | Arquivo Completo (Linhas 1–376) | [zoom_out_report.md](./zoom_out_report.md) | Concluído |
| **Stage 6** | Comprehension Test | `egm-comprehension` (Leitor Ingênuo) | Feature & Detailed (1–376) | [comprehension_report.md](./comprehension_report.md) | Concluído |
| **Stage 7** | Critic Review | `egm-design`, `egm-structural`, `egm-style` | Feature Spec (Linhas 1–256) | [critic_report.md](./critic_report.md) | Concluído |
| **Stage 8** | Intermediate Zoom Out | `egm-zoom-out` | Arquivo Completo (Linhas 1–376) | [intermediate_zoom_out_report.md](./intermediate_zoom_out_report.md) | Concluído |
| **Stage 9** | Implementation Readiness | `egm-implementation-readiness`, `egm-codebase-details`, `egm-style` | Detailed Plan (Linhas 257–376) | [implementation_readiness_report.md](./implementation_readiness_report.md) | Concluído |

---

## 2. Sumário Executivo de Severidade

* 🔴 **Bloqueadores (Blockers):** 4
* 🟡 **Melhorias Maiores (Majors):** 6
* 🟢 **Apontamentos Menores (Nits):** 4
* **Total de Apontamentos Consolidados:** 14

---

## 3. Matriz de Rastreabilidade (Traceability Matrix)

| ID | Título do Item Consolidado | Severidade | Lentes Identificadoras | Estágios de Origem | Seção Afetada no Design Doc |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **ACT-01** | Padronização Concorrência Firestore LWW (Remoção Conflito Ramificado) | 🔴 Blocker | `egm-zoom-out`, `egm-design`, `egm-comprehension` | 5, 6, 7, 8 | Seção 6, Modelo de Dados, Repositório |
| **ACT-02** | Proteção de Cota Spark (Query Inicial Delimitada a 200 Notas) | 🔴 Blocker | `egm-design`, `egm-zoom-out` | 5, 7, 8 | Seção 5, Repositório, Metas G4 |
| **ACT-03** | Estruturação de Regras Firestore por Usuário & Deploy em CI/CD | 🔴 Blocker | `egm-design`, `egm-codebase-details`, `egm-zoom-out` | 6, 7, 8, 9 | Seção 7, Seção 8, `deploy.yml`, `firestore.rules` |
| **ACT-04** | Fatiamento da Implementação em 5 Fases Sequenciais com Gates | 🔴 Blocker | `egm-implementation-readiness` | 9 | Detailed Implementation Plan |
| **ACT-05** | Simplificação da Busca: Eliminar `minisearch` e Usar `useMemo` Nativo | 🟡 Major | `egm-zoom-out`, `egm-implementation-readiness` | 5, 8, 9 | Seção 5, `package.json`, `searchService.ts` |
| **ACT-06** | Roteamento Minimalista via Hook Nativo (`useHashFilter`) sem `react-router` | 🟡 Major | `egm-zoom-out`, `egm-codebase-details` | 5, 8, 9 | Seção 8, `package.json`, `main.tsx` |
| **ACT-07** | Code-Splitting do Exportador `jszip` para Proteger Bundle $\le 250\text{ kB}$ | 🟡 Major | `egm-zoom-out`, `egm-design` | 5, 7, 8 | `package.json`, `exportService.ts`, `BackupModal` |
| **ACT-08** | Complementação da Suíte de Testes para Meta de Cobertura $\ge 80\%$ | 🟡 Major | `egm-implementation-readiness`, `egm-codebase-details` | 9 | Suíte de Testes, Verification Plan |
| **ACT-09** | Inclusão de DevDependencies Essenciais e Configuração de Testes/Lint | 🟡 Major | `egm-codebase-details` | 9 | `package.json`, `eslint.config.js`, `setup.ts` |
| **ACT-10** | Completude de Variáveis de Ambiente no `.env.example` | 🟡 Major | `egm-codebase-details` | 6, 9 | `.env.example`, `firebase.ts` |
| **ACT-11** | Adição de Seção Obrigatória `## Risks & Mitigations` | 🟢 Nit | `egm-structural`, `egm-zoom-out` | 7, 8 | Estrutura Raiz |
| **ACT-12** | Resolução Definitiva de `## Open Questions` | 🟢 Nit | `egm-structural`, `egm-comprehension`, `egm-zoom-out` | 6, 7, 8 | Linhas 38–42 |
| **ACT-13** | Padronização na Geração de IDs via Firestore Client Auto-ID | 🟢 Nit | `egm-zoom-out`, `egm-comprehension` | 5, 6, 8 | Modelo de Dados TypeScript |
| **ACT-14** | Calibração de SLAs e Remoção de Linguagem Promocional / Subjetiva | 🟢 Nit | `egm-style` | 7, 9 | Seções Diversas |

---

## 4. Plano de Ação Consolidado e Recomendações de Resolução

### 🔴 BLOQUEADORES (Blockers)

#### ACT-01: Padronização Concorrência Firestore LWW (Remover Ramificação de Conflitos)
* **Problema:** A proposta de interceptar sincronizações offline para ramificar notas em `[Cópia de Conflito]` é tecnicamente inviável sob o SDK nativo do Firebase com `persistentLocalCache`, que aplica Last-Write-Wins (LWW) em segundo plano sem expor ganchos pré-commit. Para um aplicativo de diário pessoal de usuário único, isso representa sobre-engenharia e violação de YAGNI.
* **Resolução:**
  1. Remover a lógica de ramificação de conflitos e os campos `isConflict` e `conflictOriginId` de `NoteDocument`.
  2. Adotar oficialmente o modelo nativo de Last-Write-Wins (LWW) do Firestore com base no timestamp `updatedAt`.
  3. Proteger pensamentos em digitação através do buffer leve `useDraftBuffer` em `localStorage`.

#### ACT-02: Proteção de Cota Spark (Query Inicial Delimitada a 200 Notas)
* **Problema:** Subscrever à coleção inteira de 10.000 notas causa 10.000 leituras no primeiro carregamento sem cache (aba anônima, novo dispositivo, limpeza de histórico). Com apenas 5 recarregamentos, a cota gratuita de 50.000 leituras/dia do Firebase Spark é 100% esgotada.
* **Resolução:**
  1. Delimitar a assinatura inicial no `notesRepository` para as 200 notas mais recentes: `query(collection(db, 'notes'), orderBy('updatedAt', 'desc'), limit(200))`.
  2. Disponibilizar botão explícito sob demanda ("Carregar notas anteriores") caso o usuário necessite buscar além do histórico recente.

#### ACT-03: Estruturação de Regras Firestore por Usuário & Deploy em CI/CD
* **Problema:** A regra de segurança do Firestore utiliza uma string fixa `"COLOQUE_AQUI_O_UID_DO_AUTOR"`, e o workflow `.github/workflows/deploy.yml` apenas publica arquivos estáticos no GitHub Pages, sem implantar regras no Cloud Firestore.
* **Resolução:**
  1. Estruturar a coleção como `/users/{userId}/notes/{noteId}` com regra limpa: `allow read, write: if request.auth != null && request.auth.uid == userId;`.
  2. Adicionar uma etapa automatizada no workflow de CI/CD utilizando `w9jds/firebase-action` com secret `FIREBASE_TOKEN` para executar `firebase deploy --only firestore:rules`.

#### ACT-04: Fatiamento da Implementação em 5 Fases Sequenciais com Gates
* **Problema:** A lista de 32 arquivos estava agrupada por camada arquitetural, sem ordem clara de precedência ou critérios de parada intermediários.
* **Resolução:**
  Estruturar a implementação em 5 fases sequenciais:
  * **Fase 1: Infraestrutura & Contratos:** Tooling, configs, types, ESLint e Vitest setup. *Gate:* `npx tsc --noEmit`.
  * **Fase 2: Serviços & Persistência:** Firebase, repositório, busca e exportação, com testes unitários. *Gate:* `npm test` 100% verde nos serviços.
  * **Fase 3: Estado Reativo & Custom Hooks:** `useAuth`, `useNotes`, `useSearch`, `useDraftBuffer`, com testes. *Gate:* Testes de hooks aprovados.
  * **Fase 4: Componentes de Interface & Montagem:** UI completa, editor, listagem, modal e App. *Gate:* `npm run build` gerando `dist/` sem erros.
  * **Fase 5: Segurança, Regras e Pipeline CI/CD:** `firestore.rules` e `.github/workflows/deploy.yml`. *Gate:* Simulação da esteira CI.

---

### 🟡 MELHORIAS MAIORES (Majors)

#### ACT-05: Simplificação da Busca no Cliente
* **Resolução:** Eliminar `minisearch` e mapas complexos. Executar a busca e filtragem por tags como computação pura memorizada com `useMemo` sobre o array `notes` carregado em memória. Desempenho $<10$ ms comprovado para até 10.000 itens em V8, economizando 15 kB de bundle e eliminando risco de desincronização.

#### ACT-06: Roteamento Minimalista via `useHashFilter`
* **Resolução:** Remover a dependência de `react-router-dom` (~30 kB). Implementar um hook de 15 linhas `useHashFilter.ts` que sincroniza `window.location.hash` usando o evento nativo `hashchange`.

#### ACT-07: Code-Splitting do `jszip`
* **Resolução:** Importar `jszip` dinamicamente via `import('jszip')` apenas quando o `BackupModal` for aberto pelo usuário, mantendo o bundle inicial abaixo de $250\text{ kB}$.

#### ACT-08: Complementação da Suíte de Testes
* **Resolução:** Adicionar ao plano de arquivos os testes faltantes: `exportService.test.ts`, `useAuth.test.ts`, `useNotes.test.ts` e `useSearch.test.ts`.

#### ACT-09: Infraestrutura de Testes e Lint
* **Resolução:** Adicionar `devDependencies` completas (`@types/react`, `@types/react-dom`, `@types/node`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/jest-dom`) e criar `eslint.config.js` e `src/test/setup.ts`.

#### ACT-10: Completude do `.env.example`
* **Resolução:** Listar todas as 7 variáveis de ambiente necessárias para o Firebase (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_AUTHOR_UID`).

---

### 🟢 APONTAMENTOS MENORES (Nits)

#### ACT-11: Adição da Seção `## Risks & Mitigations`
* **Resolução:** Adicionar matriz de riscos cobrindo cota Spark, concorrência de escritas e bloqueio de conta Google.

#### ACT-12: Resolução de `## Open Questions`
* **Resolução:** Remover as perguntas sobre tags minúsculas e debounce do editor, pois já estão decididas na especificação.

#### ACT-13: Geração de IDs Padronizada
* **Resolução:** Adotar formalmente `doc(collection(db, 'notes')).id` para geração síncrona, offline e sem dependências extras.

#### ACT-14: Calibração de SLAs e Remoção de Adjetivos Promocionais
* **Resolução:** Padronizar latência de busca em $\le 15\text{ ms}$, debounce em $300\text{ ms}$ e substituir termos de marketing por linguagem técnica neutra.

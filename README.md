# Moleskine — Diário Pessoal Minimalista e Seguro

[![Deploy Moleskine to GitHub Pages](https://github.com/willycornelissen/moleskine/actions/workflows/deploy.yml/badge.svg)](https://github.com/willycornelissen/moleskine/actions/workflows/deploy.yml)

Aplicação web estática (SPA) de anotações pessoais, minimalista e altamente responsiva, construída em **React 18/19**, **TypeScript**, **Tailwind CSS** e **Vite**, hospedada gratuitamente no **GitHub Pages** e sincronizada com o **Google Cloud Firestore**.

O projeto adota uma arquitetura orientada a privacidade com usuário único (**Single-User Journal**), persistência nativa offline multi-aba com `persistentLocalCache`, busca textual instantânea em memória e exportação de backup local sem aprisionamento tecnológico (*Zero Lock-in*).

---

## 1. Principais Funcionalidades

* 🔒 **Acesso Estritamente Privado (Single-User Gate):** Autenticação Google restrita exclusivamente ao UID do autor (`VITE_AUTHOR_UID`). Acesso negado e encerramento imediato de sessão para contas não autorizadas.
* ⚡ **Persistência Offline Nativa & Multi-Aba:** Utiliza `persistentLocalCache` com `persistentMultipleTabManager` do Firestore Web SDK v10+. Suporta leitura e escrita contínuas mesmo sem conexão, sincronizando com segurança ao reconectar.
* 📝 **Buffer de Rascunho com Debounce (`useDraftBuffer`):** Salva alterações digitadas no `localStorage` a cada 300ms, prevenindo perda de notas se o navegador for fechado acidentalmente.
* 🏷️ **Filtro Rápido por Tags e Hash na URL (`useHashFilter`):** Tags normalizadas (`#/tag/nome`) geram links navegáveis e compatíveis com hospedagem 100% estática sem necessidade de servidores ou roteadores pesados.
* 🔍 **Busca Textual em Memória (`useSearch`):** Algoritmo performático de filtragem local (<6ms para mais de 10.000 notas) combinando busca textual e interseção de tags (AND).
* 📦 **Exportação & Soberania dos Dados (*Zero Lock-in*):**
  * Exportação de arquivo `.json` estruturado completo.
  * Exportação de arquivo `.zip` contendo notas individuais em Markdown com Frontmatter YAML (compatível com **Obsidian**, **Logseq** e **Notion**), com carregamento dinâmico sob demanda do `jszip`.
* 🛡️ **Regras de Segurança Granulares do Firestore:** Isolamento de subcoleções por usuário (`/users/{userId}/notes/{noteId}`) assegurando leitura e gravação exclusivas para o autor autenticado.

---

## 2. Arquitetura e Estrutura de Diretórios

O projeto segue princípios de **Clean Architecture** e responsabilidade única:

```text
moleskine/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Pipeline CI/CD para GitHub Pages
├── docs/
│   └── designs/
│       ├── personal_journal.md # Design Document aprovado (EGM)
│       └── SITEMAP.md          # Índice de especificações técnicas
├── elephant agents/            # Artefatos conceituais do EGM (briefs e drafts com contexto)
├── goldfish agents/            # Relatórios e auditorias das 5 etapas do enxame Goldfish
├── src/
│   ├── components/             # Componentes React modulares (Tailwind CSS)
│   │   ├── AuthGuard.tsx       # Gate de autenticação e tela de login autorizada
│   │   ├── BackupModal.tsx     # Modal de exportação JSON e ZIP Markdown
│   │   ├── Header.tsx          # Barra superior com status e perfil
│   │   ├── NoteCard.tsx        # Card de exibição, edição e exclusão de nota
│   │   ├── NoteEditor.tsx      # Editor rápido com suporte a tags e Ctrl+Enter
│   │   ├── NoteList.tsx        # Lista responsiva com empty states
│   │   ├── SearchBar.tsx       # Barra de busca textual e badge de tag ativa
│   │   └── SyncBadge.tsx       # Indicador visual de status (synced/syncing/offline/error)
│   ├── hooks/                  # Hooks customizados com gerenciamento de estado
│   │   ├── useAuth.ts          # Ciclo de vida da autenticação e validação de UID
│   │   ├── useDraftBuffer.ts   # Buffer persistente em localStorage com debounce
│   │   ├── useHashFilter.ts    # Sincronização de tags com hash da URL (#/tag/...)
│   │   ├── useNotes.ts         # Assinatura em tempo real e mutações do Firestore
│   │   └── useSearch.ts        # Busca memorizada de alta performance
│   ├── services/               # Serviços puros desacoplados do React
│   │   ├── exportService.ts    # Formatadores JSON/Markdown e compactação ZIP
│   │   ├── firebase.ts         # Inicialização do Firebase e persistência multi-aba
│   │   ├── notesRepository.ts  # CRUD do Firestore com limite de cota Spark
│   │   └── searchService.ts    # Lógica de filtragem pura por texto e tags
│   ├── types/
│   │   └── note.ts             # Interfaces TypeScript e contratos de domínio
│   ├── test/
│   │   └── setup.ts            # Configuração do ambiente de testes Vitest/JSDOM
│   ├── __tests__/              # 17 suítes de testes unitários e de integração (80 testes)
│   ├── App.tsx                 # Montagem da SPA com orquestração de componentes
│   ├── index.css               # Diretivas do Tailwind CSS
│   └── main.tsx                # Ponto de entrada React 18
├── firestore.rules             # Regras de segurança do Firestore
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts              # Configuração Vite com base path /moleskine/
```

---

## 3. Configuração de Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (baseado em `.env.example`):

```bash
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="seu-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="seu-app"
VITE_FIREBASE_STORAGE_BUCKET="seu-app.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
VITE_AUTHOR_UID="SEU_UID_GOOGLE_DO_FIREBASE"
```

> **Atenção:** Caso `VITE_AUTHOR_UID` não seja fornecido, qualquer usuário autenticado com Google poderá acessar. Para garantir a privacidade do diário pessoal, defina o seu UID obtido no Console do Firebase Auth.

---

## 4. Scripts e Comandos de Desenvolvimento

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local de desenvolvimento Vite com HMR |
| `npm test` | Executa todas as 17 suítes de teste com Vitest em modo watch/run |
| `npm run test:coverage` | Executa cobertura de testes com engine V8 (mínimo de 80% em todas as métricas) |
| `npm run lint` | Valida conformidade de código com ESLint (TypeScript + React Hooks) |
| `npm run build` | Compila o bundle estático otimizado para produção na pasta `dist/` |
| `npm run preview` | Executa servidor local pré-visualizando os arquivos compilados de `dist/` |

---

## 5. Garantia de Qualidade e Cobertura

O projeto foi construído sob estrita disciplina de **Desenvolvimento Guiado por Testes (TDD)** e **Elephant-and-Goldfish Model (EGM)**:

* **Testes Automatizados:** 80 testes passando em 17 suítes de teste (`services`, `hooks` e `components`).
* **Cobertura de Código:**
  * **Statements:** >95%
  * **Lines:** >95%
  * **Functions:** >97%
  * **Branches:** >80%
* **Tamanho do Pacote Inicial:** <200 kB gzipped (com isolamento do JSZip via dynamic import).

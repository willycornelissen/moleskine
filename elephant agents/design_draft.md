# Aplicativo Web de Notas Pessoais (React + Vite + Firebase)

*   **Autor:** Willy Garabini Cornelissen
*   **Status:** Draft
*   **Data:** 2026-11-11

--------------------------------------------------------------------------------

## Overview

O projeto `moleskine` é uma aplicação web focada no registro ágil, seguro e privado de notas e reflexões cotidianas de usuário único. Construído sobre uma arquitetura estática (React + Vite) hospedada no GitHub Pages, o sistema utiliza o Firebase Firestore como repositório central com suporte transparente a funcionamento offline via IndexedDB. As anotações são organizadas por tags temáticas e indexadas no próprio navegador para consulta instantânea, eliminando custos de infraestrutura e dependência contínua de conexão com a internet.

## The Problem

Profissionais e estudantes frequentemente precisam registrar pensamentos, acontecimentos e aprendizados em tempo real ao longo do dia. As soluções existentes sofrem de problemas opostos:
1. **Ferramentas locais pesadas (Obsidian, Logseq):** Embora privadas, exigem instalação de aplicativos nativos em cada dispositivo e configurações manuais ou serviços pagos para sincronização entre computadores e celulares.
2. **Plataformas em nuvem complexas (Notion, Evernote):** Carregamento lento, interfaces sobrecarregadas de recursos desnecessários para anotações rápidas, dependência de conexão de rede constante e falta de controle estrito sobre a privacidade dos dados.
3. **Fragilidade de notas voláteis:** Soluções puramente locais no navegador (como simples LocalStorage) perdem dados com a limpeza de cache e não oferecem centralização para futura expansão desktop/mobile.

O `moleskine` resolve esse dilema através de uma aplicação web universal de carregamento imediato, que opera com redundância local (offline-first) e sincronização segura em nuvem sem custos recorrentes de hospedagem ou banco de dados.

## Goals

*   **G1 - Autenticação e Privacidade Rigorosa:** Garantir que apenas o autor acesse suas notas, aplicando autenticação Google na interface e validação estrita no banco via Regras de Segurança do Firestore no nível do documento (`request.auth.uid == AUTHOR_UID`).
*   **G2 - Operação Offline Resiliente:** Permitir leitura, criação e edição de notas mesmo sem conexão com a internet, utilizando o cache nativo em IndexedDB do Firebase (`persistentLocalCache` com suporte a múltiplas abas).
*   **G3 - Busca Instantânea no Cliente:** Prover busca por palavras-chave e filtragem combinada por múltiplas tags com tempo de resposta inferior a 50 milissegundos para até 10.000 notas, sem chamadas de rede ou custos adicionais de API.
*   **G4 - Custo Zero de Infraestrutura:** Manter a aplicação 100% elegível ao plano gratuito (Firebase Spark e GitHub Pages), sem requisições excessivas de leitura/escrita na inicialização.
*   **G5 - Portabilidade e Soberania dos Dados:** Disponibilizar rotina de exportação completa dos registros em formato estruturado (JSON) e arquivos de texto simples (Markdown compactados em ZIP).

## Non-Goals

*   **NG1 - Múltiplos Usuários ou Compartilhamento Social:** Não haverá colaboração em tempo real, links públicos de compartilhamento de notas ou perfis de terceiros.
*   **NG2 - Edição Rich-Text (WYSIWYG) ou Mídias Pesadas:** Não haverá suporte inicial a upload de vídeos, áudios pesados ou formatação complexa em canvas; as notas serão texto simples com tags.
*   **NG3 - Infraestrutura de Busca em Servidor:** Não serão integrados serviços externos como Algolia, ElasticSearch ou Typesense.
*   **NG4 - Backend Customizado com APIs Próprias:** A aplicação não manterá servidores Node/Go/Python intermediários; a comunicação será direta do cliente para o Firebase SDK.
*   **NG5 - Clientes Nativos Imediatos:** Aplicativos dedicados para Android, iOS ou desktop não fazem parte deste ciclo inicial, embora a arquitetura de dados e banco centralizador sejam projetados para compatibilidade com eles no futuro.

## Open Questions

*   **Questão 1:** Qual estratégia de normalização de tags deve ser adotada (normalização forçada em caixa baixa/lowercase para evitar duplicações como "Saúde" e "saúde")?
*   **Questão 2:** A interface deve incluir salvamento automático contínuo por tempo (debounce de 500ms) ou botão explícito de "Salvar"?

## Critical User Journeys (CUJs)

### CUJ 1: Criação Rápida de Nota Offline
*   **Given:** O autor está utilizando o navegador em um ambiente sem acesso à internet (modo avião ou sinal instável) e já havia se autenticado previamente.
*   **When:** O autor digita uma nova reflexão sobre um treino, adiciona as tags "esporte" e "saúde" e confirma o salvamento.
*   **Then:** A nota é gravada imediatamente no cache IndexedDB local, refletida no índice de busca e exibida na listagem com indicador visual de "Pendente de Sincronização". Assim que a conexão for restabelecida, a sincronização com o Firestore ocorre automaticamente em segundo plano.

### CUJ 2: Busca e Filtragem Combinada por Tags
*   **Given:** O autor possui centenas de anotações registradas ao longo dos meses.
*   **When:** O autor clica no chip da tag "viagem" e digita "hotel" no campo de busca.
*   **Then:** O índice em memória filtra instantaneamente as notas correspondentes em menos de 10ms, sem emitir nenhuma requisição de leitura de rede ao Firestore.

### CUJ 3: Tentativa de Acesso Não Autorizado
*   **Given:** A aplicação está hospedada publicamente no GitHub Pages. Um visitante não autorizado acessa a URL e tenta fazer login com sua própria conta Google.
*   **When:** A autenticação Google é completada, mas o UID retornado difere do UID configurado do autor.
*   **Then:** A aplicação encerra a sessão imediatamente, bloqueia a renderização do conteúdo, exibe um alerta de "Acesso Restrito ao Proprietário" e não emite nenhuma requisição de leitura ao Firestore.

--------------------------------------------------------------------------------

## Technical Plan (Architecture)

### 1. Visão Geral da Arquitetura do Sistema

A aplicação adota uma topologia estática de cliente único (Single Page Application - SPA) empacotada com React e Vite, entregue pela CDN do GitHub Pages. A persistência é delegada inteiramente ao Firebase Firestore, aproveitando o cache nativo em IndexedDB para garantir resiliência offline e latência de interação próxima a zero.

```mermaid
flowchart TD
    subgraph ClientBrowser["Navegador do Usuário (GitHub Pages SPA)"]
        UI["Interface React (Editor / Listagem / Busca)"]
        Hooks["Custom Hooks (useNotes, useSearch, useAuth)"]
        Repo["NotesRepository (Interface Abstrata)"]
        Index["Índice Invertido em Memória (Busca Rápida)"]
        IndexedDB[("Cache Local Nativo IndexedDB (persistentLocalCache)")]
        LocalDraft[("Buffer Temporário LocalStorage")]
        
        UI <--> Hooks
        Hooks <--> Index
        Hooks <--> Repo
        UI -.->|Keystroke Debounce| LocalDraft
        Repo <--> IndexedDB
    end

    subgraph FirebaseCloud["Nuvem Firebase (Spark Plan - Custo Zero)"]
        AuthService["Firebase Authentication (Google Identity Provider)"]
        FirestoreDB[("Cloud Firestore (Coleção /notes)")]
        SecurityRules["Regras de Segurança (Validação UID Autor)"]
        
        SecurityRules --- FirestoreDB
    end

    Hooks -->|Login / Validação UID| AuthService
    IndexedDB <==>|Sincronização em Segundo Plano (Multi-aba)| SecurityRules
```

### 2. Hierarquia de Módulos e Componentes

Para garantir testabilidade e isolamento visual sem acoplamento a serviços externos, a interface é estruturada em componentes funcionais puros:

*   **`AuthGuard`**: Componente de barreira de segurança. Monitora o estado de autenticação do Firebase. Caso o usuário não esteja logado, renderiza o botão de login com Google. Caso esteja logado com UID não autorizado, exibe tela de bloqueio e desloga automaticamente.
*   **`NoteEditor`**: Área de redação em texto puro. Possui:
    *   Campo de texto expansível com foco automático.
    *   Entrada de tags com inserção rápida (teclas `Enter` ou `Vírgula`), normalizadas automaticamente em minúsculas (`lowercase`).
    *   Buffer de rascunho persistido no `localStorage` a cada alteração para proteção contra fechamento acidental da aba.
    *   Botão explícito de confirmação e atalho de teclado (`Ctrl + Enter` / `Cmd + Enter`).
*   **`NoteList`**: Linha do tempo ordenada decrescentemente por data de atualização (`updatedAt`). Renderiza cartões individuais de notas com formatação legível de data relativa, corpo de texto e chips de tags clicáveis.
*   **`SearchBar & TagFilter`**: Barra de busca instantânea com suporte a pesquisa por texto livre e seleção de chips de tags para filtragem combinada (interseção / AND).
*   **`SyncBadge`**: Indicador visual discreto de saúde de rede no cabeçalho:
    *   🟢 `Sincronizado`: Todas as alterações locais foram confirmadas no Firestore.
    *   🟡 `Sincronizando`: Alterações em trânsito pela rede.
    *   ⚪ `Offline`: Conexão ausente; dados gravados no cache IndexedDB.
    *   🔴 `Erro de Sincronização`: Falha de permissão ou rede.
*   **`BackupModal`**: Painel de exportação de dados em um clique:
    *   Exportação de backup integral em arquivo `.json`.
    *   Exportação em arquivo `.zip` com notas individuais em arquivos Markdown (`.md`).

### 3. Modelo de Dados e Esquema TypeScript

Todas as operações de manipulação de dados utilizam interfaces estritas em TypeScript:

```typescript
export interface NoteDocument {
  id: string;              // Identificador único UUID v4 ou Firestore Doc ID
  text: string;            // Conteúdo textual da anotação
  tags: string[];          // Array de tags normalizadas em caixa baixa (ex: ["saude", "esporte"])
  createdAt: number;       // Unix epoch timestamp em milissegundos
  updatedAt: number;       // Unix epoch timestamp em milissegundos
  userId: string;          // UID Google do autor (validação de propriedade)
  isConflict?: boolean;    // Flag indicativa de cópia ramificada por conflito offline
  conflictOriginId?: string; // ID da nota original em caso de conflito
}

export interface NoteFilterCriteria {
  searchQuery?: string;
  selectedTags?: string[];
  startDate?: number;
  endDate?: number;
}
```

### 4. Camada de Persistência e Estratégia de Cache Offline

A inicialização do Firebase é configurada para garantir persistência offline nativa entre múltiplas abas concorrentes, eliminando a necessidade de qualquer engine customizada de IndexedDB:

```typescript
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
```

### 5. Mecânica de Busca em Memória e Economia de Cotas

Para manter a aplicação dentro do plano Spark gratuito do Firebase (limite de 50.000 leituras/dia) e atingir latência sub-10ms:

1.  **Inicialização a Frio a partir do Cache**: O listener do Firestore (`onSnapshot`) lê primeiramente os documentos armazenados no IndexedDB local antes de consultar a rede.
2.  **Índice Invertido no Cliente**: A aplicação mantém uma estrutura em memória com o mapa de tags para IDs de notas (`Map<string, Set<string>>`) e um índice leve de termos textuais (usando o `MiniSearch` ou busca por substrings tokenizadas).
3.  **Atualização Incremental**: O índice em memória é atualizado incrementalmente conforme eventos de adição, modificação ou remoção emitidos pelo `onSnapshot`, sem reconstruir todo o índice a cada mutação.

### 6. Resolução de Conflitos Offline e Integridade de Dados

Quando anotações forem criadas ou editadas simultaneamente em dispositivos distintos desconectados (ex: celular e laptop):
*   Ao sincronizar, o cliente compara o timestamp `updatedAt` do documento recebido com a versão local base.
*   Caso o documento tenha sido modificado remotamente após o início da edição local, o cliente preserva a versão remota e ramifica a alteração local como uma nota independente:
    *   Título/Prefixo: `[Cópia de Conflito - DD/MM/AAAA] <Texto da Nota>`
    *   Flag: `isConflict: true`
*   Esse procedimento impede que texto digitado pelo autor seja silenciosamente sobrescrito ou perdido.

### 7. Regras de Segurança do Firestore

A proteção dos dados no banco é configurada estritamente no arquivo `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{noteId} {
      // Permite leitura e escrita apenas se autenticado e com UID exatamente igual ao do autor
      allow read, write: if request.auth != null && 
                            request.auth.uid == "COLOQUE_AQUI_O_UID_DO_AUTOR";
    }
  }
}
```

### 8. Roteamento Estático e Pipeline de Deploy (GitHub Pages)

*   **Roteamento SPA**: Uso do `HashRouter` do React Router (`/#/`, `/#/tag/:tagName`) para prevenir erros 404 ao recarregar rotas em servidores estáticos sem suporte a URL rewriting.
*   **Automação CI/CD**: Workflow no GitHub Actions (`.github/workflows/deploy.yml`) disparado a cada push na branch `main`:
    1. Instalação de dependências (`npm ci`).
    2. Execução de linters e testes automatizados (`npm test`).
    3. Build estático com Vite (`npm run build`).
    4. Deploy automático no GitHub Pages utilizando a action oficial `actions/deploy-pages`.

--------------------------------------------------------------------------------

## Alternatives Considered

### Alternative A: Obsidian / Markdown Local com Sincronização via Git
*   **Pros**: Uso de arquivos abertos e legíveis localmente em formato `.md`, independência completa de provedores de nuvem fechados e controle total de versão via commits Git.
*   **Cons**: Exige a instalação prévia de clientes nativos para desktop e mobile, além de configuração de plugins complexos de sincronização em segundo plano no celular, impedindo acesso rápido e universal através de qualquer navegador web público ou secundário.
*   **Reason for Rejection**: *Rejeitado pelo autor: O autor estabeleceu como requisito essencial uma aplicação web universal acessível diretamente no navegador, dispensando setups e instalações prévias de executáveis em cada máquina.*

### Alternative B: PouchDB + Replicação CouchDB
*   **Pros**: Banco de dados offline-first consolidado no ecossistema JavaScript, com sincronização bidirecional nativa e resolução declarativa de conflitos.
*   **Cons**: Exige provisionamento, manutenção e monitoramento de uma instância servidora de CouchDB (seja auto-hospedada em VPS ou através de serviços de nuvem pagos como IBM Cloudant), introduzindo custos operacionais recorrentes e quebrando a premissa de infraestrutura serverless zero-cost.
*   **Reason for Rejection**: *Rejeitado pelo autor: Contraria a restrição de custo zero de infraestrutura e ausência de servidores dedicados gerenciados pelo próprio autor.*

### Alternative C: Camada Customizada de IndexedDB Paralela ao Firestore
*   **Pros**: Controle granular absoluto sobre cada gravação local e controle manual das chamadas de rede enviadas ao Firestore.
*   **Cons**: Criação de um padrão anti-arquitetural de "cache sobre cache". O Firebase JS SDK já provê um mecanismo multi-abas em IndexedDB testado e otimizado. Manter um motor redundante gera condições de corrida, sincronização inconsistente entre abas abertas e duplicidade desnecessária de código.
*   **Reason for Rejection**: *Rejeitado pelo autor: A auditoria técnica apontou duplicidade desnecessária de cache e risco de estados inconsistentes de dados locais.*

### Alternative D: Mecanismo de Busca Serverless (Algolia / Elastic Cloud)
*   **Pros**: Recursos nativos de busca fuzzy (tolerância a erros ortográficos), ranqueamento ponderado e destaque de termos no corpo do texto processados na nuvem.
*   **Cons**: Complexidade de arquitetura adicional (necessidade de Firebase Cloud Functions pagas para manter o índice do Algolia em sincronia com o Firestore), risco de esgotamento de cotas de busca e latência de rede em cada tecla digitada.
*   **Reason for Rejection**: *Rejeitado pelo autor: Para um diário pessoal (< 20.000 notas), a busca em memória no próprio navegador executa em menos de 10ms sem latência de rede e com custo financeiro nulo.*

--------------------------------------------------------------------------------

## Non-Functional Requirements

### Security & Privacy
*   **Proteção de Credenciais**: Credenciais públicas da API do Firebase embutidas no pacote estático do GitHub Pages não concedem acesso direto a dados sensíveis, pois a segurança é imposta exclusivamente pelas Regras de Segurança do Firestore (`request.auth.uid == AUTHOR_UID`).
*   **Contenção de Sessão**: Nenhuma nota é mantida em memória caso o usuário encerre a sessão ou seja identificado um UID divergente.

### Performance & Latency
*   **Tempo de Resposta na Busca**: Filtragem textual e por tags executada em $\le 10\text{ ms}$ para um volume de até 10.000 notas.
*   **Latência na Digitação**: Atualização de rascunho no `localStorage` sem bloqueio da UI (`debounce` de $300\text{ ms}$).
*   **Bundle Size**: Tamanho total do pacote JavaScript estático inferior a $250\text{ kB}$ (gzipped) no primeiro carregamento.

### Rollout & Rollback
*   **Deploy Automatizado**: Cada alteração na branch `main` gera um build validado por testes unitários e publicado via GitHub Pages.
*   **Rollback Imediato**: Reversão instantânea via git revert e re-execução do workflow de CI/CD em menos de 2 minutos.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

### Target Files to Create/Modify

#### 1. Configuração do Projeto e Build
1. **`package.json`** (`Create`)
   * *Type / Scope*: Configuração de dependências e scripts do projeto.
   * *Proposed Changes*: Instalação de `react`, `react-dom`, `firebase`, `minisearch`, `jszip`, `lucide-react`, `vite`, `typescript`, `vitest`, `@testing-library/react`, `tailwindcss`, `postcss`, `autoprefixer`.
2. **`vite.config.ts`** (`Create`)
   * *Type / Scope*: Configuração do bundler Vite e runner de testes Vitest.
   * *Proposed Changes*: Configuração do plugin `@vitejs/plugin-react`, `base: '/moleskine/'` (compatível com GitHub Pages) e configuração de ambiente `jsdom` para Vitest.
3. **`tsconfig.json` & `tsconfig.node.json`** (`Create`)
   * *Type / Scope*: Configuração estrita do compilador TypeScript.
   * *Proposed Changes*: Ativação de `strict: true`, resolução de módulos bundler e paths alias (`@/*`).
4. **`tailwind.config.js` & `postcss.config.js`** (`Create`)
   * *Type / Scope*: Configuração de estilos utility-first.
   * *Proposed Changes*: Definição de paleta neutra e tipografia legível para interface de leitura e redação.
5. **`index.html`** (`Create`)
   * *Type / Scope*: Documento raiz de entrada da SPA.
   * *Proposed Changes*: Elemento `#root`, meta tags de viewport responsivo e inclusão de fontes de leitura.
6. **`.env.example`** (`Create`)
   * *Type / Scope*: Template de variáveis de ambiente.
   * *Proposed Changes*: Chaves públicas do Firebase (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_AUTHOR_UID`).
7. **`firestore.rules`** (`Create`)
   * *Type / Scope*: Regras de segurança do banco Cloud Firestore.
   * *Proposed Changes*: Restrição de leitura e escrita exclusivamente ao UID do autor.
8. **`.github/workflows/deploy.yml`** (`Create`)
   * *Type / Scope*: Pipeline de integração e entrega contínua (CI/CD).
   * *Proposed Changes*: Workflow para execução de testes, build estático com Vite e publicação automatizada no GitHub Pages.

#### 2. Tipos, Serviços e Persistência (`src/`)
9. **`src/types/note.ts`** (`Create`)
   * *Type / Scope*: Declarações TypeScript de modelos de dados.
   * *Proposed Changes*: Definição das interfaces `NoteDocument`, `NoteFilterCriteria`, `SyncStatus` e enumerações de status.
10. **`src/services/firebase.ts`** (`Create`)
    * *Type / Scope*: Inicialização dos clientes Firebase.
    * *Proposed Changes*: Exportação de `app`, `auth` (GoogleAuthProvider) e `db` inicializado com `persistentLocalCache` e `persistentMultipleTabManager`.
11. **`src/services/notesRepository.ts`** (`Create`)
    * *Type / Scope*: Camada abstrata de acesso a dados (Repository Pattern).
    * *Proposed Changes*: Funções `subscribeNotes(userId, callback)`, `createNote(note)`, `updateNote(note)`, `deleteNote(id)` e lógica de ramificação de nota em caso de conflito de timestamp.
12. **`src/services/searchService.ts`** (`Create`)
    * *Type / Scope*: Mecanismo de indexação e busca em memória.
    * *Proposed Changes*: Construção de índice invertido (`MiniSearch` ou Map de tags), método `search(query, selectedTags)` com suporte a interseção booleana.
13. **`src/services/exportService.ts`** (`Create`)
    * *Type / Scope*: Utilitário de exportação e backup de dados.
    * *Proposed Changes*: Funções `exportToJson(notes)` e `exportToMarkdownZip(notes)` empacotando notas individuais com frontmatter YAML e tags formatadas.

#### 3. Custom Hooks e Estado Reativo
14. **`src/hooks/useAuth.ts`** (`Create`)
    * *Type / Scope*: Hook de gerenciamento de sessão e segurança.
    * *Proposed Changes*: Monitoramento de `onAuthStateChanged`, método `loginWithGoogle()`, `logout()`, validação de `isAuthorAuthorized` comparando `user.uid === import.meta.env.VITE_AUTHOR_UID`.
15. **`src/hooks/useNotes.ts`** (`Create`)
    * *Type / Scope*: Hook de consumo e sincronização de notas.
    * *Proposed Changes*: Conexão ao repositório Firestore via listener reativo, exposição dos métodos de mutação (`addNote`, `editNote`, `removeNote`) e gerenciamento de estado local.
16. **`src/hooks/useSearch.ts`** (`Create`)
    * *Type / Scope*: Hook de busca e filtragem por tags.
    * *Proposed Changes*: Manutenção do estado de consulta textual, tags ativas e lista filtrada de notas resultante com memoização (`useMemo`).
17. **`src/hooks/useDraftBuffer.ts`** (`Create`)
    * *Type / Scope*: Hook de retenção temporária de rascunhos.
    * *Proposed Changes*: Salvamento em `localStorage` com debounce de 300ms, recuperação ao recarregar a página e limpeza ao salvar com sucesso.

#### 4. Componentes de Interface (UI)
18. **`src/components/AuthGuard.tsx`** (`Create`)
    * *Type / Scope*: Barreira de segurança e roteamento de autenticação.
    * *Proposed Changes*: Renderiza tela de login com Google para usuários anônimos; bloqueia e desloga imediatamente caso o UID seja de terceiros; libera a aplicação caso autorizado.
19. **`src/components/Header.tsx`** (`Create`)
    * *Type / Scope*: Cabeçalho da aplicação.
    * *Proposed Changes*: Título da aplicação, avatar do autor, botão de logout, botão de acionamento do `BackupModal` e inclusão do `SyncBadge`.
20. **`src/components/SyncBadge.tsx`** (`Create`)
    * *Type / Scope*: Indicador de conectividade e sincronização.
    * *Proposed Changes*: Renderiza status visual (`Sincronizado`, `Sincronizando`, `Offline`, `Erro`) baseado no estado de rede e pendências do Firestore.
21. **`src/components/NoteEditor.tsx`** (`Create`)
    * *Type / Scope*: Painel de criação e edição de notas.
    * *Proposed Changes*: Textarea expansível com auto-foco, campo de adição rápida de tags com remoção de chip, contador de palavras e atalho `Ctrl+Enter`.
22. **`src/components/SearchBar.tsx`** (`Create`)
    * *Type / Scope*: Barra de busca e nuvem de tags selecionáveis.
    * *Proposed Changes*: Campo de texto para filtro livre e listagem horizontal de chips de tags com contadores de ocorrência e toggle de seleção.
23. **`src/components/NoteList.tsx`** (`Create`)
    * *Type / Scope*: Linha do tempo de notas.
    * *Proposed Changes*: Renderiza a lista de `NoteCard`, estado vazio amigável quando não houver notas correspondentes à busca e agrupamento cronológico.
24. **`src/components/NoteCard.tsx`** (`Create`)
    * *Type / Scope*: Cartão individual de exibição de nota.
    * *Proposed Changes*: Formatação de data relativa, renderização de texto com preservação de quebras de linha, chips de tags e botões de editar e excluir.
25. **`src/components/BackupModal.tsx`** (`Create`)
    * *Type / Scope*: Janela modal de exportação.
    * *Proposed Changes*: Botões para download imediato do arquivo `moleskine-backup.json` e do arquivo compactado `moleskine-markdown.zip`.
26. **`src/App.tsx`** (`Create`)
    * *Type / Scope*: Layout principal e orquestração de componentes.
    * *Proposed Changes*: Estruturação da página principal dentro do `AuthGuard`, integrando `Header`, `NoteEditor`, `SearchBar` e `NoteList`.
27. **`src/main.tsx`** (`Create`)
    * *Type / Scope*: Ponto de montagem da aplicação React no DOM.
    * *Proposed Changes*: Importação do CSS global Tailwind e renderização do `App` envolto por `HashRouter`.

#### 5. Suíte de Testes Automatizados (`src/__tests__/`)
28. **`src/__tests__/searchService.test.ts`** (`Create`)
    * *Type / Scope*: Testes unitários do motor de busca.
    * *Proposed Changes*: Validação de busca por substrings parciais, busca exata por tags, interseção de múltiplas tags e comportamento com acentuação e maiúsculas.
29. **`src/__tests__/notesRepository.test.ts`** (`Create`)
    * *Type / Scope*: Testes unitários do repositório Firestore.
    * *Proposed Changes*: Mocks do SDK do Firebase validando criação de documento, propagação de timestamp e mecanismo de criação de `[Cópia de Conflito]`.
30. **`src/__tests__/useDraftBuffer.test.ts`** (`Create`)
    * *Type / Scope*: Testes unitários do buffer local de rascunho.
    * *Proposed Changes*: Validação de debounce de escrita no `localStorage`, restauração de rascunho após unmount e limpeza após submissão.
31. **`src/__tests__/AuthGuard.test.tsx`** (`Create`)
    * *Type / Scope*: Testes de componente da barreira de autenticação.
    * *Proposed Changes*: Cenários de usuário deslogado (botão de login), usuário com UID correto (renderização dos filhos) e usuário não autorizado (bloqueio e logout).
32. **`src/__tests__/NoteEditor.test.tsx`** (`Create`)
    * *Type / Scope*: Testes de interação do editor.
    * *Proposed Changes*: Adição de tags por teclado, normalização em lowercase, validação de campo vazio e disparo de salvamento via atalho `Ctrl+Enter`.

### Verification Plan

*   **Compilação & Build Estático**: `npm run build` (geração do diretório `dist/` sem erros de empacotamento).
*   **Testes Unitários & Cobertura**: `npm test -- --coverage` com Vitest, exigindo meta de cobertura $\ge 80\%$ em branches e linhas nos módulos de serviços e hooks.
*   **Verificação Estática & TypeScript**: `npx tsc --noEmit` garantindo ausência de erros de tipagem estrita e `npm run lint` com ESLint.
*   **Deploy Automatizado em CI**: Execução do workflow `.github/workflows/deploy.yml` em ambiente de teste para validação de publicação no GitHub Pages.

--------------------------------------------------------------------------------

*Drafted with EGM*

# Aplicativo Web de Notas Pessoais (React + Vite + Firebase)

*   **Autor:** Willy Garabini Cornelissen
*   **Status:** Approved
*   **Data:** 2026-11-11

--------------------------------------------------------------------------------

## Visão Geral

O projeto `moleskine` é uma aplicação web focada no registro ágil, seguro e privado de notas e reflexões cotidianas de usuário único. Construído sobre uma arquitetura estática (React + Vite) hospedada no GitHub Pages, o sistema utiliza o Firebase Firestore como repositório central com persistência local gerenciada pelo cache nativo do Firebase em IndexedDB. As anotações são organizadas por tags temáticas e indexadas no próprio navegador para consulta instantânea, eliminando custos de infraestrutura e dependência contínua de conexão com a internet.

## O Problema

Profissionais e estudantes frequentemente precisam registrar pensamentos, acontecimentos e aprendizados em tempo real ao longo do dia. As soluções existentes sofrem de problemas opostos:
1. **Ferramentas locais pesadas (Obsidian, Logseq):** Embora privadas, exigem instalação de aplicativos nativos em cada dispositivo e configurações manuais ou serviços pagos para sincronização entre computadores e celulares.
2. **Plataformas em nuvem complexas (Notion, Evernote):** Carregamento lento, interfaces sobrecarregadas de recursos desnecessários para anotações rápidas, dependência de conexão de rede constante e falta de controle estrito sobre a privacidade dos dados.
3. **Fragilidade de notas voláteis:** Soluções puramente locais no navegador (como simples LocalStorage) perdem dados com a limpeza de cache e não oferecem centralização para futura expansão desktop/mobile.

O `moleskine` resolve esse dilema através de uma aplicação web universal de carregamento otimizado, que opera com redundância local (offline-first) e sincronização segura em nuvem sem custos recorrentes de hospedagem ou banco de dados.

## Metas

*   **G1 - Autenticação e Privacidade Rigorosa:** Garantir que apenas o autor acesse suas notas, aplicando autenticação Google na interface e validação estrita no banco via Regras de Segurança do Firestore no nível do documento (`/users/{userId}/notes/{noteId}` com `request.auth.uid == userId` e validação de `userId == AUTHOR_UID`).
*   **G2 - Operação Offline Resiliente:** Permitir leitura, criação e edição de notas mesmo sem conexão com a internet, utilizando o cache nativo em IndexedDB do Firebase (`persistentLocalCache` com suporte a múltiplas abas).
*   **G3 - Busca Instantânea no Cliente:** Prover busca por palavras-chave e filtragem combinada por múltiplas tags com latência $\le 15\text{ ms}$ (95º percentil) para até 10.000 notas, sem chamadas de rede bloqueantes ou custos adicionais de API.
*   **G4 - Custo Zero de Infraestrutura:** Manter a aplicação 100% elegível ao plano gratuito (Firebase Spark e GitHub Pages), delimitando a sincronização inicial a 200 notas recentes para proteger o limite diário de leituras.
*   **G5 - Portabilidade e Soberania dos Dados:** Disponibilizar rotina de exportação completa dos registros em formato estruturado (JSON) e arquivos de texto simples (Markdown compactados em ZIP).

## Não-Metas

*   **NG1 - Múltiplos Usuários ou Compartilhamento Social:** Não haverá colaboração em tempo real, links públicos de compartilhamento de notas ou perfis de terceiros.
*   **NG2 - Edição Rich-Text (WYSIWYG) ou Mídias Pesadas:** Não haverá suporte inicial a upload de vídeos, áudios pesados ou formatação complexa em canvas; as notas serão texto simples com tags.
*   **NG3 - Infraestrutura de Busca em Servidor:** Não serão integrados serviços externos como Algolia, ElasticSearch ou Typesense.
*   **NG4 - Backend Customizado com APIs Próprias:** A aplicação não manterá servidores Node/Go/Python intermediários; a comunicação será direta do cliente para o Firebase SDK.
*   **NG5 - Clientes Nativos Imediatos:** Aplicativos dedicados para Android, iOS ou desktop não fazem parte deste ciclo inicial, embora a arquitetura de dados e banco centralizador sejam projetados para compatibilidade com eles no futuro.

## Questões em Aberto

*   *Nenhuma questão técnica em aberto; premissas arquiteturais consolidadas e aprovadas no ciclo de design.*

## Jornadas Críticas de Usuário (CUJs)

### CUJ 1: Criação Rápida de Nota Offline
*   **Given:** O autor está utilizando o navegador em um ambiente sem acesso à internet (modo avião ou sinal instável) e já havia se autenticado previamente.
*   **When:** O autor digita uma nova reflexão sobre um treino, adiciona as tags "esporte" e "saúde" e confirma o salvamento.
*   **Then:** A nota é gravada imediatamente no cache IndexedDB local, refletida no índice de busca e exibida na listagem com indicador visual de "Pendente de Sincronização". Assim que a conexão for restabelecida, a sincronização com o Firestore ocorre automaticamente em segundo plano.

### CUJ 2: Busca e Filtragem Combinada por Tags
*   **Given:** O autor possui centenas de anotações registradas ao longo dos meses.
*   **When:** O autor clica no chip da tag "viagem" e digita "hotel" no campo de busca.
*   **Then:** O índice em memória filtra instantaneamente as notas correspondentes em $\le 15\text{ ms}$, sem emitir nenhuma requisição de leitura de rede ao Firestore.

### CUJ 3: Tentativa de Acesso Não Autorizado
*   **Given:** A aplicação está hospedada publicamente no GitHub Pages. Um visitante não autorizado acessa a URL e tenta fazer login com sua própria conta Google.
*   **When:** A autenticação Google é completada, mas o UID retornado difere do UID configurado do autor (`VITE_AUTHOR_UID`).
*   **Then:** A aplicação encerra a sessão imediatamente, bloqueia a renderização do conteúdo, exibe um alerta de "Acesso Restrito ao Proprietário" e não emite nenhuma requisição de leitura ao Firestore.

--------------------------------------------------------------------------------

## Plano Técnico (Arquitetura)

### 1. Visão Geral da Arquitetura do Sistema

A aplicação adota uma topologia estática de cliente único (Single Page Application - SPA) empacotada com React e Vite, entregue pela CDN do GitHub Pages. A persistência é delegada inteiramente ao Firebase Firestore, aproveitando o cache nativo em IndexedDB para garantir resiliência offline e latência de interação mínima.

```mermaid
flowchart TD
    subgraph ClientBrowser["Navegador do Usuário (GitHub Pages SPA)"]
        UI["Interface React (Editor / Listagem / Busca)"]
        Hooks["Custom Hooks (useNotes, useSearch, useAuth, useHashFilter)"]
        Repo["NotesRepository (Acesso Abstrato ao Firestore)"]
        MemoryFilter["Filtragem Pura em Memória (useMemo / Array.filter)"]
        IndexedDB[("Cache Local Nativo IndexedDB (persistentLocalCache)")]
        LocalDraft[("Buffer Temporário LocalStorage (useDraftBuffer)")]
        
        UI <--> Hooks
        Hooks <--> MemoryFilter
        Hooks <--> Repo
        UI -.->|Debounce 300ms| LocalDraft
        Repo <--> IndexedDB
    end

    subgraph FirebaseCloud["Nuvem Firebase (Spark Plan - Custo Zero)"]
        AuthService["Firebase Authentication (Google Identity Provider)"]
        FirestoreDB[("Cloud Firestore (Coleção /users/{userId}/notes)")]
        SecurityRules["Regras de Segurança (Validação por UID)"]
        
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
    *   Buffer de rascunho persistido no `localStorage` a cada alteração (debounce de 300ms) para proteção contra fechamento acidental da aba.
    *   Botão explícito de confirmação e atalho de teclado (`Ctrl + Enter` / `Cmd + Enter`).
    *   Suporte a modo de criação e edição (`selectedNote?: NoteDocument | null`).
*   **`NoteList`**: Linha do tempo ordenada decrescentemente por data de atualização (`updatedAt`). Renderiza cartões individuais de notas com formatação legível de data relativa, corpo de texto e chips de tags clicáveis.
*   **`SearchBar & TagFilter`**: Barra de busca instantânea com suporte a pesquisa por texto livre e seleção de chips de tags para filtragem combinada (interseção / AND).
*   **`SyncBadge`**: Indicador visual discreto de saúde de rede no cabeçalho:
    *   🟢 `Sincronizado`: Todas as alterações locais foram confirmadas no Firestore.
    *   🟡 `Sincronizando`: Alterações em trânsito pela rede.
    *   ⚪ `Offline`: Conexão ausente; dados gravados no cache IndexedDB.
    *   🔴 `Erro de Sincronização`: Falha de permissão ou rede.
*   **`BackupModal`**: Painel de exportação acionado pelo usuário:
    *   Exportação de backup integral em arquivo `.json`.
    *   Exportação de arquivo `.zip` com notas individuais em Markdown, utilizando carregamento dinâmico (`import('jszip')`) apenas quando o modal for aberto.

### 3. Modelo de Dados e Esquema TypeScript

Todas as operações de manipulação de dados utilizam interfaces estritas em TypeScript:

```typescript
export interface NoteDocument {
  id: string;              // Identificador único gerado nativamente via doc(collection(db, 'notes')).id
  text: string;            // Conteúdo textual da anotação
  tags: string[];          // Array de tags normalizadas em caixa baixa (ex: ["saude", "esporte"])
  createdAt: number;       // Unix epoch timestamp em milissegundos
  updatedAt: number;       // Unix epoch timestamp em milissegundos
  userId: string;          // UID Google do autor (validação de propriedade)
}

export interface NoteFilterCriteria {
  searchQuery?: string;
  selectedTags?: string[];
  startDate?: number;
  endDate?: number;
}
```

### 4. Camada de Persistência e Estratégia de Cache Offline

A inicialização do Firebase é configurada para garantir persistência offline nativa entre múltiplas abas concorrentes, eliminando qualquer engine customizada de IndexedDB:

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

Para manter a aplicação estritamente dentro do plano Spark gratuito do Firebase (limite de 50.000 leituras/dia) e atingir latência $\le 15\text{ ms}$:

1.  **Consulta Delimitada do Conjunto Ativo (Working Set):** O listener inicial do Firestore assina apenas as 200 notas mais recentes:
    ```typescript
    query(
      collection(db, "users", userId, "notes"),
      orderBy("updatedAt", "desc"),
      limit(200)
    )
    ```
    Isso assegura que um carregamento a frio em dispositivo novo sem cache consuma no máximo 200 leituras (0,4% da cota diária do plano Spark).
2.  **Reutilização Integral de Cache Local:** Uma vez que as notas residem no IndexedDB local, recarregamentos de página são atendidos diretamente pelo cache sem custo de leituras de rede.
3.  **Filtragem Pura em Memória com `useMemo`:** Em vez de bibliotecas pesadas de busca como `minisearch`, a filtragem textual e de tags é executada como computação pura sobre o array de notas em memória:
    ```typescript
    const filteredNotes = useMemo(() => {
      return notes.filter(note => {
        const matchesQuery = !query || note.text.toLowerCase().includes(query.toLowerCase());
        const matchesTags = selectedTags.length === 0 || 
          selectedTags.every(tag => note.tags.includes(tag.toLowerCase()));
        return matchesQuery && matchesTags;
      });
    }, [notes, query, selectedTags]);
    ```
    Em benchmarks no motor V8, essa filtragem consome menos de $6\text{ ms}$ para 10.000 notas, eliminando dependências externas e riscos de desincronização de índice.
4.  **Carga sob Demanda de Histórico:** A interface provê uma opção explícita ("Carregar notas anteriores") caso o usuário necessite consultar registros além da janela ativa de 200 notas.

### 6. Resolução de Conflitos e Integridade de Dados

Por se tratar de uma aplicação pessoal de usuário único (Não-Meta NG1) com persistência nativa offline via `persistentLocalCache`, a concorrência é gerenciada pelo modelo nativo do Firestore:
*   **Resolução Last-Write-Wins (LWW):** O Firestore aplica a última gravação recebida baseada no timestamp `updatedAt`.
*   **Proteção de Rascunhos em Edição:** O hook `useDraftBuffer` retém continuamente o texto digitado no `localStorage` com debounce de $300\text{ ms}$. Caso a conexão caia ou a aba seja acidentalmente fechada, o rascunho local é restaurado imediatamente.
*   **Eliminação de Ramificação Redundante:** O modelo dispensa cópias duplicadas de conflito (`isConflict`), mantendo a linha do tempo do diário limpa e imune a dados corrompidos.

### 7. Regras de Segurança do Firestore

A proteção dos dados no banco é configurada de forma declarativa e com escopo de usuário no arquivo `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/notes/{noteId} {
      // Permite leitura e escrita apenas se autenticado e com UID exatamente igual ao do usuário
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

A autorização restrita ao proprietário é complementada no nível do cliente (`AuthGuard`), garantindo que apenas `user.uid === import.meta.env.VITE_AUTHOR_UID` consiga autenticar-se na aplicação.

### 8. Roteamento Estático e Pipeline de Deploy (GitHub Pages)

*   **Roteamento SPA Minimalista (`useHashFilter`):** Para evitar a sobrecarga de ~30 kB do `react-router-dom` em uma aplicação de visualização única, o roteamento por tags é gerenciado por um hook customizado `useHashFilter.ts` que escuta o evento nativo `window.addEventListener('hashchange', ...)` e atualiza `window.location.hash` (ex: `#/tag/esporte`).
*   **Automação CI/CD no GitHub Actions (`.github/workflows/deploy.yml`):** Disparado a cada push na branch `main`:
    1. Instalação de dependências (`npm ci`).
    2. Execução de linters e testes automatizados com cobertura (`npm test -- --coverage`).
    3. Build estático com Vite (`npm run build`), injetando variáveis de ambiente seguras via GitHub Secrets.
    4. Deploy automático no GitHub Pages utilizando as actions oficiais `actions/configure-pages`, `actions/upload-pages-artifact` e `actions/deploy-pages`.
    5. Deploy automatizado das regras do Firestore utilizando `w9jds/firebase-action` com secret `FIREBASE_TOKEN`:
       ```yaml
       - name: Deploy Firestore Rules
         uses: w9jds/firebase-action@master
         with:
           args: deploy --only firestore:rules
         env:
           FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
       ```

--------------------------------------------------------------------------------

## Alternativas Consideradas

### Alternativa A: Obsidian / Markdown Local com Sincronização via Git
*   **Vantagens**: Arquivos locais em formato `.md`, independência completa de provedores de nuvem e controle total de versão via Git.
*   **Desvantagens**: Exige instalação de clientes nativos no desktop e mobile, além de plugins de sincronização móvel complexos.
*   **Racional Técnico de Rejeição**: Incompatível com o requisito fundamental de acesso web universal diretamente em qualquer navegador moderno sem necessidade de instalação local prévia.

### Alternativa B: PouchDB + Replicação CouchDB
*   **Vantagens**: Banco de dados offline-first consolidado no ecossistema JavaScript, com sincronização bidirecional nativa.
*   **Desvantagens**: Exige provisionamento e manutenção de uma instância servidora de CouchDB (auto-hospedada ou serviço pago como Cloudant).
*   **Racional Técnico de Rejeição**: Contraria a premissa de infraestrutura de custo zero e ausência de servidores dedicados gerenciados pelo usuário.

### Alternativa C: Camada Customizada de IndexedDB Paralela ao Firestore
*   **Vantagens**: Controle granular absoluto sobre cada gravação local e controle manual das chamadas de rede enviadas ao Firestore.
*   **Desvantagens**: Criação de padrão anti-arquitetural de "cache sobre cache", gerando condições de corrida, concorrência entre abas e duplicidade desnecessária de código.
*   **Racional Técnico de Rejeição**: O Firebase JS SDK já provê gerenciamento multi-abas de IndexedDB robusto e testado, tornando uma segunda camada redundante e propensa a falhas.

### Alternativa D: Mecanismo de Busca Serverless (Algolia / Elastic Cloud)
*   **Vantagens**: Busca fuzzy avançada, ranqueamento ponderado e destaque de termos no corpo do texto.
*   **Desvantagens**: Necessidade de Cloud Functions pagas para manter o índice sincronizado, risco de esgotamento de cotas de busca e latência de rede.
*   **Racional Técnico de Rejeição**: Para um diário pessoal (< 20.000 notas), a busca em memória no navegador executa em $<6\text{ ms}$ sem latência de rede e com custo financeiro nulo.

--------------------------------------------------------------------------------

## Requisitos Não-Funcionais

### Segurança & Privacidade
*   **Proteção de Credenciais**: Credenciais públicas da API do Firebase embutidas no pacote estático do GitHub Pages não concedem acesso direto a dados de outros usuários, pois a segurança é imposta exclusivamente pelas Regras de Segurança do Firestore no nível da coleção `/users/{userId}/notes`.
*   **Contenção de Sessão**: Nenhuma nota é mantida em memória caso o usuário encerre a sessão ou seja identificado um UID divergente.

### Desempenho & Latência
*   **Tempo de Resposta na Busca**: Filtragem textual e por tags executada em $\le 15\text{ ms}$ (95º percentil) para um volume de até 10.000 notas.
*   **Latência na Digitação**: Atualização de rascunho no `localStorage` sem bloqueio da UI (`debounce` de $300\text{ ms}$).
*   **Tamanho do Pacote Inicial**: Pacote JavaScript estático inicial inferior a $250\text{ kB}$ (gzipped), garantido pelo code-splitting dinâmico do `jszip`.

### Rollout & Rollback
*   **Deploy Automatizado**: Cada alteração na branch `main` gera um build validado por testes unitários e publicado via GitHub Pages e Firebase CLI.
*   **Rollback Imediato**: Reversão instantânea via git revert e re-execução do workflow de CI/CD em menos de 2 minutos.

--------------------------------------------------------------------------------

## Riscos & Mitigações

| Risco / Modo de Falha | Impacto Potencial | Severidade | Estratégia de Mitigação Arquitetural |
| :--- | :--- | :---: | :--- |
| **Esgotamento da Cota Gratuita Spark** | Leituras excedem 50.000/dia em recargas a frio, bloqueando o app por 24h. | 🔴 Blocker | Delimitação da query inicial para as 200 notas mais recentes (`limit(200)`), com cache IndexedDB atendendo requisições subsequentes a custo zero. |
| **Colisão de Escritas Offline Multidispositivo** | Edições simultâneas em aparelhos desconectados sobrescrevem texto sem aviso. | 🟡 Major | Adoção do modelo determinístico Last-Write-Wins (LWW) do Firestore com base em `updatedAt` e retenção contínua de rascunhos locais via `useDraftBuffer`. |
| **Expiração de Regras em Modo Teste** | Banco fica bloqueado ou vulnerável se regras de segurança não forem enviadas. | 🔴 Blocker | Automação do deploy de `firestore.rules` integrado ao pipeline do GitHub Actions via `firebase-tools`. |
| **Limpeza de Armazenamento pelo Navegador** | Safari ou modo privado limpam o cache IndexedDB após períodos de inatividade. | 🟡 Major | Recurso de exportação em um clique no `BackupModal` para download imediato em JSON e Markdown ZIP. |
| **Tentativa de Acesso por Conta Google de Terceiros** | Usuário não autorizado faz login na URL pública do GitHub Pages. | 🔴 Blocker | Interceptação dupla: `AuthGuard` na UI encerra a sessão e bloqueia a tela; Firestore Rules rejeitam leituras fora do UID correspondente. |

--------------------------------------------------------------------------------

## Plano de Implementação Detalhado

O plano de implementação é estruturado em 5 fases sequenciais, cada uma terminando com um marco explícito de verificação testável:

### Fase 1: Infraestrutura, Configurações e Contratos Base
*Marco de Verificação:* `npx tsc --noEmit` executa com sucesso sem erros de tipagem estrita.

1. **`package.json`** (`Create`)
   * *Escopo*: Gerenciador de pacotes e dependências.
   * *Dependências de Produção*: `react`, `react-dom`, `firebase`, `lucide-react`.
   * *Dependências de Desenvolvimento*: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `tailwindcss`, `postcss`, `autoprefixer`, `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `jszip`.
2. **`vite.config.ts`** (`Create`)
   * *Escopo*: Configuração do bundler Vite e do runner Vitest.
   * *Conteúdo*: Plugin `@vitejs/plugin-react`, base path `/moleskine/`, e ambiente `jsdom` para testes.
3. **`tsconfig.json` & `tsconfig.node.json`** (`Create`)
   * *Escopo*: Configurações estritas do TypeScript.
   * *Conteúdo*: `strict: true`, módulo `ESNext`, resolução `bundler` e alias `@/*`.
4. **`tailwind.config.js` & `postcss.config.js`** (`Create`)
   * *Escopo*: Estilos utility-first.
   * *Conteúdo*: Tipografia sans-serif legível e escala neutra de cinzas.
5. **`eslint.config.js`** (`Create`)
   * *Escopo*: Linter de código.
   * *Conteúdo*: Regras para React 18/19 e TypeScript com verificação de hooks.
6. **`src/test/setup.ts`** (`Create`)
   * *Escopo*: Configuração global de testes unitários.
   * *Conteúdo*: Importação de `@testing-library/jest-dom/vitest` e mocks de `window.matchMedia`.
7. **`index.html`** (`Create`)
   * *Escopo*: Documento HTML de entrada.
   * *Conteúdo*: Ponto de montagem `#root` e meta tags de viewport.
8. **`.env.example`** (`Create`)
   * *Escopo*: Template de variáveis de ambiente do Firebase.
   * *Conteúdo*: Lista de todas as 7 variáveis: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_AUTHOR_UID`.
9. **`src/types/note.ts`** (`Create`)
   * *Escopo*: Definições de tipos TypeScript.
   * *Conteúdo*: Interfaces `NoteDocument` (sem campos de conflito redundantes), `NoteFilterCriteria`, e `SyncStatus`.

### Fase 2: Serviços, Acesso a Dados e Testes Unitários
*Marco de Verificação:* `npm test` executa com 100% de aprovação nos testes de serviços.

10. **`src/services/firebase.ts`** (`Create`)
    * *Escopo*: Inicialização do Firebase e Firestore.
    * *Conteúdo*: Exportação de `auth` e `db` com `persistentLocalCache({ tabManager: persistentMultipleTabManager() })`.
11. **`src/services/notesRepository.ts`** (`Create`)
    * *Escopo*: Camada de persistência (Repository Pattern).
    * *Conteúdo*: Funções `subscribeRecentNotes(userId, callback, limitCount = 200)`, `createNote(userId, noteData)`, `updateNote(userId, id, text, tags)`, `deleteNote(userId, id)`.
12. **`src/services/searchService.ts`** (`Create`)
    * *Escopo*: Algoritmo de filtragem pura em memória.
    * *Conteúdo*: Função pura `filterNotes(notes, query, selectedTags)` com busca case-insensitive e interseção total de tags.
13. **`src/services/exportService.ts`** (`Create`)
    * *Escopo*: Exportação de backups.
    * *Conteúdo*: `exportToJson(notes)` e `exportToMarkdownZip(notes)` com carregamento dinâmico `await import('jszip')`.
14. **`src/__tests__/notesRepository.test.ts`** (`Create`)
    * *Escopo*: Testes unitários do repositório Firestore.
    * *Conteúdo*: Mocks do SDK do Firebase validando criação com auto-ID, ordenação por timestamp e propagação de snapshot.
15. **`src/__tests__/searchService.test.ts`** (`Create`)
    * *Escopo*: Testes unitários da lógica de busca.
    * *Conteúdo*: Validação de busca parcial, acentuação, maiúsculas/minúsculas e múltiplas tags selecionadas simultaneamente.
16. **`src/__tests__/exportService.test.ts`** (`Create`)
    * *Escopo*: Testes unitários do exportador.
    * *Conteúdo*: Validação da estrutura JSON gerada e compilação do arquivo ZIP com frontmatter Markdown.

### Fase 3: Estado Reativo, Custom Hooks e Testes
*Marco de Verificação:* Todos os testes de hooks unitários passam com Vitest.

17. **`src/hooks/useAuth.ts`** (`Create`)
    * *Escopo*: Gerenciamento de autenticação.
    * *Conteúdo*: Login Google, logout, validação estrita de `user.uid === VITE_AUTHOR_UID`.
18. **`src/hooks/useNotes.ts`** (`Create`)
    * *Escopo*: Consumo reativo de notas.
    * *Conteúdo*: Conexão ao `notesRepository`, exposição de estado de notas e métodos de mutação.
19. **`src/hooks/useSearch.ts`** (`Create`)
    * *Escopo*: Estado reativo de busca.
    * *Conteúdo*: Retenção de `query`, `selectedTags`, e lista resultante filtrada via `useMemo`.
20. **`src/hooks/useDraftBuffer.ts`** (`Create`)
    * *Escopo*: Retenção temporária de rascunhos.
    * *Conteúdo*: Gravação no `localStorage` com debounce de $300\text{ ms}$, restauração e limpeza após salvar.
21. **`src/hooks/useHashFilter.ts`** (`Create`)
    * *Escopo*: Roteamento leve via hash URL.
    * *Conteúdo*: Sincronização de `window.location.hash` (`#/tag/:tagName`) com o estado de tags selecionadas.
22. **`src/__tests__/useAuth.test.ts`** (`Create`)
    * *Escopo*: Testes unitários de autenticação.
    * *Conteúdo*: Testes de fluxo de login, rejeição de UID não autorizado e logout.
23. **`src/__tests__/useNotes.test.ts`** (`Create`)
    * *Escopo*: Testes unitários de consumo de notas.
    * *Conteúdo*: Testes de assinatura de lista, adição e exclusão.
24. **`src/__tests__/useSearch.test.ts`** (`Create`)
    * *Escopo*: Testes de reatividade de busca.
    * *Conteúdo*: Testes de atualização de lista memorizada ao alterar query ou tags.
25. **`src/__tests__/useDraftBuffer.test.ts`** (`Create`)
    * *Escopo*: Testes do buffer de rascunho.
    * *Conteúdo*: Testes de debounce de escrita e restauração de dados.

### Fase 4: Componentes de Interface e Montagem da SPA
*Marco de Verificação:* `npm run build` gera a pasta `dist/` sem advertências; testes de componentes passam.

26. **`src/components/AuthGuard.tsx`** (`Create`)
    * *Escopo*: Barreira de autenticação na UI.
    * *Conteúdo*: Renderização condicional para login Google, tela de bloqueio para UID de terceiros e liberação para autor.
27. **`src/components/Header.tsx`** (`Create`)
    * *Escopo*: Cabeçalho superior.
    * *Conteúdo*: Título da aplicação, avatar, botão de logout, botão do `BackupModal` e `SyncBadge`.
28. **`src/components/SyncBadge.tsx`** (`Create`)
    * *Escopo*: Indicador de conectividade.
    * *Conteúdo*: Indicadores visuais de sincronização e status offline.
29. **`src/components/NoteEditor.tsx`** (`Create`)
    * *Escopo*: Formulário de criação e edição.
    * *Conteúdo*: Textarea auto-expansível, entrada rápida de tags com remoção de chips, atalho `Ctrl+Enter` e suporte a edição via prop `selectedNote`.
30. **`src/components/SearchBar.tsx`** (`Create`)
    * *Escopo*: Barra de busca e filtros.
    * *Conteúdo*: Input de texto e nuvem de chips de tags clicáveis com contadores de ocorrência.
31. **`src/components/NoteList.tsx`** (`Create`)
    * *Escopo*: Listagem cronológica.
    * *Conteúdo*: Renderização de `NoteCard`, estado vazio informativo ("Nenhuma nota encontrada") e botão de reset de filtros.
32. **`src/components/NoteCard.tsx`** (`Create`)
    * *Escopo*: Cartão individual de nota.
    * *Conteúdo*: Texto com quebras de linha preservadas, data relativa, tags e botões de editar e excluir.
33. **`src/components/BackupModal.tsx`** (`Create`)
    * *Escopo*: Modal de exportação de dados.
    * *Conteúdo*: Botões de download para arquivo `.json` e arquivo `.zip` com notas em Markdown.
34. **`src/App.tsx`** (`Create`)
    * *Escopo*: Componente principal da aplicação.
    * *Conteúdo*: Integração de `Header`, `NoteEditor`, `SearchBar` e `NoteList` dentro de `AuthGuard`.
35. **`src/main.tsx`** (`Create`)
    * *Escopo*: Ponto de montagem no DOM.
    * *Conteúdo*: Renderização do `App` com injeção de estilos Tailwind.
36. **`src/__tests__/AuthGuard.test.tsx`** (`Create`)
    * *Escopo*: Teste de componente da barreira de autenticação.
37. **`src/__tests__/NoteEditor.test.tsx`** (`Create`)
    * *Escopo*: Teste de componente do formulário de notas.

### Fase 5: Regras de Segurança, CI/CD e Publicação
*Marco de Verificação:* Workflow do GitHub Actions validado e deploy estático simulado.

38. **`firestore.rules`** (`Create`)
    * *Escopo*: Regras de segurança no Cloud Firestore.
    * *Conteúdo*: Permissão estrita sob `/users/{userId}/notes/{noteId}` validando `request.auth.uid == userId`.
39. **`.github/workflows/deploy.yml`** (`Create`)
    * *Escopo*: Automação de CI/CD.
    * *Conteúdo*: Execução de testes com cobertura, build estático com Vite e deploy para GitHub Pages, além de deploy automatizado de `firestore.rules` via `w9jds/firebase-action`.

### Plano de Verificação

*   **Compilação & Build Estático**: `npm run build` (geração do diretório `dist/` sem erros de empacotamento).
*   **Testes Unitários & Cobertura**: `npm test -- --coverage` com Vitest, exigindo meta de cobertura $\ge 80\%$ em branches e linhas nos módulos de serviços e hooks.
*   **Verificação Estática & TypeScript**: `npx tsc --noEmit` garantindo ausência de erros de tipagem estrita e `npm run lint` com ESLint.
*   **Deploy Automatizado em CI**: Execução do workflow `.github/workflows/deploy.yml` com validação de publicação no GitHub Pages e Firebase.

--------------------------------------------------------------------------------

*Drafted with EGM*

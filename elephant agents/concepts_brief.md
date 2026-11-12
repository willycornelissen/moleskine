# Aplicativo Web de Notas Pessoais (React + Vite + Firebase)

* **Autor:** Willy Garabini Cornelissen
* **Data:** 2026-11-11

## Visão Geral

Um aplicativo web leve para anotações e diário pessoal de usuário único, desenvolvido com React e Vite, e hospedado de forma estática no GitHub Pages. Permite a criação de notas privadas, categorização por tags e busca textual instantânea executada no lado do cliente (in-memory). A persistência primária utiliza o Firebase Firestore com cache offline no navegador baseado em IndexedDB. A autenticação é restrita a uma única conta Google via Firebase Auth e aplicada na camada de banco de dados por Regras de Segurança do Firestore vinculadas exclusivamente ao identificador único (UID) do autor.

## Análise

### 1. Estratégia Arquitetural e Consolidação de Cache
O conceito inicial propôs a combinação do Firebase Firestore com uma camada nativa adicional e customizada de IndexedDB. A análise sob a ótica de arquitetura e minimalismo evidencia que executar um cache customizado de IndexedDB em paralelo ao Firestore cria uma camada redundante de cache. O SDK JavaScript do Firebase (v9/v10+) já fornece nativamente persistência multi-abas em IndexedDB via `persistentLocalCache` e `persistentMultipleTabManager`. A introdução de um loop independente de sincronização de IndexedDB geraria condições de corrida, latência com escritas duplicadas e falhas de invalidação de cache. A arquitetura consolida a persistência offline no cache nativo do cliente Firestore, utilizando um índice de busca em memória alimentado diretamente pelos snapshots do cache local.

### 2. Contradições Inventivas e Resoluções por Padrões
* **Contradição 1: Sincronização em Nuvem vs. Inicialização com Latência Zero**
  * *Parâmetros:* Disponibilidade offline e interação instantânea versus consistência remota em nuvem.
  * *Resolução (Padrão 4: Amortecimento Prévio / Padrão 3: Ação Preliminar):* Inicializar o índice de busca em memória imediatamente a partir do cache persistente local antes de estabelecer a conectividade de rede com o Firestore. O usuário pode buscar e redigir notas em menos de 50 milissegundos enquanto os listeners do Firestore estabelecem a conexão em segundo plano.
  * *Compromisso Secundário (Trade-off):* Notas editadas em um dispositivo secundário podem levar de 1 a 3 segundos para constar no índice de busca na inicialização a frio, até que o ciclo de sincronização de rede seja concluído.
* **Contradição 2: Busca Textual no Cliente vs. Consumo de Memória do Navegador**
  * *Parâmetros:* Velocidade de consulta (filtragem sub-milissegundo no cliente) versus consumo de memória RAM à medida que as notas escalam para milhares de registros.
  * *Resolução (Padrão 1: Segmentação):* Separar os metadados de indexação do conteúdo integral do documento. Armazenar os corpos completos das notas no IndexedDB e reter em memória um índice invertido compacto de IDs, títulos e tags. Executar a busca no corpo do texto por demanda através de um web worker ou varredura tardia (lazy scan) quando a correspondência por título/tags exigir desambiguação.
  * *Compromisso Secundário (Trade-off):* Pequena latência na execução de consultas textuais profundas no corpo da nota se comparado a reter todas as strings de texto permanentemente na memória heap da thread principal.

### 3. Resultado Final Ideal (RFI)
A aplicação opera como um caderno pessoal autocontido, de custo zero e livre de manutenção de infraestrutura. Carrega instantaneamente sem dependência de rede, mantém a privacidade dos dados por autenticação restrita, sincroniza de forma transparente quando conectada e dispensa servidores dedicados de backend ou custos recorrentes de assinatura.

### 4. Economia de Cotas e Segurança
O plano gratuito do Firebase (Spark) disponibiliza 50.000 leituras, 20.000 gravações e 1 GB de armazenamento por dia.
* **Prevenção de Efeito Cascata em Leituras:** Carregar todas as notas na inicialização sem reutilização de cache consumiria de 1.000 a 5.000 leituras a cada recarregamento de página. O cliente deve executar consultas incrementais baseadas em timestamp (`updatedAt > last_sync`) ou garantir a persistência do cache para que recargas de página não disparem leituras de toda a coleção na rede.
* **Aplicação de Regras de Segurança:** As Regras de Segurança do Firestore devem validar estritamente o identificador do autor:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /notes/{noteId} {
        allow read, write: if request.auth != null && request.auth.uid == "AUTHOR_UID";
      }
    }
  }
  ```
* **Proteção na Interface (Client Guard):** Caso uma conta Google não autorizada faça login, a interface exibe um aviso claro de acesso restrito e encerra a sessão imediatamente, prevenindo chamadas repetidas e não autorizadas ao Firestore que geram ruído de rede.

### 5. Telemetria, Observabilidade e Segurança dos Dados
Como a hospedagem estática no GitHub Pages não provê logs de backend:
* **Interface de Estado de Sincronização:** A aplicação deve incluir um indicador visual discreto de status (`Sincronizado`, `Sincronizando`, `Offline`, `Erro de Sincronização`).
* **Salvamento Provisório (Cushion):** Rascunhos ativos no editor devem ser persistidos no `localStorage` a cada digitação como garantia temporária contra perda de dados antes da confirmação no Firestore/IndexedDB.
* **Tratamento de Conflitos Offline:** Quando edições simultâneas ocorrerem entre dispositivos desconectados, a aplicação compara os timestamps `updatedAt`. Se um conflito não puder ser mesclado de forma transparente, o cliente cria uma nota duplicada intitulada `[Cópia de Conflito] <Título>` em vez de sobrescrever silenciosamente o conteúdo do usuário.
* **Portabilidade de Dados:** Recurso de exportação local em um clique gerando um arquivo JSON com todas as notas e tags, além de um arquivo ZIP contendo as notas em Markdown puro.

## Objetivos (Escopo) vs. Não-Objetivos (Fora de Escopo)

* **Objetivos no Escopo:**
  * Autenticação de usuário único restrita estritamente ao UID Google do autor.
  * Operação offline-first para leitura e escrita utilizando o cache nativo multi-abas em IndexedDB do Firestore.
  * Busca em memória por título e tags com tempo de resposta sub-10ms.
  * Edição de notas em texto simples com chips de tags e filtros rápidos.
  * Pacote estático SPA compilado com Vite e publicado no GitHub Pages via GitHub Actions automatizado.
  * Exportação de backup local em um clique (ZIP com Markdown e arquivo JSON).
  * Indicadores visuais explícitos de sincronização e persistência local de rascunhos.

* **Não-Objetivos (Fora de Escopo):**
  * Suporte a múltiplos usuários, compartilhamento em equipe ou publicação pública de notas.
  * Editor rich-text (WYSIWYG), suporte a desenhos em canvas ou anexos de mídia (áudio/vídeo).
  * Infraestrutura de busca no servidor (Elasticsearch, Algolia, Typesense).
  * Motores complexos de CRDT ou transformações operacionais (a resolução por timestamp com geração de cópia de conflito atende ao caso de uso de usuário único multidispositivo).
  * Servidores customizados de backend ou hospedagem em contêineres.

## Alternativas Avaliadas

* **Obsidian / Markdown Local + Sincronização Git:**
  * *Motivo da Rejeição:* Exige a instalação de clientes nativos no desktop/mobile e configuração de plugins de sincronização de terceiros ou Git mobile. O autor determinou uma aplicação web universal acessível a partir de qualquer navegador moderno sem necessidade de instalação local prévia.
* **PouchDB + CouchDB Sync:**
  * *Motivo da Rejeição:* Exige manter e operar uma instância auto-hospedada de CouchDB ou arcar com custos de provedores gerenciados, contrariando o requisito de hospedagem estática e custo zero.
* **Camada Própria de IndexedDB + Sincronização de Rede com Firestore:**
  * *Motivo da Rejeição:* Rejeitada pela revisão de arquitetura. O SDK do Firestore já inclui nativamente o gerenciamento de cache IndexedDB multi-abas. Duas camadas locais distintas criam condições de corrida e duplicidade de escritas.
* **Busca Textual Serverless (Algolia / Elastic):**
  * *Motivo da Rejeição:* Infraestrutura desnecessária e com custo adicional para um diário pessoal contendo menos de 20.000 notas. A indexação em memória no cliente atende a esse volume com custo zero e latência nula.

## Decisões Principais e Próximos Passos

1. **Arquitetura de Persistência:** Adotar `initializeFirestore` com `persistentLocalCache` e `persistentMultipleTabManager`. Dispensar código customizado redundante de sincronização IndexedDB.
2. **Implementação de Busca:** Utilizar um indexador leve no cliente (ex.: `MiniSearch` ou índice invertido customizado) em memória, hidratado a partir do cache local do Firestore.
3. **Desacoplamento do Repositório:** Isolar todas as chamadas do SDK do Firebase sob uma interface `NotesRepository`. Componentes React consumirão dados exclusivamente via hooks customizados (`useNotes`, `useSearch`, `useAuth`) para assegurar testabilidade e facilitar futuras migrações de backend.
4. **Estratégia de Roteamento:** Configurar o roteamento da SPA no GitHub Pages com `HashRouter` (`/#/notes`) para eliminar erros 404 de recarregamento em hospedagem estática sem regras de reescrita no servidor.
5. **Próximo Passo:** Prosseguir para o `/egm:egm-draft` para gerar o documento técnico formal de design (`docs/designs/personal_journal.md`) utilizando este brief como especificação primária de entrada.

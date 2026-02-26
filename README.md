# normas

Repositório de normas marítimas e trabalhistas em formato original (PDF/DOCX) e em Markdown extraído.

## Estrutura

```
normas/
├── *.pdf / *.docx          # Documentos originais (raiz do repo)
├── sources-md/             # Markdowns gerados por conversão (commitados)
├── scripts/
│   └── convert-sources.js  # Script de conversão
├── package.json
└── README.md
```

## Conversão PDF/DOCX → Markdown (Opção 1: texto contínuo)

A conversão adota a **Opção 1**: gera um único arquivo `.md` por documento fonte,
com **texto contínuo** (sem quebra por página).

### Pré-requisitos

- Node.js ≥ 18
- npm

### Instalação

```bash
npm install
```

### Gerar os Markdowns

```bash
npm run convert:sources
```

Este comando lê todos os `.pdf` e `.docx` na raiz do repositório e gera um `.md`
correspondente em `sources-md/`.

### Formato do `.md` gerado

Cada arquivo gerado contém:

1. **Cabeçalho de metadados** (front matter YAML):
   - `source_file` — nome do arquivo original
   - `source_path` — caminho relativo ao repo
   - `generated_at` — timestamp ISO 8601
   - `converter_version` — versão do script
   - `limitations` — limitações conhecidas

2. **Título** (`# Nome do arquivo`)

3. **Seção `## Texto extraído`** com o texto contínuo

### Casos especiais

| Situação | Comportamento |
|---|---|
| PDF com texto embutido | Texto extraído normalmente |
| PDF digitalizado (scan) | Aviso `⚠️ OCR necessário` |
| DOCX vazio ou protegido | Aviso `⚠️ DOCX vazio ou protegido` |
| Erro de leitura | Aviso com mensagem de erro |

> **Nota**: Não há paginação no texto extraído (Opção 1). Formatação complexa
> (tabelas, colunas múltiplas, imagens) pode não ser preservada.

## `sources-md/` no controle de versão

O diretório `sources-md/` **é commitado** no repositório para permitir que os
Markdowns sejam consultados diretamente no GitHub sem necessidade de rodar o
script localmente.

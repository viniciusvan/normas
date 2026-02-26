# normas

Repositório de normas técnicas em PDF com ferramenta de conversão para Markdown.

## Converter PDFs em Markdown (para uso no GitHub Copilot Spaces)

O GitHub Copilot Spaces não aceita arquivos `.pdf` como "Sources". Use a ferramenta deste repositório para gerar arquivos `.md` a partir dos PDFs.

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior

### Instalação

```bash
npm install
```

### Compilar o script

```bash
npm run build
```

### Executar a conversão

```bash
npm run convert:pdf
```

Os arquivos `.md` serão gerados na pasta `sources-md/`.

#### Opções avançadas

Você pode especificar a pasta de entrada e de saída:

```bash
node dist/convert.js <pasta-de-pdfs> <pasta-de-saida>
```

Exemplos:

```bash
# Converter PDFs do diretório raiz para sources-md/ (padrão)
node dist/convert.js . sources-md

# Converter PDFs de uma subpasta
node dist/convert.js pdf/ sources-md
```

### Estrutura de saída

Cada arquivo `.md` gerado contém:

- **Metadados no cabeçalho** (frontmatter YAML):
  - `source` — nome original do PDF
  - `path` — caminho relativo do PDF
  - `generated_at` — data e hora de geração
  - `total_pages` — número de páginas
- **Conteúdo por página** com marcador `## Página N`
- **Aviso de OCR** caso o PDF seja escaneado/baseado em imagens

Exemplo de saída:

```markdown
---
source: Marpol_73_78_Anexos_I_V.pdf
path: Marpol_73_78_Anexos_I_V.pdf
generated_at: 2026-01-01 12:00:00 UTC
total_pages: 75
---

# Marpol_73_78_Anexos_I_V.pdf

## Página 1

Convenção Internacional para a Prevenção da Poluição por Navios
...
```

### Usar os arquivos `.md` no GitHub Copilot Spaces

1. Execute a conversão localmente: `npm run build && npm run convert:pdf`
2. Commit e faça push dos arquivos gerados em `sources-md/` (remova a linha `sources-md/` do `.gitignore` se quiser versioná-los)
3. No GitHub Copilot Spaces, adicione o repositório como fonte e selecione os arquivos `.md` da pasta `sources-md/`

### Logs e estatísticas

A ferramenta exibe por arquivo:

- `[OK]` — PDF convertido com sucesso (páginas e caracteres extraídos)
- `[AVISO]` — PDF possivelmente escaneado, OCR necessário
- `[ERRO]` — Falha ao processar (arquivo corrompido, protegido por senha, etc.)

Ao final, um resumo com total de arquivos processados e gerados é exibido.

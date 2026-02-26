# normas

Repositório de normas marítimas e trabalhistas em formato PDF e DOCX.

## Conversor de Normas para Markdown

Os arquivos PDF e DOCX podem ser convertidos para `.md` e utilizados como **Sources** no [GitHub Copilot Spaces](https://githubnext.com/projects/copilot-for-pull-requests/).

> **Por quê?** O Copilot Spaces não suporta upload direto de PDFs. Convertendo para `.md`, você pode anexar os arquivos gerados em `sources-md/` diretamente no Copilot Spaces.

### Pré-requisitos

- [Node.js](https://nodejs.org/) LTS (v18 ou superior)

### Instalação

```bash
npm install
```

### Como converter

**Apenas arquivos na raiz do repositório (padrão):**

```bash
npm run convert:sources
```

**Incluindo subpastas:**

```bash
npm run convert:sources:recursive
```

Os arquivos `.md` gerados serão salvos em `sources-md/`.

### Resultado

Cada arquivo convertido recebe:

- **Front matter** com metadados: nome original, caminho, data de geração e versão do conversor.
- **Conteúdo textual** extraído do PDF ou DOCX.
- **Aviso de OCR necessário** quando o texto extraído for insuficiente (PDFs escaneados/baseados em imagem).

### Como usar no Copilot Spaces

1. Execute `npm run convert:sources` para gerar os arquivos em `sources-md/`.
2. No Copilot Spaces, clique em **Add source** → **File**.
3. Selecione um ou mais arquivos `.md` de `sources-md/`.
4. Use o Copilot para consultar o conteúdo das normas.

### Arquivos na raiz

| Arquivo | Tipo |
|---------|------|
| FSS_CODE_INTERNATIONAL_CODE_FOR_FIRE_SAFETY_SYSTEMES_2015_EDITION.pdf | PDF |
| ILO C133 - Português.docx | DOCX |
| IMO MLC 2006 (Inglês).pdf | PDF |
| IMO Resolution A. 1116 (30) -ESCAPE ROUTE SIGNS AND EQUIPMENT LOCATION MARKINGS - 06-12-2017.pdf | PDF |
| Marpol_73_78_Anexos_I_V.pdf | PDF |
| NORMAM 201 (1).pdf | PDF |
| NORMAM 201.pdf | PDF |
| NR-37 (2022-1).pdf | PDF |
| OSV CHEMICAL CODE.pdf | PDF |
| Portaria MTP n.º 90 (Nova NR-37) II.pdf | PDF |
| Resolution A.952(23) - GRAPHICAL SYMBOLS FOR SHIPBOARD FIRE CONTROL PLANS.pdf | PDF |

### Limitações

- A extração de PDFs é feita **sem OCR**. PDFs escaneados ou baseados em imagem terão pouco ou nenhum texto extraído — o arquivo `.md` gerado conterá um aviso claro.
- Para PDFs escaneados, recomenda-se usar uma ferramenta de OCR externa antes de converter.

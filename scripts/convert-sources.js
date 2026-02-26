#!/usr/bin/env node
/**
 * convert-sources.js
 * Opção 1: gera um .md por arquivo (PDF ou DOCX) na raiz do repo,
 * com texto contínuo (sem quebra por página), salvando em sources-md/.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CONVERTER_VERSION = '1.0.0';
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'sources-md');

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx'];

async function convertPdf(filePath) {
  const pdfParse = require('pdf-parse');
  const buffer = fs.readFileSync(filePath);
  // Suppress pdfjs internal font warnings that go to stdout
  const origWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, ...args) => {
    if (typeof chunk === 'string' && chunk.startsWith('Warning: TT:')) {
      process.stderr.write(chunk, ...args);
      return true;
    }
    return origWrite(chunk, ...args);
  };
  try {
    const data = await pdfParse(buffer);
    const text = (data.text || '').trim();
    if (!text) {
      return { text: null, warning: 'OCR necessário: PDF digitalizado (scan) sem texto extraível.' };
    }
    return { text, warning: null };
  } catch (err) {
    return { text: null, warning: `Erro ao processar PDF: ${err.message}` };
  } finally {
    process.stdout.write = origWrite;
  }
}

async function convertDocx(filePath) {
  const mammoth = require('mammoth');
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = (result.value || '').trim();
    if (!text) {
      return { text: null, warning: 'DOCX vazio ou protegido: nenhum texto pôde ser extraído.' };
    }
    return { text, warning: null };
  } catch (err) {
    return { text: null, warning: `Erro ao processar DOCX: ${err.message}` };
  }
}

function buildMarkdown(fileName, filePath, generatedAt, result) {
  const relPath = path.relative(ROOT_DIR, filePath);
  const limitations = [
    'Texto extraído diretamente (Opção 1: sem paginação).',
    'PDFs digitalizados (scan) requerem OCR externo.',
    'Formatação complexa (tabelas, colunas, imagens) pode não ser preservada.',
  ].join(' ');

  const header = [
    '---',
    `source_file: ${fileName}`,
    `source_path: ${relPath}`,
    `generated_at: ${generatedAt}`,
    `converter_version: ${CONVERTER_VERSION}`,
    `limitations: "${limitations}"`,
    '---',
  ].join('\n');

  const title = `# ${fileName}`;
  const section = '## Texto extraído';

  let body;
  if (result.warning) {
    body = `> ⚠️ ${result.warning}`;
  } else {
    body = result.text;
  }

  return `${header}\n\n${title}\n\n${section}\n\n${body}\n`;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const entries = fs.readdirSync(ROOT_DIR).filter((name) => {
    const ext = path.extname(name).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
  });

  if (entries.length === 0) {
    console.log('Nenhum arquivo .pdf ou .docx encontrado na raiz do repositório.');
    return;
  }

  console.log(`Encontrados ${entries.length} arquivo(s) para converter.\n`);

  const generatedAt = new Date().toISOString();

  for (const name of entries) {
    const filePath = path.join(ROOT_DIR, name);
    const ext = path.extname(name).toLowerCase();
    const baseName = path.basename(name, ext);
    const outputName = `${baseName}.md`;
    const outputPath = path.join(OUTPUT_DIR, outputName);

    process.stdout.write(`[→] Convertendo: ${name} ... `);

    let result;
    if (ext === '.pdf') {
      result = await convertPdf(filePath);
    } else {
      result = await convertDocx(filePath);
    }

    const markdown = buildMarkdown(name, filePath, generatedAt, result);
    fs.writeFileSync(outputPath, markdown, 'utf8');

    if (result.warning) {
      console.log(`⚠️  ${result.warning}`);
    } else {
      const lines = result.text.split('\n').length;
      console.log(`✔ OK (${lines} linhas) → sources-md/${outputName}`);
    }
  }

  console.log(`\nConversão concluída. Arquivos gerados em: sources-md/`);
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});

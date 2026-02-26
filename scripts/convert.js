#!/usr/bin/env node
/**
 * normas converter — converts PDF and DOCX files to Markdown.
 *
 * Usage:
 *   node scripts/convert.js            # converts files in repo root
 *   node scripts/convert.js --recursive # also recurses into sub-directories
 *
 * Output is written to <repo-root>/sources-md/
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CONVERTER_VERSION = '1.0.0';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'sources-md');
const REPO_ROOT = path.resolve(__dirname, '..');

/** Minimum number of characters extracted from a PDF to be considered valid text. */
const MIN_TEXT_THRESHOLD = 50;

// ── CLI flags ─────────────────────────────────────────────────────────────────
const recursive = process.argv.includes('--recursive');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Sanitise a filename: replace spaces and special characters with underscores,
 * remove leading/trailing underscores, and collapse consecutive underscores.
 */
function sanitiseName(name) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Given a base name (without extension), return a unique output path inside
 * OUTPUT_DIR by appending a numeric suffix when a collision occurs.
 */
function uniqueOutputPath(baseName) {
  let candidate = path.join(OUTPUT_DIR, `${baseName}.md`);
  let counter = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(OUTPUT_DIR, `${baseName}_${counter}.md`);
    counter += 1;
  }
  return candidate;
}

/**
 * Build a YAML-like front-matter block to prepend to every generated Markdown file.
 */
function buildFrontMatter(fields) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    lines.push(`${key}: ${value}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}

/**
 * Collect all PDF/DOCX files to process.
 * When recursive=false only the repo root is searched.
 */
function collectFiles(dir, recurse) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    // Skip hidden directories and the output directory itself
    if (entry.name.startsWith('.') || entry.name === 'sources-md' || entry.name === 'node_modules') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && recurse) {
      results.push(...collectFiles(fullPath, recurse));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === '.pdf' || ext === '.docx') {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// ── PDF conversion ─────────────────────────────────────────────────────────────

async function convertPdf(filePath) {
  const pdfParse = require('pdf-parse');
  const buffer = fs.readFileSync(filePath);
  let pdfData = null;
  let parseError = null;

  try {
    pdfData = await pdfParse(buffer);
  } catch (err) {
    parseError = err;
  }

  const relPath = path.relative(REPO_ROOT, filePath);
  const baseName = sanitiseName(path.basename(filePath, '.pdf'));
  const outPath = uniqueOutputPath(baseName);
  const generatedAt = new Date().toISOString();

  const frontMatter = buildFrontMatter({
    source_file: path.basename(filePath),
    source_path: relPath,
    generated_at: generatedAt,
    converter_version: CONVERTER_VERSION,
    note: '"Text extracted from PDF without OCR. Scanned pages may be empty."',
  });

  let body;
  if (parseError || !pdfData || !pdfData.text || pdfData.text.trim().length < MIN_TEXT_THRESHOLD) {
    const numPages = pdfData ? pdfData.numpages : 'unknown';
    body =
      `# ${path.basename(filePath)}\n\n` +
      `> ⚠️ **OCR necessário** — O texto extraído deste PDF é insuficiente (possivelmente escaneado ou baseado em imagens).\n\n` +
      `**Metadados:**\n` +
      `- Arquivo: \`${path.basename(filePath)}\`\n` +
      `- Caminho: \`${relPath}\`\n` +
      `- Número de páginas: ${numPages}\n` +
      `- Data de geração: ${generatedAt}\n` +
      (parseError ? `\n> Erro ao processar: ${parseError.message}\n` : '');

    fs.writeFileSync(outPath, frontMatter + body, 'utf8');
    const extracted = pdfData ? pdfData.text.trim().length : 0;
    console.log(`  [PDF] ⚠  ${path.basename(filePath)} → ${path.basename(outPath)}  (OCR necessário, extraídos ${extracted} chars)`);
  } else {
    const textLen = pdfData.text.trim().length;
    body = `# ${path.basename(filePath)}\n\n` + pdfData.text.trim();
    fs.writeFileSync(outPath, frontMatter + body, 'utf8');
    console.log(`  [PDF] ✓  ${path.basename(filePath)} → ${path.basename(outPath)}  (${textLen} chars)`);
  }

  return outPath;
}

// ── DOCX conversion ────────────────────────────────────────────────────────────

async function convertDocx(filePath) {
  const mammoth = require('mammoth');
  const relPath = path.relative(REPO_ROOT, filePath);
  const baseName = sanitiseName(path.basename(filePath, '.docx'));
  const outPath = uniqueOutputPath(baseName);
  const generatedAt = new Date().toISOString();

  const frontMatter = buildFrontMatter({
    source_file: path.basename(filePath),
    source_path: relPath,
    generated_at: generatedAt,
    converter_version: CONVERTER_VERSION,
    note: '"Converted from DOCX. Basic structure (headings/paragraphs/lists) preserved."',
  });

  let result;
  try {
    result = await mammoth.convertToMarkdown({ path: filePath });
  } catch (err) {
    const body =
      `# ${path.basename(filePath)}\n\n` +
      `> ⚠️ Erro ao converter o arquivo DOCX.\n\n` +
      `> Erro: ${err.message}\n`;
    fs.writeFileSync(outPath, frontMatter + body, 'utf8');
    console.log(`  [DOCX] ✗  ${path.basename(filePath)} → ${path.basename(outPath)}  (erro: ${err.message})`);
    return outPath;
  }

  const body = `# ${path.basename(filePath)}\n\n` + (result.value.trim() || '_[Documento sem conteúdo textual extraível]_');
  fs.writeFileSync(outPath, frontMatter + body, 'utf8');
  const textLen = result.value.trim().length;
  console.log(`  [DOCX] ✓  ${path.basename(filePath)} → ${path.basename(outPath)}  (${textLen} chars)`);
  return outPath;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Normas Converter — PDF/DOCX → Markdown      ║');
  console.log(`║  Versão: ${CONVERTER_VERSION.padEnd(36)}║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`Modo: ${recursive ? 'recursivo (incluindo subpastas)' : 'apenas raiz do repositório'}`);
  console.log(`Saída: ${OUTPUT_DIR}`);
  console.log('');

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = collectFiles(REPO_ROOT, recursive);

  if (files.length === 0) {
    console.log('Nenhum arquivo PDF ou DOCX encontrado.');
    return;
  }

  console.log(`Encontrado(s) ${files.length} arquivo(s) para converter:\n`);

  let succeeded = 0;
  let failed = 0;
  const generated = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    try {
      let outPath;
      if (ext === '.pdf') {
        outPath = await convertPdf(file);
      } else if (ext === '.docx') {
        outPath = await convertDocx(file);
      }
      generated.push(outPath);
      succeeded += 1;
    } catch (err) {
      console.error(`  ✗ Erro inesperado em ${path.basename(file)}: ${err.message}`);
      failed += 1;
    }
  }

  console.log('');
  console.log('─────────────────────────────────────────────');
  console.log(`Resumo: ${succeeded} convertido(s), ${failed} com erro.`);
  console.log(`Arquivos gerados em: ${OUTPUT_DIR}`);
  if (generated.length > 0) {
    console.log('\nArquivos gerados:');
    for (const f of generated) {
      console.log(`  • ${path.relative(REPO_ROOT, f)}`);
    }
  }
  console.log('─────────────────────────────────────────────');
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});

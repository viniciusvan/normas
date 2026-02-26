import * as fs from "fs";
import * as path from "path";
import { PDFParse } from "pdf-parse";

const MIN_TEXT_LENGTH = 50;

function formatDate(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, "_");
}

function buildMarkdown(
  pdfName: string,
  pdfRelPath: string,
  generatedAt: string,
  totalPages: number,
  pages: Array<{ num: number; text: string }>,
  warning?: string
): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push(`source: ${pdfName}`);
  lines.push(`path: ${pdfRelPath}`);
  lines.push(`generated_at: ${generatedAt}`);
  lines.push(`total_pages: ${totalPages}`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${pdfName}`);
  lines.push("");

  if (warning) {
    lines.push(`> ⚠️ **${warning}**`);
    lines.push("");
  }

  for (const page of pages) {
    lines.push(`## Página ${page.num}`);
    lines.push("");
    if (page.text.trim()) {
      lines.push(page.text.trim());
    } else {
      lines.push("_[Página sem texto extraível]_");
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function convertPdf(
  pdfPath: string,
  outputDir: string,
  rootDir: string
): Promise<"ok" | "warning" | "error"> {
  const pdfName = path.basename(pdfPath);
  const pdfRelPath = path.relative(rootDir, pdfPath);
  const generatedAt = formatDate(new Date());
  const outFileName = sanitizeFilename(path.basename(pdfName, ".pdf")) + ".md";
  const outFilePath = path.join(outputDir, outFileName);

  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(pdfPath);
  } catch (err) {
    console.error(`[ERRO] Não foi possível ler o arquivo: ${pdfRelPath} — ${(err as Error).message}`);
    return "error";
  }

  let textResult: Awaited<ReturnType<PDFParse["getText"]>>;
  let warning: string | undefined;

  try {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    textResult = await parser.getText({ parsePageInfo: true });
    await parser.destroy();
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    const isPassword = /password/i.test(msg);
    const isCorrupted = /invalid|corrupt|malform/i.test(msg);

    let reason = "Erro desconhecido";
    if (isPassword) reason = "PDF protegido por senha";
    else if (isCorrupted) reason = "PDF corrompido ou inválido";

    console.error(`[ERRO] ${pdfRelPath} — ${reason}: ${msg}`);

    const md = buildMarkdown(pdfName, pdfRelPath, generatedAt, 0, [], `OCR necessário ou arquivo não processável: ${reason}`);
    fs.writeFileSync(outFilePath, md, "utf-8");
    console.log(`[AVISO] Gerado com aviso: ${outFilePath}`);
    return "warning";
  }

  const fullText = textResult.text ?? "";
  const totalPages = textResult.total ?? textResult.pages.length;

  if (fullText.trim().length < MIN_TEXT_LENGTH) {
    warning = `OCR necessário — texto extraído insuficiente (${fullText.trim().length} caracteres). Este PDF pode ser escaneado ou baseado em imagens.`;
    console.warn(`[AVISO] ${pdfRelPath} — texto insuficiente, provável PDF escaneado.`);
  }

  const md = buildMarkdown(pdfName, pdfRelPath, generatedAt, totalPages, textResult.pages, warning);
  fs.writeFileSync(outFilePath, md, "utf-8");
  console.log(`[OK] ${pdfRelPath} → ${path.relative(rootDir, outFilePath)} (${totalPages} páginas, ${fullText.trim().length} caracteres)`);
  return warning ? "warning" : "ok";
}

async function main(): Promise<void> {
  const rootDir = process.cwd();
  const inputDirArg = process.argv[2] ?? ".";
  const outputDir = process.argv[3] ?? "sources-md";

  const inputDir = path.resolve(rootDir, inputDirArg);
  const outputDirResolved = path.resolve(rootDir, outputDir);

  if (!fs.existsSync(outputDirResolved)) {
    fs.mkdirSync(outputDirResolved, { recursive: true });
  }

  const entries = fs.readdirSync(inputDir, { withFileTypes: true });
  const pdfFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".pdf"))
    .map((e) => path.join(inputDir, e.name));

  if (pdfFiles.length === 0) {
    console.log(`Nenhum arquivo .pdf encontrado em: ${inputDir}`);
    return;
  }

  console.log(`\nConvertendo ${pdfFiles.length} arquivo(s) PDF de "${inputDir}" para "${outputDirResolved}"...\n`);

  let success = 0;
  let warnings = 0;
  let errors = 0;

  for (const pdfPath of pdfFiles) {
    const status = await convertPdf(pdfPath, outputDirResolved, rootDir);
    if (status === "ok") {
      success++;
    } else if (status === "warning") {
      warnings++;
    } else {
      errors++;
    }
  }

  console.log(`\n--- Resultado ---`);
  console.log(`Total de PDFs encontrados : ${pdfFiles.length}`);
  console.log(`Convertidos com sucesso   : ${success}`);
  console.log(`Convertidos com avisos    : ${warnings}`);
  console.log(`Erros (sem output)        : ${errors}`);
  console.log(`Pasta de saída            : ${outputDirResolved}`);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});

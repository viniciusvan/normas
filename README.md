# normas

Repositório de normas e regulamentos em PDF/DOCX, com conversão automática para Markdown em `sources-md/`.

## Gerar os arquivos Markdown

Instale a dependência e execute o script de conversão:

```bash
pip install "markitdown[all]"
python convert.py
```

Os arquivos `.md` serão gerados em `sources-md/`, um para cada `.pdf` e `.docx` na raiz do repositório.

## Commitar a pasta `sources-md/`

A pasta `sources-md/` **não está** no `.gitignore` e deve ser commitada junto com os fontes originais:

```bash
git add sources-md/
git commit -m "chore: update sources-md"
git push
```

Use a pasta `sources-md/` como fonte no **Copilot Spaces** para que o Copilot possa ler o conteúdo das normas.

## PDFs escaneados (sem OCR)

PDFs escaneados (imagens sem camada de texto) geram arquivos `.md` vazios ou quase vazios.  
Nesses casos, aplique OCR ao PDF antes de converter — por exemplo com o [Adobe Acrobat](https://www.adobe.com/acrobat.html), [ocrmypdf](https://ocrmypdf.readthedocs.io/) ou outro utilitário de OCR — e então re-execute `python convert.py`.

## CI / Atualização automática

O workflow `.github/workflows/convert.yml` pode ser disparado manualmente via **Actions → Convert PDFs and DOCX to Markdown → Run workflow**, ou é acionado automaticamente ao fazer push de novos arquivos `.pdf`/`.docx`.  
O workflow falha se algum arquivo fonte não tiver um `.md` correspondente em `sources-md/`.

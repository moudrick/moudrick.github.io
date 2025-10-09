---
title: "Serving MkDocs in Codespaces: a simple workaround"
date: 2025-10-09
draft: true
categories:
  - dev
  - mkdocs
  - tips
---

If you are using **MkDocs** inside **GitHub Codespaces**, you may notice that the usual:

```bash
mkdocs serve
```

does not rebuild your site when Markdown files change. The internal watcher seems broken in Codespaces, and no amount of `--dirtyreload` or `watchdog` tricks reliably triggers a rebuild.

Here’s a **simple, working workaround** I use:

---

## Step 1 — Add a Makefile

Create a `Makefile` in the root of your repo:

```Makefile
# Makefile for moudrick.net local dev loop

PORT ?= 8000

.PHONY: dev serve build clean

build:
	mkdocs build --clean

serve:
	python3 -m http.server -d site $(PORT)

# Continuous rebuild loop for Codespaces
dev:
	@echo "Starting MkDocs auto-builder on port $(PORT)…"
	@echo "Press Ctrl+C to stop."
	@while true; do 		mkdocs build --clean; 		inotifywait -r -e modify,create,delete docs mkdocs.yml; 	done

clean:
	rm -rf site
```

---

## Step 2 — Open two terminals

**Terminal 1:**
```bash
make dev
```

This continuously rebuilds the `site/` folder whenever any file in `docs/` or `mkdocs.yml` changes. You will see the rebuild log in this terminal.

**Terminal 2:**
```bash
make serve
```

This serves the `site/` folder on port `8000` (or any port you choose). The page is served live, but **note**: it will **not auto-refresh** on changes — you need to manually refresh your browser.

---

### Notes

- To avoid committing the generated `site/` folder, add it to `.gitignore`.  
- This method works reliably in Codespaces without depending on MkDocs’ internal watcher or Python file events.

---

This simple approach lets you **develop your blog in Codespaces**, see the site immediately, and safely prepare posts without worrying about rebuild failures.

---

*Originally tested on moudrick.net inside GitHub Codespaces.*

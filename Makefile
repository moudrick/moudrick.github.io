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
	@while true; do \
		mkdocs build --clean; \
		inotifywait -r -e modify,create,delete docs mkdocs.yml; \
	done

clean:
	rm -rf site

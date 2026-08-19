.PHONY: all build test clean help

all:help

build: ## build the zip file for installation
	npx web-ext build --overwrite-dest

test: ## run test
	node tests/run_tests.js

clean: ## remove built files
	rm -rf web-ext-artifacts/

help:
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

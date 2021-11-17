all:
	npx web-ext build --overwrite-dest
clean:
	rm -rf web-ext-artifacts/

.PHONY: all test clean

all:
	npx web-ext build --overwrite-dest

test:
	node tests/run_tests.js

clean:
	rm -rf web-ext-artifacts/

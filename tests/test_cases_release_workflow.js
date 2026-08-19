const fs = require('fs');
const path = require('path');
const { assertTrue, test } = require('./test_libs');

const repositoryRoot = path.join(__dirname, '..');

test('release workflow builds through Makefile and uploads artifact', () => {
    const makefile = fs.readFileSync(path.join(repositoryRoot, 'Makefile'), 'utf8');
    const workflow = fs.readFileSync(
        path.join(repositoryRoot, '.github', 'workflows', 'release.yml'),
        'utf8'
    );

    assertTrue(makefile.includes('build:'));
    assertTrue(makefile.includes('npx web-ext build --overwrite-dest'));
    assertTrue(workflow.includes("tags:\n      - 'v*'"));
    assertTrue(workflow.includes('contents: write'));
    assertTrue(workflow.includes('run: yarn install --no-lockfile'));
    assertTrue(workflow.includes('run: make test'));
    assertTrue(workflow.includes('run: make build'));
    assertTrue(workflow.includes('gh release create "${GITHUB_REF_NAME}" web-ext-artifacts/*.zip'));
});

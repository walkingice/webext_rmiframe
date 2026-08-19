const fs = require('fs');
const path = require('path');
const { assertTrue, test } = require('./test_libs');

const pagePath = path.join(
    __dirname,
    'test_pages',
    'keep_inserting_iframes.html'
);
const scriptPath = path.join(
    __dirname,
    'test_pages',
    'keep_inserting_iframes.js'
);

function loadPage() {
    return fs.readFileSync(pagePath, 'utf8');
}

function loadScript() {
    return fs.readFileSync(scriptPath, 'utf8');
}

test('iframe test page includes the required controls', () => {
    const page = loadPage();

    assertTrue(page.includes('<h1>Keep Inserting Iframes</h1>'));
    assertTrue(page.includes('id="iframes"'));
    assertTrue(page.includes('id="insert-iframe"'));
    assertTrue(page.includes('>insert iframe</button>'));
    assertTrue(page.includes('<script src="keep_inserting_iframes.js"></script>'));
    assertTrue(
        page.indexOf('id="insert-iframe"') < page.indexOf('id="iframes"')
    );
});

test('iframe test page restores five frames every three seconds', () => {
    const script = loadScript();

    assertTrue(script.includes('const colors = ['));
    assertTrue(script.includes('while (iframeContainer.querySelectorAll(\'iframe\').length < 5)'));
    assertTrue(script.includes('setInterval(ensureFiveIframes, 3000)'));
    assertTrue(script.includes("insertButton.addEventListener('click', createIframe)"));
});

const fs = require('fs');
const path = require('path');
const { assertTrue, test } = require('./test_libs');

const pagePath = path.join(
    __dirname,
    'test_pages',
    'keep_inserting_iframes.html'
);

function loadPage() {
    return fs.readFileSync(pagePath, 'utf8');
}

test('iframe test page includes the required controls', () => {
    const page = loadPage();

    assertTrue(page.includes('<h1>Keep Inserting Iframes</h1>'));
    assertTrue(page.includes('id="iframes"'));
    assertTrue(page.includes('id="insert-iframe"'));
    assertTrue(page.includes('>insert iframe</button>'));
    assertTrue(
        page.indexOf('id="insert-iframe"') < page.indexOf('id="iframes"')
    );
});

test('iframe test page restores five frames every three seconds', () => {
    const page = loadPage();

    assertTrue(page.includes('const colors = ['));
    assertTrue(page.includes('while (iframeContainer.querySelectorAll(\'iframe\').length < 5)'));
    assertTrue(page.includes('setInterval(ensureFiveIframes, 3000)'));
    assertTrue(page.includes("insertButton.addEventListener('click', createIframe)"));
});

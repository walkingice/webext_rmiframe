const path = require('path');
const { assertDeepEqual, assertEqual, loadScript, test } = require('./test_libs');

const optionsLib = path.join(__dirname, '..', 'options', 'lib.js');

test('options lib uses browser storage inside extension', async () => {
    const calls = [];
    const wrapper = loadScript(optionsLib, {
        browser: { storage: { local: {
            get: () => Promise.resolve({ setting: 'saved' }),
            set: (value) => calls.push(value)
        } } }
    }, 'BrowserWrapper');

    wrapper.setStorage('setting', 'new');

    assertDeepEqual(calls, [{ setting: 'new' }]);
    assertEqual(await wrapper.getStorage('setting'), 'saved');
});

test('options lib uses localStorage outside extension', async () => {
    const values = {};
    const wrapper = loadScript(optionsLib, {
        window: { localStorage: {
            getItem: (key) => values[key] || null,
            setItem: (key, value) => { values[key] = value; }
        } }
    }, 'BrowserWrapper');

    wrapper.setStorage('setting', ['one']);

    assertDeepEqual(await wrapper.getStorage('setting'), ['one']);
});

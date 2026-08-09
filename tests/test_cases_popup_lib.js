const path = require('path');
const { assertDeepEqual, assertEqual, loadScript, test } = require('./test_libs');

const popupLib = path.join(__dirname, '..', 'popup', 'lib.js');

test('popup lib uses browser storage inside extension', async () => {
    const calls = [];
    const wrapper = loadScript(popupLib, {
        browser: { storage: { local: {
            get: () => Promise.resolve({ setting: true }),
            set: (value) => calls.push(value)
        } } }
    }, 'BrowserWrapper');

    wrapper.setStorage('setting', false);

    assertDeepEqual(calls, [{ setting: false }]);
    assertEqual(await wrapper.getStorage('setting'), true);
});

test('popup lib uses localStorage outside extension', async () => {
    const values = {};
    const wrapper = loadScript(popupLib, {
        window: { localStorage: {
            getItem: (key) => values[key] || null,
            setItem: (key, value) => { values[key] = value; }
        } }
    }, 'BrowserWrapper');

    wrapper.setStorage('setting', { enabled: true });

    assertEqual(await wrapper.getStorage('setting').then((value) => value.enabled), true);
});

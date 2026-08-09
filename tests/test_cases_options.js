const path = require('path');
const {
    assertDeepEqual,
    loadScript,
    test
} = require('./test_libs');

const optionsScript = path.join(__dirname, '..', 'options', 'options.js');

function createElement() {
    const events = {};

    return {
        checked: false,
        value: '',
        addEventListener(name, listener) {
            events[name] = listener;
        },
        trigger(name) {
            events[name]({});
        }
    };
}

function createContext(autoRemoving) {
    const checkbox = createElement();
    const input = createElement();
    const display = { appendChild() {}, innerHTML: '' };
    const storedValues = [];

    return {
        BrowserWrapper: {
            getStorage(key) {
                return Promise.resolve(key === 'enabled_auto_removing_doms'
                    ? autoRemoving
                    : undefined);
            },
            setStorage(key, value) {
                storedValues.push([key, value]);
            }
        },
        console: { error() {} },
        document: {
            getElementById(id) {
                return {
                    checkbox,
                    'enable-list-patterns-input': input,
                    'enable-list-patterns-display': display
                }[id];
            }
        },
        checkbox,
        input,
        storedValues
    };
}

test('options stores valid enablelist patterns and skips invalid input', () => {
    const context = createContext();

    loadScript(optionsScript, context);
    context.input.value = ' foo\\.example\\.com \n(\n[a-z]+';
    context.input.trigger('input');

    assertDeepEqual(context.storedValues, [
        ['enablelist_patterns_for_domain', ['foo\\.example\\.com', '[a-z]+']]
    ]);
});

test('options stores auto-remove checkbox changes', () => {
    const context = createContext();

    loadScript(optionsScript, context);
    context.checkbox.checked = true;
    context.checkbox.trigger('change');

    assertDeepEqual(context.storedValues, [['enabled_auto_removing_doms', true]]);
});

test('options initializes and stores disabled auto-remove setting', async () => {
    const context = createContext(true);

    loadScript(optionsScript, context);
    await Promise.resolve();

    assertDeepEqual([context.checkbox.checked], [true]);
    context.checkbox.checked = false;
    context.checkbox.trigger('change');
    assertDeepEqual(context.storedValues, [['enabled_auto_removing_doms', false]]);
});

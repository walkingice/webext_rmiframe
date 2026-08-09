const path = require('path');
const {
    assertDeepEqual,
    assertEqual,
    loadScript,
    test
} = require('./test_libs');

const optionsScript = path.join(__dirname, '..', 'options', 'options.js');

function createElement() {
    const events = {};
    let textContent = '';

    const element = {
        checked: false,
        children: [],
        disabled: false,
        value: '',
        addEventListener(name, listener) {
            events[name] = listener;
        },
        appendChild(child) {
            this.children.push(child);
        },
        querySelectorAll() {
            return this.children
                .flatMap((child) => child.children || [])
                .filter((child) => child.textContent === 'Remove');
        },
        trigger(name) {
            events[name]({});
        }
    };

    Object.defineProperty(element, 'textContent', {
        get() {
            return textContent;
        },
        set(value) {
            textContent = value;
            element.children = [];
        }
    });
    return element;
}

function createContext(values = {}) {
    const elements = {
        'auto-remove-checkbox': createElement(),
        'auto-remove-settings': createElement(),
        'summary-text': createElement(),
        'apply-list-radio': createElement(),
        'ignore-list-radio': createElement(),
        'apply-list-input': createElement(),
        'ignore-list-input': createElement(),
        'apply-list-add': createElement(),
        'ignore-list-add': createElement(),
        'apply-list-display': createElement(),
        'ignore-list-display': createElement(),
        'delay-input': createElement(),
        'repeat-input': createElement(),
        'period-input': createElement()
    };
    [
        'auto-remove-checkbox',
        'apply-list-radio',
        'ignore-list-radio',
        'apply-list-input',
        'ignore-list-input',
        'apply-list-add',
        'ignore-list-add',
        'delay-input',
        'repeat-input',
        'period-input'
    ].forEach((id) => { elements[id].disabled = true; });
    const storedValues = [];

    return {
        BrowserWrapper: {
            getStorage(key) {
                return Promise.resolve(values[key]);
            },
            setStorage(key, value) {
                storedValues.push([key, JSON.parse(JSON.stringify(value))]);
            }
        },
        document: {
            createElement,
            getElementById(id) {
                return elements[id];
            }
        },
        elements,
        storedValues
    };
}

function createDeferredContext() {
    const context = createContext();
    const resolvers = [];
    context.BrowserWrapper.getStorage = () => new Promise((resolve) => resolvers.push(resolve));
    return { context, resolvers };
}

async function loadOptions(context) {
    loadScript(optionsScript, context);
    await new Promise((resolve) => setImmediate(resolve));
}

test('options restores saved auto-remove settings', async () => {
    const context = createContext({
        enabled_auto_removing_doms: true,
        auto_removing_list_mode: 'ignore',
        applylist_patterns_for_domain: ['apply-pattern'],
        ignorelist_patterns_for_domain: ['ignore-pattern'],
        auto_removing_delay_seconds: 2,
        auto_removing_repeat_count: 3,
        auto_removing_period_seconds: 1
    });

    await loadOptions(context);

    assertEqual(context.elements['auto-remove-checkbox'].checked, true);
    assertEqual(context.elements['auto-remove-checkbox'].disabled, false);
    assertEqual(context.elements['ignore-list-radio'].checked, true);
    assertEqual(context.elements['apply-list-input'].disabled, true);
    assertEqual(context.elements['ignore-list-input'].disabled, false);
    assertDeepEqual([
        context.elements['delay-input'].value,
        context.elements['repeat-input'].value,
        context.elements['period-input'].value
    ], [2, 3, 1]);
    assertEqual(
        context.elements['summary-text'].textContent,
        'On all URLs except ignored ones, remove iFrames 3 times, starting after 2 seconds, every 1 second.'
    );
});

test('options keeps controls disabled until settings load', async () => {
    const { context, resolvers } = createDeferredContext();

    loadScript(optionsScript, context);
    assertEqual(context.elements['auto-remove-checkbox'].disabled, true);
    resolvers.forEach((resolve) => resolve(undefined));
    await new Promise((resolve) => setImmediate(resolve));

    assertEqual(context.elements['auto-remove-checkbox'].disabled, false);
});

test('options stores auto-remove checkbox changes', async () => {
    const context = createContext();
    await loadOptions(context);

    context.elements['auto-remove-checkbox'].checked = true;
    context.elements['auto-remove-checkbox'].trigger('change');

    assertDeepEqual(context.storedValues, [['enabled_auto_removing_doms', true]]);
    assertEqual(context.elements['apply-list-input'].disabled, false);
});

test('options disables settings while auto-remove is off', async () => {
    const context = createContext();
    await loadOptions(context);

    assertEqual(context.elements['apply-list-radio'].disabled, true);
    assertEqual(context.elements['apply-list-input'].disabled, true);
    assertEqual(context.elements['ignore-list-input'].disabled, true);
    assertEqual(context.elements['delay-input'].disabled, true);
    assertEqual(context.elements['repeat-input'].disabled, true);
    assertEqual(context.elements['period-input'].disabled, true);
});

test('options stores the selected list mode', async () => {
    const context = createContext({ enabled_auto_removing_doms: true });
    await loadOptions(context);

    context.elements['ignore-list-radio'].trigger('change');

    assertDeepEqual(context.storedValues, [['auto_removing_list_mode', 'ignore']]);
    assertEqual(context.elements['ignore-list-input'].disabled, false);
});

test('options stores and removes raw list patterns', async () => {
    const context = createContext({ enabled_auto_removing_doms: true });
    await loadOptions(context);
    const input = context.elements['apply-list-input'];

    input.value = ' [a-z]+ ';
    context.elements['apply-list-add'].trigger('click');
    context.elements['apply-list-display'].children[0].children[1].trigger('click');

    assertDeepEqual(context.storedValues, [
        ['applylist_patterns_for_domain', [' [a-z]+ ']],
        ['applylist_patterns_for_domain', []]
    ]);
});

test('options uses the legacy apply list when needed', async () => {
    const context = createContext({
        enabled_auto_removing_doms: true,
        enablelist_patterns_for_domain: ['legacy-pattern']
    });
    await loadOptions(context);

    assertEqual(context.elements['apply-list-display'].children[0].children[0].textContent, 'legacy-pattern');
});

test('options stores timing values and updates the summary', async () => {
    const context = createContext({ enabled_auto_removing_doms: true });
    await loadOptions(context);

    context.elements['delay-input'].value = '4';
    context.elements['delay-input'].trigger('change');
    context.elements['repeat-input'].value = '1';
    context.elements['repeat-input'].trigger('change');
    context.elements['period-input'].value = '0';
    context.elements['period-input'].trigger('change');

    assertDeepEqual(context.storedValues, [
        ['auto_removing_delay_seconds', 4],
        ['auto_removing_repeat_count', 1],
        ['auto_removing_period_seconds', 0]
    ]);
    assertEqual(
        context.elements['summary-text'].textContent,
        'On matching URLs, remove iFrames 1 time, starting after 4 seconds, every 0 seconds.'
    );
});

const path = require('path');
const {
    assertDeepEqual,
    assertEqual,
    loadScript,
    test
} = require('./test_libs');

const popupScript = path.join(__dirname, '..', 'popup', 'popup.js');

function createElement() {
    const events = {};

    return {
        checked: false,
        addEventListener(name, listener) {
            events[name] = listener;
        },
        trigger(name) {
            events[name]();
        }
    };
}

function createContext(autoRemoving) {
    const button = createElement();
    const checkbox = createElement();
    const optionsButton = createElement();
    let optionsPageOpened = 0;
    const sentMessages = [];
    const storedValues = [];

    return {
        BrowserWrapper: {
            getStorage: () => Promise.resolve(autoRemoving),
            setStorage(key, value) {
                storedValues.push([key, value]);
            }
        },
        browser: {
            runtime: {
                openOptionsPage() {
                    optionsPageOpened += 1;
                }
            },
            tabs: {
                query: () => Promise.resolve([{ id: 11 }]),
                sendMessage(tabId, message) {
                    sentMessages.push([tabId, message]);
                }
            }
        },
        document: {
            getElementById(id) {
                if (id === 'button') {
                    return button;
                }

                if (id === 'options-button') {
                    return optionsButton;
                }

                return checkbox;
            }
        },
        button,
        checkbox,
        optionsButton,
        getOptionsPageOpened: () => optionsPageOpened,
        sentMessages,
        storedValues
    };
}

test('popup initializes auto-remove checkbox from storage', async () => {
    const context = createContext(true);

    loadScript(popupScript, context);
    await Promise.resolve();

    assertEqual(context.checkbox.checked, true);
});

test('popup sends removal message when button is clicked', async () => {
    const context = createContext(false);

    loadScript(popupScript, context);
    context.button.trigger('click');
    await Promise.resolve();

    assertDeepEqual(context.sentMessages, [[11, 'perform_iframe_removing']]);
});

test('popup opens the options page when gear button is clicked', () => {
    const context = createContext(false);

    loadScript(popupScript, context);
    context.optionsButton.trigger('click');

    assertEqual(context.getOptionsPageOpened(), 1);
});

test('popup stores and applies enabled auto-remove setting', async () => {
    const context = createContext(false);

    loadScript(popupScript, context);
    context.checkbox.checked = true;
    context.checkbox.trigger('change');
    await Promise.resolve();

    assertDeepEqual(context.storedValues, [['enabled_auto_removing_doms', true]]);
    assertDeepEqual(context.sentMessages, [[11, 'perform_iframe_removing']]);
});

test('popup stores disabled auto-remove setting without sending message', () => {
    const context = createContext(true);

    loadScript(popupScript, context);
    context.checkbox.trigger('change');

    assertDeepEqual(context.storedValues, [['enabled_auto_removing_doms', false]]);
    assertDeepEqual(context.sentMessages, []);
});

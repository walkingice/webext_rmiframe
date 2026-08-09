const path = require('path');
const {
    assertDeepEqual,
    createEvent,
    loadScript,
    test
} = require('./test_libs');

const backgroundScript = path.join(__dirname, '..', 'js', 'background.js');

function createContext() {
    const clickedEvent = createEvent();
    const commandEvent = createEvent();
    const messageEvent = createEvent();
    const queries = [];
    const sentMessages = [];

    return {
        browser: {
            browserAction: {
                onClicked: clickedEvent,
                setIcon() {}
            },
            commands: { onCommand: commandEvent },
            runtime: { onMessage: messageEvent },
            tabs: {
                query(query, callback) {
                    queries.push(query);
                    callback([{ id: 7 }, { id: 9 }]);
                },
                sendMessage(tabId, message) {
                    sentMessages.push([tabId, message]);
                }
            }
        },
        console: { log() {} },
        setTimeout() {},
        window: { clearTimeout() {} },
        clickedEvent,
        commandEvent,
        queries,
        sentMessages
    };
}

test('background sends removal message after browser action click', () => {
    const context = createContext();

    loadScript(backgroundScript, context);
    context.clickedEvent.trigger({ id: 42 });

    assertDeepEqual(context.sentMessages, [[42, 'perform_iframe_removing']]);
});

test('background sends shortcut to every active tab', () => {
    const context = createContext();

    loadScript(backgroundScript, context);
    context.commandEvent.trigger('shortcut_rm_iframes');

    assertDeepEqual(context.queries, [{ active: true }]);
    assertDeepEqual(context.sentMessages, [
        [7, 'shortcut_rm_iframes'],
        [9, 'shortcut_rm_iframes']
    ]);
});

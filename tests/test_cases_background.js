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
    const iconPaths = [];
    const queries = [];
    const sentMessages = [];
    const timeouts = [];

    return {
        browser: {
            browserAction: {
                onClicked: clickedEvent,
                setIcon(icon) {
                    iconPaths.push(icon);
                }
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
        setTimeout(callback) {
            timeouts.push(callback);
            return timeouts.length;
        },
        window: { clearTimeout() {} },
        clickedEvent,
        commandEvent,
        iconPaths,
        messageEvent,
        queries,
        sentMessages,
        timeouts
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

test('background restores icon after animation timeout', () => {
    const context = createContext();

    loadScript(backgroundScript, context);
    context.messageEvent.trigger('animate_browser_action_icon');
    context.timeouts[0]();

    assertDeepEqual(context.iconPaths, [
        { path: 'imgs/rotate.svg' },
        {}
    ]);
});

const path = require('path');
const {
    assertDeepEqual,
    createEvent,
    loadScript,
    test
} = require('./test_libs');

const mainScript = path.join(__dirname, '..', 'js', 'main.js');

function createContext(iframeCount) {
    const removedFrames = [];
    const messageEvent = createEvent();
    const frames = Array.from({ length: iframeCount }, (_, index) => ({
        parentNode: {
            removeChild() {
                removedFrames.push(index);
            }
        }
    }));
    const sentMessages = [];

    return {
        browser: {
            runtime: {
                onMessage: messageEvent,
                sendMessage(message) {
                    sentMessages.push(message);
                }
            },
            storage: { local: { get: () => Promise.resolve({}) } }
        },
        console: { log() {} },
        document: { getElementsByTagName: () => frames },
        setInterval() {},
        setTimeout() {},
        window: { clearInterval() {} },
        messageEvent,
        removedFrames,
        sentMessages
    };
}

test('main removes every iframe after popup message', () => {
    const context = createContext(3);

    loadScript(mainScript, context);
    context.messageEvent.trigger('perform_iframe_removing');

    assertDeepEqual(context.removedFrames, [2, 1, 0]);
    assertDeepEqual(context.sentMessages, ['animate_browser_action_icon']);
});

test('main removes every iframe after shortcut message', () => {
    const context = createContext(2);

    loadScript(mainScript, context);
    context.messageEvent.trigger('shortcut_rm_iframes');

    assertDeepEqual(context.removedFrames, [1, 0]);
    assertDeepEqual(context.sentMessages, ['animate_browser_action_icon']);
});

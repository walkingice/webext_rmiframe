const path = require('path');
const {
    assertDeepEqual,
    createEvent,
    loadScript,
    test
} = require('./test_libs');

const mainScript = path.join(__dirname, '..', 'js', 'main.js');

function createContext(iframeCount, storedValues = {}, url = 'https://example.com/') {
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
    const scheduled = [];
    const scheduledDelays = [];

    return {
        browser: {
            runtime: {
                onMessage: messageEvent,
                sendMessage(message) {
                    sentMessages.push(message);
                }
            },
            storage: { local: { get: () => Promise.resolve(storedValues) } }
        },
        console: { error() {}, log() {} },
        document: { getElementsByTagName: () => frames },
        setTimeout() {},
        window: {
            location: { href: url },
            setTimeout(callback, delay) {
                scheduled.push({ callback, delay });
                scheduledDelays.push(delay);
            }
        },
        messageEvent,
        removedFrames,
        sentMessages,
        scheduled,
        scheduledDelays
    };
}

async function loadMain(context) {
    loadScript(mainScript, context);
    await new Promise((resolve) => setImmediate(resolve));
}

function runScheduled(context) {
    while (context.scheduled.length) {
        context.scheduled.shift().callback();
    }
}

test('main removes every iframe after popup message', async () => {
    const context = createContext(3);

    await loadMain(context);
    context.messageEvent.trigger('perform_iframe_removing');

    assertDeepEqual(context.removedFrames, [2, 1, 0]);
    assertDeepEqual(context.sentMessages, ['animate_browser_action_icon']);
});

test('main removes every iframe after shortcut message', async () => {
    const context = createContext(2);

    await loadMain(context);
    context.messageEvent.trigger('shortcut_rm_iframes');

    assertDeepEqual(context.removedFrames, [1, 0]);
    assertDeepEqual(context.sentMessages, ['animate_browser_action_icon']);
});

test('main schedules matching apply-list URLs with configured timing', async () => {
    const context = createContext(1, {
        enabled_auto_removing_doms: true,
        applylist_patterns_for_domain: ['example\\.com'],
        auto_removing_delay_seconds: 2,
        auto_removing_repeat_count: 3,
        auto_removing_period_seconds: 1
    });

    await loadMain(context);

    assertDeepEqual(context.scheduled.map((item) => item.delay), [2000]);
    runScheduled(context);
    assertDeepEqual(context.removedFrames, [0, 0, 0]);
    assertDeepEqual(context.scheduledDelays, [2000, 1000, 1000]);
});

test('main skips non-matching apply-list URLs', async () => {
    const context = createContext(1, {
        enabled_auto_removing_doms: true,
        applylist_patterns_for_domain: ['allowed\\.example'],
        auto_removing_repeat_count: 1
    });

    await loadMain(context);

    assertDeepEqual(context.scheduled, []);
});

test('main skips matching ignore-list URLs', async () => {
    const context = createContext(1, {
        enabled_auto_removing_doms: true,
        auto_removing_list_mode: 'ignore',
        ignorelist_patterns_for_domain: ['example\\.com'],
        auto_removing_repeat_count: 1
    });

    await loadMain(context);

    assertDeepEqual(context.scheduled, []);
});

test('main schedules all URLs for an empty ignore list', async () => {
    const context = createContext(1, {
        enabled_auto_removing_doms: true,
        auto_removing_list_mode: 'ignore',
        auto_removing_repeat_count: 1
    });

    await loadMain(context);
    runScheduled(context);

    assertDeepEqual(context.removedFrames, [0]);
});

test('main uses legacy apply-list patterns when needed', async () => {
    const context = createContext(1, {
        enabled_auto_removing_doms: true,
        enablelist_patterns_for_domain: ['example\\.com'],
        auto_removing_repeat_count: 1
    });

    await loadMain(context);
    runScheduled(context);

    assertDeepEqual(context.removedFrames, [0]);
});

test('main falls back to default timing for malformed values', async () => {
    const context = createContext(1, {
        enabled_auto_removing_doms: true,
        applylist_patterns_for_domain: ['example\\.com'],
        auto_removing_delay_seconds: -1,
        auto_removing_repeat_count: 1.5,
        auto_removing_period_seconds: 'invalid'
    });

    await loadMain(context);

    assertDeepEqual(context.scheduled.map((item) => item.delay), [0]);
    runScheduled(context);
    assertDeepEqual(context.removedFrames, Array(10).fill(0));
});

test('main ignores invalid URL patterns while checking matches', async () => {
    const context = createContext(1, {
        enabled_auto_removing_doms: true,
        applylist_patterns_for_domain: ['[', 'example\\.com'],
        auto_removing_repeat_count: 1
    });

    await loadMain(context);
    runScheduled(context);

    assertDeepEqual(context.removedFrames, [0]);
});

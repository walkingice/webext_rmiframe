const MSG_PERFORM_REMOVING = 'perform_iframe_removing';

browser.browserAction.onClicked.addListener((tab) => {
    browser.tabs.sendMessage(tab.id, MSG_PERFORM_REMOVING);
});

browser.commands.onCommand.addListener((cmd) => {
    // refer: https://developer.chrome.com/extensions/tabs
    // cannot user tabs.getCurrent() since this script
    // in running in background
    if (cmd === 'shortcut_rm_iframes') {
        browser.tabs.query({active: true}, (tabs) => {
            tabs.forEach((tab) => {
                browser.tabs.sendMessage(tab.id, cmd);
            });
        });
    }
});


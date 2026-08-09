(function () {
    const SHORTCUT_REMOVE = 'shortcut_rm_iframes';
    const MSG_ANIMATE_ICON = 'animate_browser_action_icon';
    const MSG_PERFORM_REMOVING = 'perform_iframe_removing';
    const TAG = 'iframe';
    const STORAGE_KEYS = {
        enabled: 'enabled_auto_removing_doms',
        legacyApplyList: 'enablelist_patterns_for_domain',
        applyList: 'applylist_patterns_for_domain',
        ignoreList: 'ignorelist_patterns_for_domain',
        mode: 'auto_removing_list_mode',
        delay: 'auto_removing_delay_seconds',
        repeat: 'auto_removing_repeat_count',
        period: 'auto_removing_period_seconds'
    };
    const DEFAULTS = { mode: 'apply', delay: 0, repeat: 10, period: 1 };

    function removeDom() {
        console.log('removing iframe doms!!');
        let index = 0;
        let element = document.getElementsByTagName(TAG);
        for (index = element.length - 1; index >= 0; index--) {
            element[index].parentNode.removeChild(element[index]);
        }
    }

    function getNumber(value, fallback, minimum) {
        const number = Number(value);
        return Number.isFinite(number) && number >= minimum ? number : fallback;
    }

    function getPositiveInteger(value, fallback) {
        const number = Number(value);
        return Number.isInteger(number) && number >= 1 ? number : fallback;
    }

    function matchesPattern(url, pattern) {
        try {
            return new RegExp(pattern).test(url);
        } catch (error) {
            console.error('Ignoring invalid URL pattern:', pattern);
            return false;
        }
    }

    function shouldRemove(url, settings) {
        const patterns = settings.mode === 'ignore'
            ? settings.ignoreList
            : settings.applyList;
        const matched = patterns.some((pattern) => matchesPattern(url, pattern));
        return settings.mode === 'ignore' ? !matched : matched;
    }

    function normalizeSettings(stored) {
        return {
            enabled: !!stored[STORAGE_KEYS.enabled],
            mode: stored[STORAGE_KEYS.mode] === 'ignore' ? 'ignore' : DEFAULTS.mode,
            applyList: Array.isArray(stored[STORAGE_KEYS.applyList])
                ? stored[STORAGE_KEYS.applyList]
                : (Array.isArray(stored[STORAGE_KEYS.legacyApplyList])
                    ? stored[STORAGE_KEYS.legacyApplyList] : []),
            ignoreList: Array.isArray(stored[STORAGE_KEYS.ignoreList])
                ? stored[STORAGE_KEYS.ignoreList] : [],
            delay: getNumber(stored[STORAGE_KEYS.delay], DEFAULTS.delay, 0),
            repeat: getPositiveInteger(stored[STORAGE_KEYS.repeat], DEFAULTS.repeat),
            period: getNumber(stored[STORAGE_KEYS.period], DEFAULTS.period, 0)
        };
    }

    function scheduleRemoving(settings) {
        let count = 0;
        const removeOnce = () => {
            removeDom();
            count += 1;
            if (count < settings.repeat) {
                window.setTimeout(removeOnce, settings.period * 1000);
            }
        };
        window.setTimeout(removeOnce, settings.delay * 1000);
    }

    function loadAutoRemoveSettings() {
        return browser.storage.local.get(Object.values(STORAGE_KEYS))
            .then(normalizeSettings);
    }

    function startAutoRemoving() {
        loadAutoRemoveSettings().then((settings) => {
            if (settings.enabled && shouldRemove(window.location.href, settings)) {
                scheduleRemoving(settings);
            }
        }).catch(() => {});
    }

    // to listen event from background script
    browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg === MSG_PERFORM_REMOVING) {
            browser.runtime.sendMessage(MSG_ANIMATE_ICON);
            removeDom();
        } else if (msg === SHORTCUT_REMOVE) {
            browser.runtime.sendMessage(MSG_ANIMATE_ICON);
            removeDom();
        }
    });

    startAutoRemoving();

})();

/* BrowserWrapper for easier development */
const BrowserWrapper = {};

(function () {
    let isInExtension = true
    // test environment
    try {
        !!browser.storage.local
    } catch (error) {
        isInExtension = false
    }

    if (isInExtension) {
        BrowserWrapper.setStorage = (key, value) => {
            var obj = {};
            obj[key] = value;
            browser.storage.local.set(obj)
        }
    } else {
        BrowserWrapper.setStorage = (key, value) => {
            window.localStorage.setItem(key, JSON.stringify(value))
        }
    }

    if (isInExtension) {
        BrowserWrapper.getStorage = (key) => {
            return browser.storage.local.get(key)
                .then((obj) => {
                    return obj[key]
                })
        }

    } else {
        BrowserWrapper.getStorage = (key) => {
            return Promise.resolve()
                .then(() => {
                    return JSON.parse(window.localStorage.getItem(key))
                })
        }

    }
})()

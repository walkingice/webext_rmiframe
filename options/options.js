(() => {
    /* options.js implementation */

    const OPTIONS_AUTO_ENABLED = 'enabled_auto_removing_doms';
    const OPTIONS_ENABLE_LIST_PATTERNS = 'enablelist_patterns_for_domain';

    const checkbox = document.getElementById('checkbox');
    const enableListInput = document.getElementById('enable-list-patterns-input');
    const enableListDisplay = document.getElementById('enable-list-patterns-display');


    enableListInput.addEventListener('input', (e) => { parseEnablelistInput() });

    function parseEnablelistInput() {
        let userInput = enableListInput.value
        if (!userInput) {
            return
        }
        const patterns = userInput
            .split('\n')
            .map(w => w.replace(/\s+/g, ""))
            .filter((w) => w.length > 0)
            .map(w => {
                try {
                    return new RegExp(w)
                } catch (error) {
                    console.error(error)
                }
            })
            .filter((p) => !!p)
            .map((p) => p.source)
        BrowserWrapper.setStorage(OPTIONS_ENABLE_LIST_PATTERNS, patterns)
        updateEnableList()
    }

    function updateEnableList() {
        enableListDisplay.innerHTML = ""
        BrowserWrapper.getStorage(OPTIONS_ENABLE_LIST_PATTERNS).then((patterns) => {
            if (!patterns) {
                return
            }
            const fragment = document.createDocumentFragment()
            patterns.forEach(p => {
                const dom = document.createElement("div")
                dom.innerText = p.toString()
                fragment.appendChild(dom)
            });
            enableListDisplay.appendChild(fragment)
        })
    }

    function updateCheckBox() {
        BrowserWrapper.getStorage(OPTIONS_AUTO_ENABLED).then((result) => {
            checkbox.checked = !!result;
        });
    }

    checkbox.addEventListener('change', () => {
        BrowserWrapper.setStorage(OPTIONS_AUTO_ENABLED, checkbox.checked)
    });

    // init
    parseEnablelistInput()
    updateCheckBox()
})();

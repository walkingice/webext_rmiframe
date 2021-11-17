(() => {
    /* options.js implementation */

    const OPTIONS_AUTO_ENABLED = 'enabled_auto_removing_doms';

    let checkbox = document.getElementById('checkbox');
    BrowserWrapper.getStorage(OPTIONS_AUTO_ENABLED).then((result) => {
        checkbox.checked = !!result;
    });

    checkbox.addEventListener('change', () => {
        BrowserWrapper.setStorage(OPTIONS_AUTO_ENABLED, checkbox.checked)
    });
})();

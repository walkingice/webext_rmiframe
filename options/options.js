(() => {
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

    const elements = {
        enabled: document.getElementById('auto-remove-checkbox'),
        settings: document.getElementById('auto-remove-settings'),
        summary: document.getElementById('summary-text'),
        applyRadio: document.getElementById('apply-list-radio'),
        ignoreRadio: document.getElementById('ignore-list-radio'),
        applyInput: document.getElementById('apply-list-input'),
        ignoreInput: document.getElementById('ignore-list-input'),
        applyAdd: document.getElementById('apply-list-add'),
        ignoreAdd: document.getElementById('ignore-list-add'),
        applyDisplay: document.getElementById('apply-list-display'),
        ignoreDisplay: document.getElementById('ignore-list-display'),
        delay: document.getElementById('delay-input'),
        repeat: document.getElementById('repeat-input'),
        period: document.getElementById('period-input')
    };
    const state = { enabled: false, mode: DEFAULTS.mode, applyList: [], ignoreList: [], ...DEFAULTS };

    function save(key, value) {
        BrowserWrapper.setStorage(key, value);
    }

    function getNumber(value, fallback, minimum) {
        const number = Number(value);
        return Number.isFinite(number) && number >= minimum ? number : fallback;
    }

    function updateSummary() {
        if (!state.enabled) {
            elements.summary.textContent = 'Auto Remove is off.';
            return;
        }
        const scope = state.mode === 'apply'
            ? 'On matching URLs'
            : 'On all URLs except ignored ones';
        elements.summary.textContent = `${scope}, remove iFrames ${state.repeat} ${unit(state.repeat, 'time')}, starting after ${state.delay} ${unit(state.delay, 'second')}, every ${state.period} ${unit(state.period, 'second')}.`;
    }

    function unit(value, name) {
        return value === 1 ? name : `${name}s`;
    }

    function updateEnabledState() {
        const applyActive = state.enabled && state.mode === 'apply';
        const ignoreActive = state.enabled && state.mode === 'ignore';
        elements.applyRadio.disabled = !state.enabled;
        elements.ignoreRadio.disabled = !state.enabled;
        setListDisabled('apply', !applyActive);
        setListDisabled('ignore', !ignoreActive);
        [elements.delay, elements.repeat, elements.period].forEach((element) => {
            element.disabled = !state.enabled;
        });
    }

    function setListDisabled(listName, disabled) {
        const input = elements[`${listName}Input`];
        const add = elements[`${listName}Add`];
        const display = elements[`${listName}Display`];
        input.disabled = disabled;
        add.disabled = disabled;
        display.querySelectorAll('button').forEach((button) => { button.disabled = disabled; });
    }

    function renderList(listName) {
        const display = elements[`${listName}Display`];
        const patterns = state[`${listName}List`];
        display.textContent = '';
        if (!patterns.length) {
            const empty = document.createElement('li');
            empty.className = 'empty-list';
            empty.textContent = 'No patterns yet.';
            display.appendChild(empty);
        } else {
            patterns.forEach((pattern, index) => display.appendChild(createPatternItem(listName, pattern, index)));
        }
        setListDisabled(listName, !state.enabled || state.mode !== listName);
    }

    function createPatternItem(listName, pattern, index) {
        const item = document.createElement('li');
        const value = document.createElement('span');
        const remove = document.createElement('button');
        item.className = 'pattern-item';
        value.className = 'pattern-value';
        value.textContent = pattern;
        remove.type = 'button';
        remove.textContent = 'Remove';
        remove.disabled = !state.enabled || state.mode !== listName;
        remove.addEventListener('click', () => removePattern(listName, index));
        item.appendChild(value);
        item.appendChild(remove);
        return item;
    }

    function addPattern(listName) {
        const input = elements[`${listName}Input`];
        if (!input.value.trim()) {
            return;
        }
        state[`${listName}List`].push(input.value);
        input.value = '';
        save(STORAGE_KEYS[`${listName}List`], state[`${listName}List`]);
        renderList(listName);
    }

    function removePattern(listName, index) {
        state[`${listName}List`].splice(index, 1);
        save(STORAGE_KEYS[`${listName}List`], state[`${listName}List`]);
        renderList(listName);
    }

    function updateMode(mode) {
        state.mode = mode;
        elements.applyRadio.checked = mode === 'apply';
        elements.ignoreRadio.checked = mode === 'ignore';
        save(STORAGE_KEYS.mode, mode);
        updateEnabledState();
        updateSummary();
    }

    function updateTiming(key, minimum) {
        const input = elements[key];
        state[key] = getNumber(input.value, DEFAULTS[key], minimum);
        input.value = state[key];
        save(STORAGE_KEYS[key], state[key]);
        updateSummary();
    }

    function bindEvents() {
        elements.enabled.addEventListener('change', () => {
            state.enabled = elements.enabled.checked;
            save(STORAGE_KEYS.enabled, state.enabled);
            updateEnabledState();
            updateSummary();
        });
        elements.applyRadio.addEventListener('change', () => updateMode('apply'));
        elements.ignoreRadio.addEventListener('change', () => updateMode('ignore'));
        ['apply', 'ignore'].forEach((name) => {
            elements[`${name}Add`].addEventListener('click', () => addPattern(name));
        });
        elements.delay.addEventListener('change', () => updateTiming('delay', 0));
        elements.repeat.addEventListener('change', () => updateTiming('repeat', 1));
        elements.period.addEventListener('change', () => updateTiming('period', 0));
    }

    function loadSettings() {
        return Promise.all(Object.keys(STORAGE_KEYS).map((name) => BrowserWrapper.getStorage(STORAGE_KEYS[name])))
            .then((values) => {
                const stored = {};
                Object.keys(STORAGE_KEYS).forEach((name, index) => {
                    stored[name] = values[index];
                });
                state.enabled = !!stored.enabled;
                state.mode = stored.mode === 'ignore' ? 'ignore' : DEFAULTS.mode;
                state.applyList = Array.isArray(stored.applyList) ? stored.applyList : (Array.isArray(stored.legacyApplyList) ? stored.legacyApplyList : []);
                state.ignoreList = Array.isArray(stored.ignoreList) ? stored.ignoreList : [];
                state.delay = getNumber(stored.delay, DEFAULTS.delay, 0);
                state.repeat = getNumber(stored.repeat, DEFAULTS.repeat, 1);
                state.period = getNumber(stored.period, DEFAULTS.period, 0);
                render();
            });
    }

    function render() {
        elements.enabled.checked = state.enabled;
        elements.enabled.disabled = false;
        elements.delay.value = state.delay;
        elements.repeat.value = state.repeat;
        elements.period.value = state.period;
        updateModeDisplay();
        renderList('apply');
        renderList('ignore');
        updateEnabledState();
        updateSummary();
    }

    function updateModeDisplay() {
        elements.applyRadio.checked = state.mode === 'apply';
        elements.ignoreRadio.checked = state.mode === 'ignore';
    }

    bindEvents();
    loadSettings();
})();

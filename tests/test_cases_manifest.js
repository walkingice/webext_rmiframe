const fs = require('fs');
const path = require('path');
const { assertTrue, test } = require('./test_libs');

const manifestPath = path.join(__dirname, '..', 'manifest.json');

function loadManifest() {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

test('manifest uses browser-specific settings for Firefox', () => {
    const manifest = loadManifest();

    assertTrue(!Object.hasOwn(manifest, 'applications'));
    assertTrue(Object.hasOwn(manifest, 'browser_specific_settings'));
    assertTrue(Object.hasOwn(manifest.browser_specific_settings, 'gecko'));
});

test('manifest declares that Firefox data collection is disabled', () => {
    const manifest = loadManifest();
    const permissions = manifest.browser_specific_settings.gecko
        .data_collection_permissions;

    assertTrue(Object.hasOwn(permissions, 'required'));
    assertTrue(permissions.required.length === 1);
    assertTrue(permissions.required[0] === 'none');
});

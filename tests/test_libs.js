const tests = [];
const fs = require('fs');
const vm = require('vm');

function test(name, callback) {
    tests.push({ name, callback });
}

function assertTrue(value, message) {
    if (!value) {
        throw new Error(message || 'Expected value to be true.');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}.`);
    }
}

function assertDeepEqual(actual, expected, message) {
    const actualJson = JSON.stringify(actual);
    const expectedJson = JSON.stringify(expected);

    if (actualJson !== expectedJson) {
        throw new Error(message || `Expected ${expectedJson}, got ${actualJson}.`);
    }
}

function createEvent() {
    const listeners = [];

    return {
        addListener(listener) {
            listeners.push(listener);
        },
        trigger(...args) {
            listeners.forEach((listener) => listener(...args));
        }
    };
}

function loadScript(filename, context) {
    const source = fs.readFileSync(filename, 'utf8');
    vm.runInNewContext(source, context, { filename });
}

async function run() {
    let failures = 0;

    for (const currentTest of tests) {
        try {
            await currentTest.callback();
            console.log(`PASS ${currentTest.name}`);
        } catch (error) {
            failures += 1;
            console.error(`FAIL ${currentTest.name}`);
            console.error(error.message);
        }
    }

    if (failures > 0) {
        process.exitCode = 1;
    }
}

module.exports = {
    assertDeepEqual,
    assertEqual,
    assertTrue,
    createEvent,
    loadScript,
    run,
    test
};

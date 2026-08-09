const tests = [];

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
    assertEqual,
    assertTrue,
    run,
    test
};

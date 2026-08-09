const fs = require('fs');
const path = require('path');
const { run } = require('./test_libs');

const testDirectory = __dirname;
const testFiles = fs.readdirSync(testDirectory)
    .filter((file) => /^test_cases_.*\.js$/.test(file))
    .sort();

testFiles.forEach((file) => {
    require(path.join(testDirectory, file));
});

run();

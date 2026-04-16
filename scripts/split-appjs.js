// scripts/split-appjs.js
// Extracts large sections from app.js into separate files in public/js/

const fs   = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, '../public/app.js');
const DEST = path.join(__dirname, '../public/js');

const lines = fs.readFileSync(SRC, 'utf8').split('\n');

function extract(ranges) {
    return ranges.map(([s, e]) => lines.slice(s - 1, e)).flat().join('\n');
}

const sections = [
    {
        file: 'emergency.js',
        ranges: [[1339, 1517]],
    },
    {
        file: 'mf-kit.js',
        ranges: [[1552, 2355]],
    },
    {
        file: 'fund-picker.js',
        ranges: [[2356, 2655]],
    },
    {
        file: 'health-score.js',
        ranges: [[2656, 3134]],
    },
    {
        file: 'fin-plan.js',
        ranges: [[3136, 4835]],
    },
];

// Write each extracted file
sections.forEach(({ file, ranges }) => {
    const content = extract(ranges);
    const outPath = path.join(DEST, file);
    fs.writeFileSync(outPath, content, 'utf8');
    const lineCount = content.split('\n').length;
    console.log(`Wrote ${file} (${lineCount} lines)`);
});

// Build new app.js: keep everything except the extracted ranges
const extractedRanges = sections.flatMap(s => s.ranges).sort((a, b) => a[0] - b[0]);

// Build set of line numbers to remove (1-based)
const toRemove = new Set();
extractedRanges.forEach(([s, e]) => {
    for (let i = s; i <= e; i++) toRemove.add(i);
});

const remaining = lines.filter((_, idx) => !toRemove.has(idx + 1)).join('\n');
fs.writeFileSync(SRC, remaining, 'utf8');

const newLines = remaining.split('\n').length;
console.log(`\napp.js updated: ${newLines} lines (was ${lines.length})`);
console.log('Done.');

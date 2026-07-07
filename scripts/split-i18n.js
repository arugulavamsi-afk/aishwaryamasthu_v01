#!/usr/bin/env node
/**
 * split-i18n.js — one-time (re-runnable) extraction of non-English dictionaries
 * out of public/js/i18n.js into public/i18n/{hi,te,ta}.json.
 *
 * What it does:
 *   1. Evals the current public/js/i18n.js in a sandbox to capture all
 *      language-keyed dictionary objects.
 *   2. Writes public/i18n/<lang>.json for hi/te/ta with shape
 *      { "_T": {...}, "_MF_NAMES": {...}, ... } (only dicts that have that lang).
 *   3. Slims i18n.js by TEXT SURGERY: deletes the `hi: {...},` / `te:` / `ta:`
 *      sub-blocks of each dictionary object, preserving every comment and
 *      helper function byte-for-byte. English stays inline as the fallback.
 *   4. Verifies: evals the slimmed file, merges the JSON files back in, and
 *      deep-compares against the original eval. Aborts (writes nothing to
 *      i18n.js) on any mismatch.
 *
 * Usage: node scripts/split-i18n.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const I18N_PATH = path.join(__dirname, '..', 'public', 'js', 'i18n.js');
const OUT_DIR = path.join(__dirname, '..', 'public', 'i18n');

/* Language-keyed dictionary objects to split (order as they appear in the file) */
const DICT_NAMES = [
    '_T', '_MF_NAMES', '_MF_TAGS', '_MF_CATS', '_MF_RISKS',
    '_MM_NAMES', '_MM_TAGS', '_MM_GOODLABEL', '_MM_BADLABEL', '_MF_BODY'
];
const SPLIT_LANGS = ['hi', 'te', 'ta'];

/* ── Sandbox eval: capture the dictionaries ─────────────────── */
function evalI18n(source) {
    const sandbox = {
        document: { addEventListener() {}, querySelectorAll() { return []; }, getElementById() { return null; } },
        localStorage: { getItem() { return null; }, setItem() {} },
        window: {},
        console
    };
    sandbox.window = sandbox;
    vm.runInNewContext(source, sandbox, { filename: 'i18n.js' });
    return sandbox;
}

/* ── Scanner: find the char range of `<lang>: { ... }` sub-blocks ──
 * String/comment-aware so braces inside translation text don't break matching. */
function scanCode(src, onCodeChar) {
    let i = 0;
    const n = src.length;
    let state = 'code'; // code | squote | dquote | template | line-comment | block-comment
    while (i < n) {
        const c = src[i], c2 = src[i + 1];
        if (state === 'code') {
            if (c === "'") state = 'squote';
            else if (c === '"') state = 'dquote';
            else if (c === '`') state = 'template';
            else if (c === '/' && c2 === '/') { state = 'line-comment'; i++; }
            else if (c === '/' && c2 === '*') { state = 'block-comment'; i++; }
            else if (onCodeChar(c, i) === false) return;
        } else if (state === 'squote') {
            if (c === '\\') i++;
            else if (c === "'") state = 'code';
        } else if (state === 'dquote') {
            if (c === '\\') i++;
            else if (c === '"') state = 'code';
        } else if (state === 'template') {
            if (c === '\\') i++;
            else if (c === '`') state = 'code';
        } else if (state === 'line-comment') {
            if (c === '\n') state = 'code';
        } else if (state === 'block-comment') {
            if (c === '*' && c2 === '/') { state = 'code'; i++; }
        }
        i++;
    }
}

/* Find `var NAME = {` and return { open, close } indices of the object braces */
function findObjectSpan(src, name) {
    const decl = new RegExp('var\\s+' + name + '\\s*=\\s*\\{');
    const m = decl.exec(src);
    if (!m) throw new Error('Declaration not found: var ' + name);
    const open = m.index + m[0].length - 1; // index of '{'
    let depth = 0, close = -1;
    scanCode(src.slice(open), function (c, rel) {
        if (c === '{') depth++;
        else if (c === '}') {
            depth--;
            if (depth === 0) { close = open + rel; return false; }
        }
    });
    if (close < 0) throw new Error('Unbalanced braces for ' + name);
    return { open, close };
}

/* Within an object span, find depth-1 sub-blocks `hi: { ... }` (+ trailing comma) */
function findLangBlocks(src, span, langs) {
    const blocks = [];
    let depth = 0;
    let pendingKey = null; // { lang, keyStart } when we saw `<lang>:` at depth 1
    let blockOpen = -1, blockLang = null, blockKeyStart = -1, blockDepth = -1;

    scanCode(src.slice(span.open, span.close + 1), function (c, rel) {
        const abs = span.open + rel;
        if (c === '{') {
            depth++;
            if (pendingKey && depth === 2) {
                blockOpen = abs; blockLang = pendingKey.lang;
                blockKeyStart = pendingKey.keyStart; blockDepth = depth;
                pendingKey = null;
            }
        } else if (c === '}') {
            if (blockOpen >= 0 && depth === blockDepth) {
                let end = abs;
                // swallow a trailing comma
                let j = abs + 1;
                while (j < src.length && /\s/.test(src[j])) j++;
                if (src[j] === ',') end = j;
                blocks.push({ lang: blockLang, start: blockKeyStart, end });
                blockOpen = -1; blockLang = null;
            }
            depth--;
        } else if (depth === 1 && blockOpen < 0) {
            // detect `<lang>` identifier followed by `:` at depth 1
            for (const lang of langs) {
                if (src.startsWith(lang, abs) &&
                    !/[A-Za-z0-9_$]/.test(src[abs - 1] || '') &&
                    /^\s*:/.test(src.slice(abs + lang.length, abs + lang.length + 20))) {
                    pendingKey = { lang, keyStart: abs };
                    break;
                }
            }
        }
    });
    return blocks;
}

function main() {
    const original = fs.readFileSync(I18N_PATH, 'utf8');
    const origEval = evalI18n(original);

    if (!origEval._T || !origEval._T.hi) {
        console.error('i18n.js already contains only English — nothing to split. ' +
            '(Re-running would overwrite public/i18n/*.json with empty payloads.)');
        process.exit(1);
    }

    /* ── 1. Build per-language JSON payloads ── */
    const payloads = {};
    for (const lang of SPLIT_LANGS) payloads[lang] = {};
    for (const name of DICT_NAMES) {
        const dict = origEval[name];
        if (!dict) throw new Error('Dictionary missing after eval: ' + name);
        for (const lang of SPLIT_LANGS) {
            if (dict[lang]) payloads[lang][name] = dict[lang];
        }
    }

    /* ── 2. Text surgery: remove hi/te/ta sub-blocks from each dict ── */
    const cuts = [];
    for (const name of DICT_NAMES) {
        const span = findObjectSpan(original, name);
        const blocks = findLangBlocks(original, span, SPLIT_LANGS);
        const found = blocks.map(b => b.lang).sort().join(',');
        const expected = SPLIT_LANGS.filter(l => origEval[name][l]).sort().join(',');
        if (found !== expected) {
            throw new Error(name + ': expected lang blocks [' + expected + '] but found [' + found + ']');
        }
        cuts.push(...blocks);
    }
    cuts.sort((a, b) => b.start - a.start); // delete from the end backwards
    let slimmed = original;
    for (const cut of cuts) {
        // also trim whitespace-only lead back to the previous newline
        let s = cut.start;
        while (s > 0 && (slimmed[s - 1] === ' ' || slimmed[s - 1] === '\t')) s--;
        if (slimmed[s - 1] === '\n') s--;
        slimmed = slimmed.slice(0, s) + slimmed.slice(cut.end + 1);
    }

    /* ── 3. Verify: slimmed + JSONs === original ── */
    const slimEval = evalI18n(slimmed);
    let checked = 0;
    for (const name of DICT_NAMES) {
        const orig = origEval[name];
        const merged = JSON.parse(JSON.stringify(slimEval[name]));
        for (const lang of SPLIT_LANGS) {
            if (payloads[lang][name]) merged[lang] = payloads[lang][name];
        }
        const a = JSON.stringify(sortKeys(orig));
        const b = JSON.stringify(sortKeys(merged));
        if (a !== b) throw new Error('Verification mismatch in ' + name);
        checked += Object.keys(orig.en || {}).length;
    }

    /* ── 4. Write everything ── */
    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const lang of SPLIT_LANGS) {
        const out = path.join(OUT_DIR, lang + '.json');
        fs.writeFileSync(out, JSON.stringify(payloads[lang], null, 1) + '\n', 'utf8');
        console.log('wrote %s (%d KB)', out, Math.round(fs.statSync(out).size / 1024));
    }
    fs.writeFileSync(I18N_PATH, slimmed, 'utf8');
    console.log('slimmed %s: %d KB -> %d KB', I18N_PATH,
        Math.round(Buffer.byteLength(original) / 1024),
        Math.round(Buffer.byteLength(slimmed) / 1024));
    console.log('verified %d dictionaries (%d en keys) — parity OK', DICT_NAMES.length, checked);
}

function sortKeys(obj) {
    if (Array.isArray(obj)) return obj.map(sortKeys);
    if (obj && typeof obj === 'object') {
        const out = {};
        for (const k of Object.keys(obj).sort()) out[k] = sortKeys(obj[k]);
        return out;
    }
    return obj;
}

main();

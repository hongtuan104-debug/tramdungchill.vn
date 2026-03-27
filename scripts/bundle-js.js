/***
 * bundle-js.js
 * Bundles and minifies JavaScript files for production.
 * Zero npm dependencies — only Node built-ins (fs, path).
 *
 * Output:
 *   dist/common.min.js  — shared modules (layout-loader, utils, schema-generator, navbar, i18n, scroll-ui, app)
 *   dist/index.min.js   — index page specific (hero, menu-renderer, gallery, booking)
 *   dist/blog.min.js    — blog page specific (blog-renderer)
 *   dist/menu.min.js    — menu page specific (menu-page-renderer)
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

// ── File groups ──────────────────────────────────────────────

const COMMON_FILES = [
    "components/layout-loader.js",
    "js/utils.js",
    "js/schema-generator.js",
    "js/navbar.js",
    "js/i18n.js",
    "js/scroll-ui.js",
    "js/app.js"
];

const INDEX_FILES = [
    "js/hero.js",
    "js/menu-renderer.js",
    "js/gallery.js",
    "js/booking.js"
];

const BLOG_FILES = [
    "js/blog-renderer.js"
];

const MENU_FILES = [
    "js/menu-page-renderer.js"
];

// ── Simple minifier (no npm deps) ───────────────────────────

function minify(source) {
    let out = source;

    // Remove multi-line comments (but keep conditional / license comments starting with /*!)
    out = out.replace(/\/\*(?!\!)[\s\S]*?\*\//g, "");

    // Remove single-line comments (careful not to strip URLs like https://)
    // Only remove // comments that appear at the start of a line or after whitespace/semicolons
    out = out.replace(/(^|[\s;,{}()])\/\/(?![\/\*]).*$/gm, "$1");

    // Collapse multiple blank lines into one newline
    out = out.replace(/\n{3,}/g, "\n\n");

    // Trim trailing whitespace on each line
    out = out.replace(/[ \t]+$/gm, "");

    // Collapse runs of spaces/tabs (but not newlines) into a single space
    out = out.replace(/[ \t]{2,}/g, " ");

    // Remove leading whitespace on each line (indentation)
    out = out.replace(/^[ \t]+/gm, "");

    // Remove empty lines
    out = out.replace(/^\s*\n/gm, "");

    return out.trim() + "\n";
}

// ── Concatenate & minify a list of relative paths ────────────

function bundle(files, outName) {
    const parts = [];
    for (const rel of files) {
        const abs = path.join(ROOT, rel);
        if (!fs.existsSync(abs)) {
            console.error("  WARNING: file not found — " + rel);
            continue;
        }
        const src = fs.readFileSync(abs, "utf8");
        // Add a separator comment so we can debug later
        parts.push("/* --- " + rel + " --- */");
        parts.push(src);
    }
    const concatenated = parts.join("\n");
    const minified = minify(concatenated);
    const outPath = path.join(DIST, outName);
    fs.writeFileSync(outPath, minified, "utf8");

    const origSize = Buffer.byteLength(concatenated, "utf8");
    const minSize = Buffer.byteLength(minified, "utf8");
    const pct = origSize ? Math.round((1 - minSize / origSize) * 100) : 0;
    console.log(
        "  " + outName + "  " +
        (origSize / 1024).toFixed(1) + " KB → " +
        (minSize / 1024).toFixed(1) + " KB  (" + pct + "% smaller)"
    );
    return outPath;
}

// ── Main ─────────────────────────────────────────────────────

console.log("Bundling JavaScript...");

if (!fs.existsSync(DIST)) {
    fs.mkdirSync(DIST, { recursive: true });
    console.log("  Created dist/ directory");
}

const outputs = [];
outputs.push(bundle(COMMON_FILES, "common.min.js"));
outputs.push(bundle(INDEX_FILES, "index.min.js"));
outputs.push(bundle(BLOG_FILES, "blog.min.js"));
outputs.push(bundle(MENU_FILES, "menu.min.js"));

// ── Syntax-check each bundle ─────────────────────────────────

console.log("\nVerifying syntax...");
const { execSync } = require("child_process");
let allOk = true;
for (const filePath of outputs) {
    try {
        execSync("node -c " + JSON.stringify(filePath), { stdio: "pipe" });
        console.log("  OK  " + path.basename(filePath));
    } catch (e) {
        console.error("  FAIL  " + path.basename(filePath));
        console.error(e.stderr ? e.stderr.toString() : e.message);
        allOk = false;
    }
}

if (!allOk) {
    console.error("\nSyntax errors found! Please fix before deploying.");
    process.exit(1);
}

console.log("\nDone! " + outputs.length + " bundles written to dist/");

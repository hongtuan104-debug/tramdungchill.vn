/***
 * convert-webp.js
 * Converts all .jpg files in assets/images/blog/ to .webp format using sharp
 * Quality: 80 | Keeps original .jpg files as fallback
 */

"use strict";

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const BLOG_IMG_DIR = path.resolve(__dirname, "..", "assets", "images", "blog");
const QUALITY = 80;

async function main() {
    const files = fs.readdirSync(BLOG_IMG_DIR).filter(f => f.toLowerCase().endsWith(".jpg"));
    console.log(`Found ${files.length} .jpg files in ${BLOG_IMG_DIR}`);

    let totalJpgSize = 0;
    let totalWebpSize = 0;
    let converted = 0;
    let skipped = 0;

    for (const file of files) {
        const jpgPath = path.join(BLOG_IMG_DIR, file);
        const webpName = file.replace(/\.jpg$/i, ".webp");
        const webpPath = path.join(BLOG_IMG_DIR, webpName);

        try {
            const jpgStat = fs.statSync(jpgPath);
            totalJpgSize += jpgStat.size;

            await sharp(jpgPath)
                .webp({ quality: QUALITY })
                .toFile(webpPath);

            const webpStat = fs.statSync(webpPath);
            totalWebpSize += webpStat.size;

            const savings = ((1 - webpStat.size / jpgStat.size) * 100).toFixed(1);
            console.log(`  [${converted + 1}/${files.length}] ${file} → ${webpName}  (${(jpgStat.size / 1024).toFixed(0)}KB → ${(webpStat.size / 1024).toFixed(0)}KB, -${savings}%)`);
            converted++;
        } catch (err) {
            console.error(`  ERROR: ${file} — ${err.message}`);
            skipped++;
        }
    }

    console.log("\n=== Summary ===");
    console.log(`Converted: ${converted} files`);
    if (skipped > 0) console.log(`Skipped:   ${skipped} files`);
    console.log(`Total JPG size:  ${(totalJpgSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total WebP size: ${(totalWebpSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total savings:   ${((totalJpgSize - totalWebpSize) / 1024 / 1024).toFixed(2)} MB (${((1 - totalWebpSize / totalJpgSize) * 100).toFixed(1)}%)`);
}

main().catch(err => {
    console.error("Fatal:", err);
    process.exit(1);
});

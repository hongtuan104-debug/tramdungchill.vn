/***
 * generate-responsive-images.js
 * Creates responsive image variants (400w, 800w) in .webp format
 * for ALL .jpg files in assets/images/blog/
 *
 * Output: {name}-400w.webp and {name}-800w.webp alongside originals
 * Quality: 75 for 400w, 80 for 800w
 */

"use strict";

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const BLOG_IMG_DIR = path.resolve(__dirname, "..", "assets", "images", "blog");

const SIZES = [
    { suffix: "-400w", width: 400, quality: 75 },
    { suffix: "-800w", width: 800, quality: 80 },
];

// Process images in batches to avoid memory issues
const BATCH_SIZE = 10;

async function main() {
    const allFiles = fs.readdirSync(BLOG_IMG_DIR);
    const jpgFiles = allFiles.filter(f => f.toLowerCase().endsWith(".jpg"));

    console.log(`Found ${jpgFiles.length} .jpg files in ${BLOG_IMG_DIR}`);
    console.log(`Generating ${SIZES.length} responsive variants per image...`);

    let created = 0;
    let skipped = 0;
    let errors = 0;
    let totalSize = 0;

    for (let b = 0; b < jpgFiles.length; b += BATCH_SIZE) {
        const batch = jpgFiles.slice(b, b + BATCH_SIZE);
        const promises = batch.map(async (file) => {
            const jpgPath = path.join(BLOG_IMG_DIR, file);
            const baseName = file.replace(/\.jpg$/i, "");

            for (const size of SIZES) {
                const outName = baseName + size.suffix + ".webp";
                const outPath = path.join(BLOG_IMG_DIR, outName);

                // Skip if already exists
                if (fs.existsSync(outPath)) {
                    skipped++;
                    continue;
                }

                try {
                    await sharp(jpgPath)
                        .resize(size.width, null, { withoutEnlargement: true })
                        .webp({ quality: size.quality })
                        .toFile(outPath);

                    const stat = fs.statSync(outPath);
                    totalSize += stat.size;
                    created++;
                } catch (err) {
                    console.error(`  ERROR: ${file} → ${outName}: ${err.message}`);
                    errors++;
                }
            }
        });

        await Promise.all(promises);
        const progress = Math.min(b + BATCH_SIZE, jpgFiles.length);
        process.stdout.write(`\r  Progress: ${progress}/${jpgFiles.length} images processed`);
    }

    console.log("\n\n=== Summary ===");
    console.log(`Source images:    ${jpgFiles.length}`);
    console.log(`Variants created: ${created}`);
    if (skipped > 0) console.log(`Already existed:  ${skipped}`);
    if (errors > 0) console.log(`Errors:           ${errors}`);
    console.log(`Total new size:   ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log("Done!");
}

main().catch(err => {
    console.error("Fatal:", err);
    process.exit(1);
});

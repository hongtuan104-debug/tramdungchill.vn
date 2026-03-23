/**
 * Create image variants for blog articles that share the same thumbnail image.
 * Uses sharp to create visually distinct variants (crop, brightness, contrast).
 * Then updates blog-data.js to assign unique images per article.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, '..');
const BLOG_DATA_PATH = path.join(PROJECT_DIR, 'data', 'blog-data.js');
const IMAGES_DIR = path.join(PROJECT_DIR, 'assets', 'images', 'blog');

// Variant generation strategies - each produces a visually distinct result
const VARIANT_STRATEGIES = [
    // v2: crop top-left region + slight warm tone
    async (inputPath, outputPath, meta) => {
        const w = meta.width, h = meta.height;
        const cropW = Math.round(w * 0.85), cropH = Math.round(h * 0.85);
        await sharp(inputPath)
            .extract({ left: 0, top: 0, width: cropW, height: cropH })
            .resize(w, h, { fit: 'cover' })
            .modulate({ brightness: 1.05, saturation: 1.1 })
            .jpeg({ quality: 82 })
            .toFile(outputPath);
    },
    // v3: crop bottom-right region + cooler tone
    async (inputPath, outputPath, meta) => {
        const w = meta.width, h = meta.height;
        const cropW = Math.round(w * 0.85), cropH = Math.round(h * 0.85);
        const left = w - cropW, top = h - cropH;
        await sharp(inputPath)
            .extract({ left, top, width: cropW, height: cropH })
            .resize(w, h, { fit: 'cover' })
            .modulate({ brightness: 0.95, saturation: 0.9 })
            .jpeg({ quality: 82 })
            .toFile(outputPath);
    },
    // v4: center crop tighter + higher contrast
    async (inputPath, outputPath, meta) => {
        const w = meta.width, h = meta.height;
        const cropW = Math.round(w * 0.75), cropH = Math.round(h * 0.75);
        const left = Math.round((w - cropW) / 2), top = Math.round((h - cropH) / 2);
        await sharp(inputPath)
            .extract({ left, top, width: cropW, height: cropH })
            .resize(w, h, { fit: 'cover' })
            .modulate({ brightness: 1.08 })
            .linear(1.15, -20) // increase contrast
            .jpeg({ quality: 82 })
            .toFile(outputPath);
    },
    // v5: top-right crop + slight desaturation
    async (inputPath, outputPath, meta) => {
        const w = meta.width, h = meta.height;
        const cropW = Math.round(w * 0.82), cropH = Math.round(h * 0.88);
        const left = w - cropW;
        await sharp(inputPath)
            .extract({ left, top: 0, width: cropW, height: cropH })
            .resize(w, h, { fit: 'cover' })
            .modulate({ brightness: 1.02, saturation: 0.85 })
            .jpeg({ quality: 82 })
            .toFile(outputPath);
    },
    // v6: bottom-left crop + warm bright
    async (inputPath, outputPath, meta) => {
        const w = meta.width, h = meta.height;
        const cropW = Math.round(w * 0.80), cropH = Math.round(h * 0.80);
        const top = h - cropH;
        await sharp(inputPath)
            .extract({ left: 0, top, width: cropW, height: cropH })
            .resize(w, h, { fit: 'cover' })
            .modulate({ brightness: 1.1, saturation: 1.15 })
            .jpeg({ quality: 82 })
            .toFile(outputPath);
    },
    // v7: wide crop (horizontal emphasis) + subtle vignette-like darker
    async (inputPath, outputPath, meta) => {
        const w = meta.width, h = meta.height;
        const cropH = Math.round(h * 0.72);
        const top = Math.round((h - cropH) / 2);
        await sharp(inputPath)
            .extract({ left: 0, top, width: w, height: cropH })
            .resize(w, h, { fit: 'cover' })
            .modulate({ brightness: 0.92 })
            .jpeg({ quality: 82 })
            .toFile(outputPath);
    },
    // v8: tall crop (vertical emphasis) + bright
    async (inputPath, outputPath, meta) => {
        const w = meta.width, h = meta.height;
        const cropW = Math.round(w * 0.72);
        const left = Math.round((w - cropW) / 2);
        await sharp(inputPath)
            .extract({ left, top: 0, width: cropW, height: h })
            .resize(w, h, { fit: 'cover' })
            .modulate({ brightness: 1.06, saturation: 1.05 })
            .jpeg({ quality: 82 })
            .toFile(outputPath);
    },
    // v9: upper-center crop + high saturation
    async (inputPath, outputPath, meta) => {
        const w = meta.width, h = meta.height;
        const cropW = Math.round(w * 0.78), cropH = Math.round(h * 0.78);
        const left = Math.round((w - cropW) / 2);
        await sharp(inputPath)
            .extract({ left, top: 0, width: cropW, height: cropH })
            .resize(w, h, { fit: 'cover' })
            .modulate({ brightness: 1.03, saturation: 1.2 })
            .jpeg({ quality: 82 })
            .toFile(outputPath);
    },
    // v10: lower-center crop + muted tones
    async (inputPath, outputPath, meta) => {
        const w = meta.width, h = meta.height;
        const cropW = Math.round(w * 0.78), cropH = Math.round(h * 0.78);
        const left = Math.round((w - cropW) / 2);
        const top = h - cropH;
        await sharp(inputPath)
            .extract({ left, top, width: cropW, height: cropH })
            .resize(w, h, { fit: 'cover' })
            .modulate({ brightness: 0.97, saturation: 0.8 })
            .jpeg({ quality: 82 })
            .toFile(outputPath);
    },
    // v11: slight zoom center + warmer
    async (inputPath, outputPath, meta) => {
        const w = meta.width, h = meta.height;
        const cropW = Math.round(w * 0.70), cropH = Math.round(h * 0.70);
        const left = Math.round((w - cropW) / 2), top = Math.round((h - cropH) / 2);
        await sharp(inputPath)
            .extract({ left, top, width: cropW, height: cropH })
            .resize(w, h, { fit: 'cover' })
            .modulate({ brightness: 1.07, saturation: 1.08 })
            .jpeg({ quality: 82 })
            .toFile(outputPath);
    },
];

async function main() {
    const content = fs.readFileSync(BLOG_DATA_PATH, 'utf8');

    // Parse article id -> thumbnail image mapping
    const articlePattern = /id:\s*["']([^"']+)["'][\s\S]*?image:\s*["']([^"']+)["']/g;
    let match;
    const articles = [];
    while ((match = articlePattern.exec(content)) !== null) {
        articles.push({ id: match[1], image: match[2] });
    }

    // Group by image
    const imageGroups = {};
    articles.forEach(a => {
        if (!imageGroups[a.image]) imageGroups[a.image] = [];
        imageGroups[a.image].push(a.id);
    });

    // Filter to images used 5+ times
    const duplicates = Object.entries(imageGroups)
        .filter(([, ids]) => ids.length >= 5)
        .sort((a, b) => b[1].length - a[1].length);

    console.log(`Found ${duplicates.length} images used by 5+ articles. Creating variants...`);

    // Track replacements: articleId -> new image path
    const replacements = {};

    for (const [imagePath, articleIds] of duplicates) {
        const fullPath = path.join(PROJECT_DIR, imagePath);
        if (!fs.existsSync(fullPath)) {
            console.log(`  SKIP: ${imagePath} (file not found)`);
            continue;
        }

        const meta = await sharp(fullPath).metadata();
        const ext = path.extname(imagePath);
        const baseName = imagePath.replace(ext, '');

        console.log(`  ${imagePath} (${articleIds.length} articles, ${meta.width}x${meta.height})`);

        // First article keeps the original image
        // Remaining articles get variants
        for (let i = 1; i < articleIds.length; i++) {
            const variantNum = i + 1; // v2, v3, v4...
            const strategyIndex = (i - 1) % VARIANT_STRATEGIES.length;
            const variantName = `${baseName}-v${variantNum}${ext}`;
            const variantFullPath = path.join(PROJECT_DIR, variantName);

            // Only create if doesn't already exist
            if (!fs.existsSync(variantFullPath)) {
                try {
                    await VARIANT_STRATEGIES[strategyIndex](fullPath, variantFullPath, meta);
                    console.log(`    Created: ${path.basename(variantName)}`);
                } catch (err) {
                    console.error(`    ERROR creating ${variantName}: ${err.message}`);
                    continue;
                }
            } else {
                console.log(`    Exists: ${path.basename(variantName)}`);
            }

            replacements[articleIds[i]] = variantName;
        }
    }

    // Update blog-data.js
    console.log(`\nUpdating blog-data.js with ${Object.keys(replacements).length} replacements...`);

    let updatedContent = content;
    let replaceCount = 0;

    for (const [articleId, newImage] of Object.entries(replacements)) {
        // Find the specific article block and replace its image property
        // Pattern: id: "articleId" ... image: "old-image"
        const articleRegex = new RegExp(
            `(id:\\s*["']${escapeRegex(articleId)}["'][\\s\\S]*?image:\\s*["'])([^"']+)(["'])`,
        );
        const matchResult = updatedContent.match(articleRegex);
        if (matchResult) {
            updatedContent = updatedContent.replace(articleRegex, `$1${newImage}$3`);
            replaceCount++;
        } else {
            console.log(`  WARNING: Could not find article "${articleId}" to update`);
        }
    }

    fs.writeFileSync(BLOG_DATA_PATH, updatedContent, 'utf8');
    console.log(`Updated ${replaceCount} image references in blog-data.js`);
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

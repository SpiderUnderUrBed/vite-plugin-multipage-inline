import glob from 'tiny-glob';
import path from 'path';
import fs from 'fs';
import * as cheerio from 'cheerio';
export default function inlineEverythingPlugin(options) {
    const { buildDir = 'build', cleanUp = false } = options || {};
    return {
        name: 'inline-everything',
        apply: 'build',
        closeBundle: async () => {
            const resolvedBuildDir = path.resolve(process.cwd(), buildDir);
            const htmlFiles = await glob('**/*.html', {
                cwd: resolvedBuildDir,
                absolute: true
            });
            const assetFiles = await glob('**/_app/immutable/**/*.{css,js}', {
                cwd: resolvedBuildDir,
                absolute: true
            });
            const assetMap = new Map();
            assetFiles.forEach(file => {
                assetMap.set(path.basename(file), file);
            });
            for (const htmlFile of htmlFiles) {
                let html = fs.readFileSync(htmlFile, 'utf8');
                const load_html = cheerio.load(html);
                load_html('link[rel="stylesheet"]').each((i, el) => {
                    const href = load_html(el).attr('href');
                    if (href) {
                        const filename = path.basename(href);
                        if (assetMap.has(filename)) {
                            try {
                                const cssContent = fs.readFileSync(assetMap.get(filename), 'utf8');
                                load_html(el).replaceWith(`<style>${cssContent}</style>`);
                            }
                            catch (e) {
                                console.warn(`Failed to inline CSS ${filename}:`, e.message);
                            }
                        }
                    }
                });
                load_html('script[type="module"][src]').each((i, el) => {
                    const src = load_html(el).attr('src');
                    if (src) {
                        const filename = path.basename(src);
                        if (assetMap.has(filename)) {
                            try {
                                const jsContent = fs.readFileSync(assetMap.get(filename), 'utf8');
                                load_html(el).replaceWith(`<script type="module">${jsContent}</script>`);
                            }
                            catch (e) {
                                console.warn(`Failed to inline JS ${filename}:`, e.message);
                            }
                        }
                    }
                });
                load_html('link[rel="modulepreload"]').remove();
                load_html('link[rel="preload"]').remove();
                load_html('script[data-sveltekit-hydrate]').remove();
                fs.writeFileSync(htmlFile, load_html.html());
            }
            if (cleanUp) {
                try {
                    fs.rmSync(path.join(resolvedBuildDir, '_app'), { recursive: true });
                }
                catch (e) {
                    console.warn('Could not clean up _app directory:', e.message);
                }
            }
        }
    };
}

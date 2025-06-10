"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = inlineEverythingPlugin;
const tiny_glob_1 = __importDefault(require("tiny-glob"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cheerio = __importStar(require("cheerio"));
function inlineEverythingPlugin(options) {
    const { buildDir = 'build', cleanUp = true } = options || {};
    return {
        name: 'inline-everything',
        apply: 'build',
        closeBundle: () => __awaiter(this, void 0, void 0, function* () {
            const resolvedBuildDir = path_1.default.resolve(process.cwd(), buildDir);
            const htmlFiles = yield (0, tiny_glob_1.default)('**/*.html', {
                cwd: resolvedBuildDir,
                absolute: true
            });
            const assetFiles = yield (0, tiny_glob_1.default)('**/_app/immutable/**/*.{css,js}', {
                cwd: resolvedBuildDir,
                absolute: true
            });
            const assetMap = new Map();
            assetFiles.forEach(file => {
                assetMap.set(path_1.default.basename(file), file);
            });
            for (const htmlFile of htmlFiles) {
                let html = fs_1.default.readFileSync(htmlFile, 'utf8');
                const load_html = cheerio.load(html);
                load_html('link[rel="stylesheet"]').each((i, el) => {
                    const href = load_html(el).attr('href');
                    if (href) {
                        const filename = path_1.default.basename(href);
                        if (assetMap.has(filename)) {
                            try {
                                const cssContent = fs_1.default.readFileSync(assetMap.get(filename), 'utf8');
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
                        const filename = path_1.default.basename(src);
                        if (assetMap.has(filename)) {
                            try {
                                const jsContent = fs_1.default.readFileSync(assetMap.get(filename), 'utf8');
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
                fs_1.default.writeFileSync(htmlFile, load_html.html());
            }
            if (cleanUp) {
                try {
                    fs_1.default.rmSync(path_1.default.join(resolvedBuildDir, '_app'), { recursive: true });
                }
                catch (e) {
                    console.warn('Could not clean up _app directory:', e.message);
                }
            }
        })
    };
}

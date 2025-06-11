import { type Plugin } from 'vite';
export interface InlineEverythingOptions {
    /**
     * Dir where the build files are located (default: 'build')
     */
    buildDir?: string;
    /**
     * If the plugin should remove the _app directory after inlining (default: true)
     */
    cleanUp?: boolean;
}
export default function inlineEverythingPlugin(options?: InlineEverythingOptions): Plugin;

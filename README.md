This is intended for svelte, I have not tested this package on other platforms. 
This plugin will take a page structure, like in src/routes in svelte, and turn them into a inlined html file, which is great if you dont want a singular 
html file for everything (and a hash router) 

E.g with vite.config.ts
```
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import inlineEverythingPlugin from 'vite-plugin-inline-everything';

export default defineConfig({
  base: './',
  plugins: [
    sveltekit(),
    inlineEverythingPlugin()
  ]
});
```

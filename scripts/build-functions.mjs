/**
 * Bundle das functions com esbuild -> functions/<nome>/dist/main.js (CJS,
 * autocontido: node-appwrite e web-push entram no bundle; nada de npm install
 * no runtime do Appwrite).
 */
import { build } from 'esbuild';

const targets = ['tick', 'api'];

for (const name of targets) {
  await build({
    entryPoints: [`functions/${name}/src/main.ts`],
    outfile: `functions/${name}/dist/main.js`,
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    sourcemap: false,
    minify: false,
    logLevel: 'info',
  });
  console.log(`function "${name}" bundled`);
}

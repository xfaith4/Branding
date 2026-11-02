import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from 'tailwindcss';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const js = await build({
  entryPoints: ['src/App.jsx'], bundle: true, write: false, minify: true,
  format: 'iife', target: ['es2020'], legalComments: 'inline',
  define: { 'process.env.NODE_ENV': '"production"' },
});
const css = await postcss([tailwind({
  content: ['./src/**/*.{js,jsx}'], theme: { extend: {} }, plugins: [],
})]).process(await readFile('src/styles.css', 'utf8'), { from: 'src/styles.css', map: false });
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Compare, score, and shortlist name ideas in your browser.">
<meta name="theme-color" content="#020617">
<link rel="icon" href="data:,">
<title>Naming Lab — Brand Workshop</title>
<style>${css.css}</style>
</head>
<body><noscript>Naming Lab needs JavaScript enabled to run.</noscript><div id="root"></div>
<script>${js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>
</body></html>
`;
await writeFile('index.html', html);
const notices = ['# Third-party notices\n\nThe standalone app includes the following dependencies and their licenses.\n'];
for (const dependency of ['react', 'react-dom', 'scheduler', 'tailwindcss']) {
  const license = await readFile(`node_modules/${dependency}/LICENSE`, 'utf8');
  notices.push(`## ${dependency}\n\n\`\`\`text\n${license}\n\`\`\`\n`);
}
await writeFile('THIRD_PARTY_NOTICES.md', notices.join('\n'));
console.log(`Built standalone index.html (${Math.round(Buffer.byteLength(html) / 1024)} KB).`);

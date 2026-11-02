import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const PUBLIC_ENTRIES = [
  'README.md', '.gitignore', 'package.json', 'package-lock.json',
  'index.html', 'THIRD_PARTY_NOTICES.md', 'src', 'scripts', 'tests',
];

export function hasLocalPath(text) {
  return /\b[A-Za-z]:[\\/]/.test(text) ||
    /\/(?:home|Users|mnt|media|Volumes)\/[\w.-]+\//.test(text) ||
    /file:\/\/\//i.test(text) ||
    /\\\\[\w.-]+\\[\w$.-]+\\/.test(text);
}

export async function publicFiles(root, entries = PUBLIC_ENTRIES) {
  const files = [];
  for (const entry of entries) {
    if (['src', 'scripts', 'tests'].includes(entry)) {
      for (const item of await readdir(join(root, entry), { withFileTypes: true })) {
        if (!item.isFile()) throw new Error(`Unexpected non-file in public directory: ${entry}/${item.name}`);
        files.push(`${entry}/${item.name}`);
      }
    } else files.push(entry);
  }
  return files.sort();
}

export async function auditPublicFiles(root) {
  const files = await publicFiles(root);
  for (const file of files) {
    const content = await readFile(join(root, file), 'utf8');
    if (hasLocalPath(content)) throw new Error(`Machine-specific path found in ${file}`);
  }
  return files;
}

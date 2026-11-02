import { cp, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditPublicFiles } from './public-files.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const files = await auditPublicFiles(root);
const destination = join(root, 'release', 'naming-lab');
// Do not overwrite a folder the user may have initialized or edited as a repo.
try {
  if ((await readdir(destination)).length) throw new Error('release/naming-lab already has files. Move that folder before packaging again.');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
for (const file of files) {
  await mkdir(dirname(join(destination, file)), { recursive: true });
  await cp(join(root, file), join(destination, file), { errorOnExist: true, force: false });
}
await auditPublicFiles(destination);
console.log(`Prepared release/naming-lab with ${files.length} public files. Path audit passed.`);

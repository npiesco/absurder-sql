import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageDirectory = resolve(repositoryRoot, 'pkg');
const pwaLibraryDirectory = resolve(repositoryRoot, 'pwa', 'lib');
const generatedFiles = [
  'absurder_sql.js',
  'absurder_sql.d.ts',
  'absurder_sql_bg.wasm',
  'absurder_sql_bg.wasm.d.ts',
];

await Promise.all(
  generatedFiles.map((file) =>
    copyFile(resolve(packageDirectory, file), resolve(pwaLibraryDirectory, file)),
  ),
);
const pwaSnippets = resolve(pwaLibraryDirectory, 'snippets');
await rm(pwaSnippets, { recursive: true, force: true });
const generatedGlue = await readFile(resolve(packageDirectory, 'absurder_sql.js'), 'utf8');
const snippetFiles = new Set(
  [...generatedGlue.matchAll(/['"]\.\/(snippets\/[^'"]+\.js)['"]/g)].map((match) => match[1]),
);
for (const snippetFile of snippetFiles) {
  const destination = resolve(pwaLibraryDirectory, snippetFile);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(resolve(packageDirectory, snippetFile), destination);
}
await rm(resolve(packageDirectory, '.gitignore'), { force: true });

console.log(
  `Synced ${generatedFiles.length} generated WASM package files and ${snippetFiles.size} active snippets into pwa/lib`,
);

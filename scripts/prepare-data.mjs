import { readFile, writeFile, mkdir } from 'node:fs/promises';
const signs=JSON.parse(await readFile(new URL('../src/data/signs.json',import.meta.url),'utf8'));
const content=JSON.parse(await readFile(new URL('../src/data/fortune-content.json',import.meta.url),'utf8'));
await mkdir(new URL('../public/data/',import.meta.url),{recursive:true});
await writeFile(new URL('../public/data/signs.json',import.meta.url),JSON.stringify(signs));
await writeFile(new URL('../public/data/fortune-content.json',import.meta.url),JSON.stringify(content));
console.log(`Prepared ${signs.length} signs and fortune sentence banks`);

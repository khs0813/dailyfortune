import { readdir, readFile, writeFile } from 'node:fs/promises';
    import { createHash } from 'node:crypto';
    import { join, relative, sep } from 'node:path';
    import { fileURLToPath } from 'node:url';

    const rootPath = fileURLToPath(new URL('../dist/', import.meta.url));
    const allowed = new Set(['.html', '.css', '.js', '.json', '.png', '.svg', '.webmanifest', '.xml', '.txt']);
    const files = [];

    async function walk(dir) {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) await walk(full);
        else if ([...allowed].some((ext) => entry.name.endsWith(ext)) && entry.name !== 'sw.js') files.push(full);
      }
    }

    await walk(rootPath);
    files.sort();
    const hash = createHash('sha256');
    for (const file of files) hash.update(await readFile(file));
    const cacheName = `daily-fortune-${hash.digest('hex').slice(0, 12)}`;
    const urls = files
      .map((file) => '/' + relative(rootPath, file).split(sep).join('/'))
      .map((url) => url.endsWith('/index.html') ? url.slice(0, -10) : url);
    if (!urls.includes('/')) urls.push('/');

    const source = `const CACHE_NAME=${JSON.stringify(cacheName)};
const PRECACHE=${JSON.stringify([...new Set(urls)])};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(PRECACHE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;const isNav=event.request.mode==='navigate';if(isNav){event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('/'))));return;}event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}return response;})));});`;
    await writeFile(join(rootPath, 'sw.js'), source);
    console.log(`Generated ${cacheName} with ${urls.length} cached URLs`);

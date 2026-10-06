const VER = 'v2';
const SHELL = 'shell-' + VER, RT = 'rt-' + VER;
const PRE = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
const LIB = 'https://cdn.jsdelivr.net/npm/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js';
const SB_LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap';
/* คำขอเหล่านี้ต้องไปที่เครือข่ายเสมอ ห้ามแคช */
const NO_CACHE = ['finnhub.io', 'api.twelvedata.com', 'api.frankfurter.app', 'open.er-api.com', 'supabase.co', 'supabase.in', 'alphavantage.co'];
const CACHEABLE = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    await shell.addAll(PRE);
    const rt = await caches.open(RT);
    try{ await rt.add(LIB); }catch(err){}
    try{ await rt.add(SB_LIB); }catch(err){}
    try{
      const res = await fetch(FONT_CSS);
      const css = await res.clone().text();
      await rt.put(FONT_CSS, res);
      const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map(m => m[1].replace(/["']/g, ''));
      await Promise.all(urls.map(u => rt.add(u).catch(() => {})));
    }catch(err){}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for(const k of await caches.keys()) if(k !== SHELL && k !== RT) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if(req.method !== 'GET') return;
  if(NO_CACHE.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) return;

  if(req.mode === 'navigate'){
    e.respondWith((async () => {
      const cache = await caches.open(SHELL);
      try{
        const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 4000))]);
        if(res && res.ok) cache.put('./index.html', res.clone());
        return res;
      }catch(err){
        return (await cache.match('./index.html')) || (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  const sameOrigin = url.origin === self.location.origin;
  if(sameOrigin){
    const rel = './' + url.pathname.slice(new URL('./', self.location).pathname.length);
    if(!PRE.includes(rel)) return;
  } else if(!CACHEABLE.includes(url.hostname)) return;
  e.respondWith((async () => {
    const cache = await caches.open(sameOrigin ? SHELL : RT);
    const hit = await cache.match(req);
    const net = fetch(req).then(res => { if(res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; });
    if(hit){ net.catch(() => {}); return hit; }
    return net;
  })());
});

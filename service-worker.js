const CACHE='rhyder-academy-original-layout-latest-curriculum-v1';
const STATIC_FILES=['./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC_FILES)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const r=e.request,u=new URL(r.url);
 if(r.mode==='navigate'||u.pathname.endsWith('/index.html')){
  e.respondWith(fetch(r,{cache:'no-store'}).then(resp=>{
   const copy=resp.clone();
   caches.open(CACHE).then(c=>c.put('./index.html',copy));
   return resp;
  }).catch(()=>caches.match('./index.html')));
  return;
 }
 e.respondWith(caches.match(r).then(c=>c||fetch(r)));
});

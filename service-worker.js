const CACHE="rhyder-academy-clean-v1-1-grammar";
const STATIC=["./","./index.html","./styles.css","./app.js","./data/week1.js","./manifest.webmanifest","./assets/icon.svg"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)))});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const r=e.request,u=new URL(r.url);
  if(r.mode==="navigate"){
    e.respondWith(fetch(r,{cache:"no-store"}).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put("./index.html",copy));return resp}).catch(()=>caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(r).then(c=>c||fetch(r)));
});
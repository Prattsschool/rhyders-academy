const CACHE="rhyder-academy-subject-files-v2";
const STATIC=["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest", "./assets/icon.svg", "./curriculum/history/week01.js", "./curriculum/history/week02.js", "./curriculum/math/week01.js", "./curriculum/math/week02.js", "./curriculum/science/week01.js", "./curriculum/science/week02.js", "./curriculum/grammar/week01.js", "./curriculum/grammar/week02.js", "./curriculum/reading/week01.js", "./curriculum/reading/week02.js", "./curriculum/penmanship/week01.js", "./curriculum/penmanship/week02.js"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)))});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
 const r=e.request;
 if(r.mode==="navigate"){e.respondWith(fetch(r,{cache:"no-store"}).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put("./index.html",copy));return resp}).catch(()=>caches.match("./index.html")));return;}
 e.respondWith(caches.match(r).then(c=>c||fetch(r)));
});
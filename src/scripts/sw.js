/* eslint-disable no-restricted-globals */
// src/scripts/sw.js

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open("restaurant-apps-cache")
            .then((cache) => cache.addAll(["/", "/index.html", "/styles/main.css", "/scripts/index.js", "/scripts/sw.js"]))
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
});

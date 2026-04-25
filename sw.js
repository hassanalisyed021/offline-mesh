self.addEventListener("install", (e) => {
    e.waitUntil(
      caches.open("mesh-cache").then((cache) => {
        return cache.addAll([
          "/",
          "/index.html",
          "/app.js",
          "/style.css"
        ]);
      })
    );
  });
self.addEventListener('backgroundfetchsuccess', event => {
  const bgFetch = event.registration;

  event.waitUntil(async function() {
    const records = await bgFetch.matchAll();
    const cache = await caches.open('video-cache');

    for (const record of records) {
      const response = await record.responseReady;
      await cache.put(record.request, response.clone());

      // Notify clients
      const clients = await self.clients.matchAll();
      for (const client of clients) {
        client.postMessage({
          type: 'FETCH_COMPLETE',
          url: record.request.url
        });
      }
    }
    await bgFetch.updateUI({ title: 'Download complete!' });
  }());
});

self.addEventListener('backgroundfetchfail', event => {
  console.error('Background fetch failed:', event);
});

self.addEventListener('message', async event => {
  if (event.data && event.data.type === 'GET_VIDEO') {
    const cache = await caches.open('video-cache');
    const response = await cache.match(event.data.url);
    if (response) {
      const blob = await response.blob();
      event.source.postMessage({
        type: 'VIDEO_BLOB',
        blob: blob
      });
    }
  }
});

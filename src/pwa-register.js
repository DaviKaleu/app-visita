(function(){
  'use strict';

  function canUseServiceWorker(){
    return 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  }

  if(!canUseServiceWorker()) return;

  window.addEventListener('load', function(){
    navigator.serviceWorker.register('./service-worker.js').catch(function(error){
      console.warn('Service Worker não registrado:', error);
    });
  });
})();

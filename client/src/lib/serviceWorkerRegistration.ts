
import { Workbox } from 'workbox-window';

// Register the service worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js');

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        // New content is available, show a notification
        console.log('New content is available!');
        // You could show a toast notification here
      }
    });

    wb.addEventListener('waiting', (event) => {
      // A new service worker is waiting to activate
      console.log('A new version is ready!');
      // You could prompt the user to refresh
    });

    wb.addEventListener('activated', (event) => {
      if (event.isUpdate) {
        // The service worker has been updated
        console.log('App has been updated and is ready!');
        window.location.reload();
      }
    });

    wb.register().catch(error => {
      console.error('Service worker registration failed:', error);
    });
  }
}

// Check if the app can be installed (PWA)
export function checkPwaInstallable(callback: (canInstall: boolean) => void) {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67+ from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    // @ts-ignore
    window.deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    callback(true);
  });
}

// Install the PWA
export function installPwa() {
  // @ts-ignore
  const promptEvent = window.deferredPrompt;
  if (!promptEvent) {
    return;
  }
  
  // Show the install prompt
  promptEvent.prompt();
  
  // Wait for the user to respond to the prompt
  promptEvent.userChoice.then((choiceResult: any) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    // Clear the saved prompt
    // @ts-ignore
    window.deferredPrompt = null;
  });
}

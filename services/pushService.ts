/**
 * Push Notification Service
 * Handles registration, permission handshake, and mock triggers.
 */

// Placeholder VAPID Public Key (Must be generated for real production use)
const VAPID_PUBLIC_KEY = 'BEl62vp9IH18_vS95z-X9A0yD1n7iG79Hn4S_u6vFp1G-L_x_fR_f_rG-L_x_fR_f_rG-L_x_fR_f_r';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeUser = async (): Promise<PushSubscription | null> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      return subscription;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permission not granted for notifications');
    }

    // Subscribe
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    };

    subscription = await registration.pushManager.subscribe(subscribeOptions);
    console.log('User is subscribed:', subscription);
    return subscription;

  } catch (error) {
    console.error('Failed to subscribe the user: ', error);
    return null;
  }
};

/**
 * Mock Notification Trigger
 * In a real app, you would send the 'subscription' object to your backend (Node.js/Firebase),
 * and the backend would use the 'web-push' library to send the actual notification.
 */
export const triggerMockPush = async (subscription: PushSubscription, title: string, body: string) => {
  console.log('Simulating server-side push for:', subscription.endpoint);
  
  // Since we don't have a backend in this environment, 
  // we simulate a "spontaneous" background event via the service worker's local registration.
  // In reality, this JSON would be sent to your API.
  
  const payload = JSON.stringify({ title, body, url: '/' });
  
  // Wait 5 seconds to simulate a network/background process
  await new Promise(resolve => setTimeout(resolve, 5000));

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    // @ts-ignore - showNotification is standard but TS might need helper
    // Fix: cast to any to allow properties like 'vibrate' which are available in showNotification but often missing from TS types
    registration.showNotification(title, {
      body: body,
      icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23FFD700"/%3E%3C/svg%3E',
      vibrate: [200, 100, 200],
      data: { url: '/' }
    } as any);
  }
};
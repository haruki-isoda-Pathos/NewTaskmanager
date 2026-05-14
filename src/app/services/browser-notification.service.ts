import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BrowserNotificationService {

  requestPermission() {
    Notification.requestPermission();
  }

  show(title: string, body: string) {

    if (Notification.permission === 'granted') {
    
    const notification: Notification = new Notification(title, { body });
     
    notification.onclick = () => {
    window.focus();
    notification.close();
      };
    }

  }

}
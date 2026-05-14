import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class NotificationService {

  private subject = new Subject<string>()

  notification$ = this.subject.asObservable()

  notify(message: string) {

    this.subject.next(message); 
  }

}
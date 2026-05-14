import { Component, OnInit } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'
import { NotificationService } from '../../services/notification.service'

@Component({
    selector: 'app-notification',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notification.component.html',
    styleUrl: './notification.component.css'
  })
  
  export class NotificationComponent implements OnInit{
    
    message: string | null = null;

    constructor(
      private notificationService: NotificationService,
      private cd: ChangeDetectorRef
    ) {}
  
    ngOnInit() {
      this.notificationService.notification$.subscribe(msg => {
        this.message = msg;
        this.cd.detectChanges();
  
        // 3秒後に消す
        setTimeout(() => {
          this.message = null;
          this.cd.detectChanges(); 
        }, 3000); 
      }); 
    }

  }
import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../core/Services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  summary: any = null;
  loading = true;
  error: string | null = null;

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.dashboardService.getDashboardSummary().subscribe({
      next: (data) => {
        this.summary = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard data.';
        this.loading = false;
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../core/Services/dashboard.service';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  totalProjects = 0;
  projectStatus: any = {};
  totalEmployees = 0;
  taskStatus: any = {};
  totalHours = 0;

  startDate = '';
  endDate = '';

  // Chart data
  projectChartLabels: string[] = [];
  projectChartData: number[] = [];
  taskChartLabels: string[] = [];
  taskChartData: number[] = [];

  chartType: ChartType = 'pie';

  objectKeys = Object.keys;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);

    this.startDate = lastMonth.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];

    this.loadDashboard();
  }

  loadDashboard(): void {
    this.dashboardService.getDashboardData(this.startDate, this.endDate).subscribe(data => {
      this.totalProjects = data.totalProjects.total;
      this.projectStatus = data.projectStatus;
      this.totalEmployees = data.totalEmployees.total;
      this.taskStatus = data.taskStatus;
      this.totalHours = data.loggedHours.total_hours;

      // Update chart data
      this.projectChartLabels = Object.keys(this.projectStatus);
      this.projectChartData = Object.values(this.projectStatus);

      this.taskChartLabels = Object.keys(this.taskStatus);
      this.taskChartData = Object.values(this.taskStatus);
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../core/Services/dashboard.service';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  totalProjects = 0;
  totalEmployees = 0;
  Tasks = 0;
  totalHours = 0;

  // Existing
  projectChartData: ChartData<'doughnut', number[], string> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#42a5f5', '#66bb6a', '#ffa726'] }]
  };

  taskChartStatusData: ChartData<'pie', number[], string> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#ab47bc', '#29b6f6', '#ff7043'] }]
  };

  taskChartYearData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ label: 'Tasks per Year', data: [], backgroundColor: '#7e57c2' }]
  };

  // 🔥 New
  projectsByYearData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ label: 'Projects per Year', data: [], backgroundColor: '#26a69a' }]
  };

  tasksPerProjectData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ label: 'Tasks per Project', data: [], backgroundColor: '#ef5350' }]
  };

// Tasks per Year (X: Year, Y: Number of Tasks)
projectsYearBarChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Number of Projects',
        font: { size: 14 }
      }
    },
    x: {
      title: {
        display: true,
        text: 'Year',
        font: { size: 14 }
      }
    }
  },
  plugins: {
    legend: { position: 'bottom' },
    tooltip: { enabled: true }
  }
};

// Tasks per Project (X: Project, Y: Tasks)
tasksPerProjectBarChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Number of Tasks',
        font: { size: 14 }
      }
    },
    x: {
      title: {
        display: true,
        text: 'Project',
        font: { size: 14 }
      }
    }
  },
  plugins: {
    legend: { position: 'bottom' },
    tooltip: { enabled: true }
  }
};
// Options for doughnut charts (e.g. Project Status)
doughnutChartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' },
    tooltip: { enabled: true }
  }
};

// Options for pie charts (e.g. Task Status)
pieChartOptions: ChartOptions<'pie'> = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' },
    tooltip: { enabled: true }
  }
};

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.dashboardService.getDashboardSummary().subscribe({
      next: (data) => {
        this.totalProjects = data.totalProjects || 0;
        this.totalEmployees = data.totalEmployees || 0;
        this.Tasks = data.Tasks || 0;
        this.totalHours = data.totalTimeLogged || 0;

        // Project Status
        const projectStatus = data.projectStatus || { Active: 5, Completed: 3, Delayed: 2 };
        this.projectChartData = {
          labels: Object.keys(projectStatus),
          datasets: [{ data: Object.values(projectStatus), backgroundColor: ['#42a5f5', '#66bb6a', '#ffa726'] }]
        };

        // Task Status
        const taskStatus = data.taskStatus || { ToDo: 4, InProgress: 6, Done: 8 };
        this.taskChartStatusData = {
          labels: Object.keys(taskStatus),
          datasets: [{ data: Object.values(taskStatus), backgroundColor: ['#ab47bc', '#29b6f6', '#ff7043'] }]
        };

        // Task by Year
        const taskByYear = data.taskByYear || { 2023: 10, 2024: 15, 2025: 7 };
        this.taskChartYearData = {
          labels: Object.keys(taskByYear),
          datasets: [{ label: 'Tasks per Year', data: Object.values(taskByYear), backgroundColor: '#7e57c2' }]
        };

        // 🔥 Projects by Year
        const projectsByYear = data.projectsByYear || { 2023: 3, 2024: 6, 2025: 5 };
        this.projectsByYearData = {
          labels: Object.keys(projectsByYear),
          datasets: [{ label: 'Projects per Year', data: Object.values(projectsByYear), backgroundColor: '#26a69a' }]
        };

        // 🔥 Tasks per Project
        const tasksPerProject = data.tasksPerProject || { Alpha: 10, Beta: 7, Gamma: 15 };
        this.tasksPerProjectData = {
          labels: Object.keys(tasksPerProject),
          datasets: [{ label: 'Tasks per Project', data: Object.values(tasksPerProject), backgroundColor: '#ef5350' }]
        };
      },
      error: (err) => {
        console.error('Dashboard load failed', err);
      }
    });
  }
}

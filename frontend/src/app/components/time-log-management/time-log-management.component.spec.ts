import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeLogManagementComponent } from './time-log-management.component';

describe('TimeLogManagementComponent', () => {
  let component: TimeLogManagementComponent;
  let fixture: ComponentFixture<TimeLogManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimeLogManagementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeLogManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NotificationComponent, NotificationComponentAccessor } from '@elements/notification/notification.component';
import { RequestActionDialogComponent } from './request-action-dialog.component';
import { GcpRolesService } from '@modules/gcp-roles/services/gcp-roles.service';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { FormGroup } from '@angular/forms';

describe('RequestActionDialogComponent', () => {
  let component: RequestActionDialogComponent;
  let fixture: ComponentFixture<RequestActionDialogComponent>;

  const mockGcpRolesService = {
    updateRequestStatus: (requestId: string, data: any) => of({ data: { id: requestId } })
  };

  const mockNotificationComponentAccessor = {
    get: () => ({} as NotificationComponent)
  };

  const formBuilder: FormBuilder = new FormBuilder();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule], 
      declarations: [RequestActionDialogComponent],
      providers: [
        { provide: GcpRolesService, useValue: mockGcpRolesService },
        { provide: NotificationComponentAccessor, useValue: mockNotificationComponentAccessor },
        { provide: FormBuilder, useValue: formBuilder },
      ],
    });

    fixture = TestBed.createComponent(RequestActionDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should bind data correctly', () => {
    const mockEntity = {
      requestId: 'mockRequestId',
    
    };
    component.entityTitle = 'APPROVED';
    component.completedFlag = true;

    component.bindData(mockEntity);

   
    expect(component.requestId_).toEqual(mockEntity.requestId);
    expect(component.title_).toEqual('Request Approve Title');
    expect(component.status).toEqual('APPROVED');
    expect(component.loading_).toBe(false);
  });

  it('should set fields status correctly', () => {
    component.completedFlag = true;
    component.form_ = new FormGroup({
      scope: formBuilder.control(null),
      conditions: formBuilder.control(null),
      epa: formBuilder.control(null)
    });

    component.setFieldsStatus();

 
    expect(component.form_.get('scope').enabled).toBe(true);
    expect(component.form_.get('conditions').enabled).toBe(true);
    expect(component.form_.get('epa').enabled).toBe(true);

    component.completedFlag = false;
    component.setFieldsStatus();

   
    expect(component.form_.get('scope').enabled).toBe(false);
    expect(component.form_.get('conditions').enabled).toBe(false);
    expect(component.form_.get('epa').enabled).toBe(false);
  });

  it('should prepare data for updating request object', () => {
    component.requestId_ = 'mockRequestId';
    component.status = 'APPROVED';
    component.approvalGroupId_ = 1;
    component.completedFlag = true;
    component.form_ = new FormGroup({
      conditions: formBuilder.control('condition value'),
      scope: formBuilder.control('scope value'),
      epa: formBuilder.control(true)
    });

    const data = component.prepareDataForUpdatingRequestObject();

   
    expect(data.status).toEqual('APPROVED');
    expect(data.condition).toEqual('condition value');
    expect(data.scope).toEqual('scope value');
    expect(data.epa).toEqual('y');
  });

  
});

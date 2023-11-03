import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { BindRoleComponent } from './bind-role.component';
import { GcpRolesService } from '@modules/gcp-roles/services/gcp-roles.service';
import { RequestManagementService } from '@modules/gcp-roles/services/request-management-service';
import { NotificationComponent, NotificationComponentAccessor } from '@platform/portal/elements';

describe('BindRoleComponent', () => {
  let component: BindRoleComponent;
  let fixture: ComponentFixture<BindRoleComponent>;

  const mockActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap({ id: 'your-request-id' }) 
    }
  };

  const mockGcpRolesService = {
    getMasterDataGCPComponents: () => of([]), 
    getNarOwners: () => of([]), 
    getMasterDataGCPServices: () => of([]), 
    getMasterDataPrincipalType: () => of([]), 
    getCustomOrPredefinedRoles: () => of([]), 
    getMasterAssetTypes: () => of([]), 
    raiseRequestForRoleBinding: () => of({ data: { id: 'your-request-id' } }),
    raiseRequestUpdateForRoleBinding: () => of({ data: { id: 'your-request-id' } }) 
  };

  const mockRequestManagementService = {
    getRequestDetailsFromRequestId: () => of({ businessContent: '{}' }) 
  };

  const mockNotificationComponentAccessor = {
    get: () => ({} as NotificationComponent)
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule], 
      declarations: [BindRoleComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: GcpRolesService, useValue: mockGcpRolesService },
        { provide: RequestManagementService, useValue: mockRequestManagementService },
        { provide: NotificationComponentAccessor, useValue: mockNotificationComponentAccessor },
      ],
    });

    fixture = TestBed.createComponent(BindRoleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update form with request details', () => {
    spyOn(component, 'getGCPServicesData');
    spyOn(component, 'getGCPCustomOrPredefinedRoles');

    component.ngOnInit();

    
    expect(component.receivedRequestId).toEqual('your-request-id');
    expect(component.editModeEnabled).toBe(true);
    expect(component.editTitle).toContain('Edit');
    expect(component.getGCPServicesData).toHaveBeenCalled();
    expect(component.getGCPCustomOrPredefinedRoles).toHaveBeenCalled();
  });

  it('should update form with request details when route params are absent', () => {
    spyOn(component, 'getGCPServicesData');
    spyOn(component, 'getGCPCustomOrPredefinedRoles');

    component.ngOnInit();
    expect(component.receivedRequestId).toBeNull();
    expect(component.editModeEnabled).toBe(false);
    expect(component.editTitle).toEqual('');
    expect(component.getGCPServicesData).not.toHaveBeenCalled();
    expect(component.getGCPCustomOrPredefinedRoles).not.toHaveBeenCalled();
  });

  it('should update form with request details when request details are received', () => {
    const mockData = {
      preferredCustomRoleName: 'role1,role2',
      componentId: 'componentId',
      serviceId: 'serviceId',
  
    };

    spyOn(component.bindRoleForm, 'patchValue');

    component.updateFormWithRequestDetails(mockData);

   
    expect(component.bindRoleForm.patchValue).toHaveBeenCalledWith({
      componentId: mockData.componentId,
      serviceId: mockData.serviceId,
      roleDescription: mockData.roleDescription,
     
    });
  });

  it('should raise request for role binding', () => {
    spyOn(component.notifier, 'showSuccessMessage');
    spyOn(component, 'resetDetails');

    component.raiseRequestForRoleBinding();

  
    expect(component.notifier.showSuccessMessage).toHaveBeenCalled();
    expect(component.resetDetails).toHaveBeenCalled();
  });

  it('should raise request for role binding update', () => {
    spyOn(component.notifier, 'showSuccessMessage');
    spyOn(component, 'resetDetails');

    component.raiseRequestUpdateForRoleBinding();

 
    expect(component.notifier.showSuccessMessage).toHaveBeenCalled();
    expect(component.resetDetails).toHaveBeenCalled();
  });

  
});

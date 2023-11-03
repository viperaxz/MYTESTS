import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GcpRolesService } from '@modules/gcp-roles/services/gcp-roles.service';
import { RequestManagementService } from '@modules/gcp-roles/services/request-management-service';
import { NotificationComponent, NotificationComponentAccessor } from '@platform/portal/elements';
import { RoleDetailsComponent } from './role-details.component';
import { of } from 'rxjs';

describe('RoleDetailsComponent', () => {
  let component: RoleDetailsComponent;
  let fixture: ComponentFixture<RoleDetailsComponent>;

  const mockFormBuilder = {
    group: (controls: any, options: any) => ({
      controls: controls,
      options: options,
      get: (controlName: string) => controls[controlName],
    }),
  };

  const mockGcpRolesService = {
    getMasterDataPrincipalType: () => {},
    getMasterDataGCPComponents: () => {},
    getMasterDataGCPServices: (componentId: string) => {},
    getMasterDataGCPPermissions: (serviceId: string) => {},
    getNarOwners: () => {},
    raiseRequestForRoleCreation: (data: any) => {},
    raiseRequestUpdateForRoleCreation: (data: any, requestId: string) => {},
  };

  const mockRoute = {
    paramMap: of({ has: (paramName: string) => true, get: (paramName: string) => 'mockId' }),
  };

  const mockRequestManagementService = {
    getRequestDetailsFromRequestId: (requestId: string) => of({ businessContent: '{}' }),
  };

  const mockNotificationComponentAccessor = {
    get: () => ({} as NotificationComponent),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RoleDetailsComponent],
      providers: [
        { provide: FormBuilder, useValue: mockFormBuilder },
        { provide: GcpRolesService, useValue: mockGcpRolesService },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: RequestManagementService, useValue: mockRequestManagementService },
        { provide: NotificationComponentAccessor, useValue: mockNotificationComponentAccessor },
      ],
    });

    fixture = TestBed.createComponent(RoleDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update form with request details', () => {
    const data = {
      permissionsId: [1, 2],
      componentId: '1',
      serviceId: '2',
      preferredCustomRoleName: 'TestRoleName',
      roleDescription: 'TestRoleDescription',
      principalTypeId: '3',
      principalType: 'TestPrincipalType',
      businessJustification: 'TestBusinessJustification',
      narId: 'TestNarId',
    };
    component.updateFormWithRequestDetails(data);
    expect(component.receivedPermissionsId).toEqual(data.permissionsId);
     // todo: add assertions
  });

  it('should get principal type data', () => {
    component.getPrincipalTypeData();
    // todo: add assertions
  });

  it('should get GCP components data', () => {
    component.getGCPComponentsData();
    // todo: add assertions
  });

  it('should get GCP services data', () => {
    const componentId = '1';
    component.getGCPServicesData(componentId);
    // todo: add assertions
  });

  it('should get GCP permissions data', () => {
    const serviceId = '2';
    component.getGCPPermissionsData(serviceId);
    // todo: add assertions
  });

  it('should get NAR owners list', () => {
    component.getNarOwnersList();
    // todo: add assertions
  });

  it('should reset details', () => {
    component.resetDetails();
    // todo: add assertions
  });

  it('should handle nar ID changed', () => {
    const event = {
      target: {
        value: 'TestNarId',
      },
    };
    component.narIdChanged(event);
    // todo: add assertions
  });

  it('should handle nar ID focused out', () => {
    const event = {
      target: {
        value: 'TestNarId',
      },
    };
    component.narIdFocusedOut(event);
    // todo: add assertions
  });

  it('should check NAR ID', () => {
    component.onCheckNarId();
    // todo: add assertions
  });

  it('should handle component name selected', () => {
    const event = {
      target: {
        value: '1',
      },
    };
    component.componentNameSelected(event);
    // todo: add assertions
  });

  it('should handle service name selected', () => {
    const event = {
      target: {
        value: '2',
      },
    };
    component.serviceNameSelected(event);
    // todo: add assertions
  });

  it('should return the correct title', () => {
    expect(component.title).toBe('Your Title Here');
  });

  it('should return the correct title details', () => {
    expect(component.titleDetails).toBe('Role Details');
  });

  it('should check if page is loading', () => {
    const loading = component.pageLoadingSpinner();
    expect(loading).toBe(false);
    // Add more assertions for other loading flags
  });

  it('should raise request for role creation', () => {
    component.onSubmit();
    // todo: add assertions
  });

  it('should raise request update for role creation', () => {
    component.receivedRequestId = '1';
    component.onSubmit();
    // todo: add assertions
  });

  it('should generate a success message', () => {
    const response = { data: { id: '1' } };
    const message = component.generateSuccessMessage(response);
    expect(message).toBe('Request: 1 has been raised successfully.');
  });

  it('should generate an edit success message', () => {
    const requestId = '1';
    const message = component.generateEditSuccessMessage(requestId);
    expect(message).toBe('Request: 1 has been updated successfully.');
  });

  it('should generate an error message', () => {
    const error = {};
    const message = component.generateErrorMessage(error);
    expect(message).toBe('Something went wrong. Please try again later.');
  });

  it('should get permissions ID data', () => {
    component.roleDetailsForm.get('gcpPermissionsList').patchValue([
      { permissionId: 1 },
      { permissionId: 2 },
    ]);
    const permissionIdList = component.getPermissionsIdData();
    expect(permissionIdList).toEqual([1, 2]);
  });

  it('should prepare data for role creation request object', () => {
    component.roleDetailsForm.patchValue({
      componentId: '1',
      serviceId: '2',
      roleName: 'TestRoleName',
      roleDescription: 'TestRoleDescription',
      principalType: '3',
      principalTypeValue: 'TestPrincipalType',
      businessJustification: 'TestBusinessJustification',
      narId: 'TestNarId',
    });
    const data = component.prepareDataForRoleCreationRequestObject();
    const expectedData = {
      componentId: '1',
      serviceId: '2',
      requestorEmailId: 'lastUserName',
      preferredCustomRoleName: 'TestRoleName',
      roleDescription: 'TestRoleDescription',
      principalTypeId: '3',
      principalType: 'TestPrincipalType',
      scope: '',
      isInPoc: 'yes',
      businessJustification: 'TestBusinessJustification',
      permissionsId: [1, 2], 
      narId: 'TestNarId',
    };
    expect(data).toEqual(expectedData);
  });

  
});

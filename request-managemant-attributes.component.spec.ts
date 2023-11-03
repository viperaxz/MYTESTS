import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RequestManagementAttributesComponent } from './request-management-attributes.component';
import { RequestActionDialogComponent } from '../request-action-dialog/request-action-dialog.component';
import { GcpRolesService } from '@modules/gcp-roles/services/gcp-roles.service';
import { CurrentPrincipalServiceImpl } from '@platform/core/services/authentication-service';
import { DialogService } from '@platform/portal/services/dialog-service';
import { NotificationComponentAccessor } from '@platform/portal/elements/layout-containers';
import { AccessPermissionService } from '@shared/services/access-permission.service';

describe('RequestManagementAttributesComponent', () => {
  let component: RequestManagementAttributesComponent;
  let fixture: ComponentFixture<RequestManagementAttributesComponent>;

  const mockGcpRolesService = {
    getGcpApprovalGroupMapping: (email: string) => of({}),
    updateRequestStatus: (requestId: string, data: any) => of({ data: { Id: requestId } }),
  };

  const mockCurrentPrincipalServiceImpl = {
    currentPrincipal: {
      userId: 'mockUserId',
    },
  };

  const mockAccessPermissionService = {
    hasButtonLevelAccess: (path: string, action: string) => {
      return {
        approve: true,
      };
    },
  };

  const mockNotificationComponentAccessor = {
    get: () => ({} as NotificationComponentAccessor),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule, HttpClientTestingModule], 
      declarations: [RequestManagementAttributesComponent],
      providers: [
        { provide: GcpRolesService, useValue: mockGcpRolesService },
        { provide: CurrentPrincipalServiceImpl, useValue: mockCurrentPrincipalServiceImpl },
        { provide: AccessPermissionService, useValue: mockAccessPermissionService },
        { provide: NotificationComponentAccessor, useValue: mockNotificationComponentAccessor },
        DialogService,
      ],
    });

    fixture = TestBed.createComponent(RequestManagementAttributesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set loading to true in the constructor', () => {
    expect(component.loading_).toBe(true);
  });

  it('should check if user approval status is updated correctly', () => {
    component.approvalGroupsList = [
      { USER_GROUP_NAME: 'Service Product Owner', APPROVAL_GROUP_ID: 1 },
      { USER_GROUP_NAME: 'PRODUCT_ENABLEMENT', APPROVAL_GROUP_ID: 2 },
    ];
    component.completedFlag = false;
    const oldStatus = 'SUBMITTED';
    const oldApprovalGroupName = 'Service Product Owner';

    component.checkUserApprovalStatus([], oldStatus, oldApprovalGroupName);

    expect(component.aprvRejButtonFlag).toBe(true);
    expect(component.newApprovalGroupId).toBe(2);

    component.aprvRejButtonFlag = false;
    component.newApprovalGroupId = null;
    component.completedFlag = false;

    component.checkUserApprovalStatus([], 'APPROVED', 'Service Product Owner');

    expect(component.aprvRejButtonFlag).toBe(true);
    expect(component.newApprovalGroupId).toBe(1);

    component.aprvRejButtonFlag = false;
    component.newApprovalGroupId = null;

    component.checkUserApprovalStatus([], 'APPROVED', 'PRODUCT_ENABLEMENT');

    expect(component.aprvRejButtonFlag).toBe(true);
    expect(component.newApprovalGroupId).toBe(2);
  });

  it('should return true when checking if it can continue', () => {
    component.form_.get('status').setValue('APPROVED');
    expect(component.checkContinue()).toBe(true);
  });

  it('should return false when checking if it can continue', () => {
    component.form_.get('status').setValue('REJECTED');
    expect(component.checkContinue()).toBe(false);

    component.form_.get('status').setValue('OPEN');
    expect(component.checkContinue()).toBe(false);

    component.form_.get('status').setValue('COMPLETED');
    expect(component.checkContinue()).toBe(false);
  });

  it('should return true for requestApproved', () => {
    const status = 'APPROVED';
    expect(component.requestApproved(status)).toBe(true);
  });

  it('should return false for requestApproved', () => {
    const status = 'SUBMITTED';
    expect(component.requestApproved(status)).toBe(false);
  });

  it('should return true for requestRejected', () => {
    const status = 'REJECTED';
    expect(component.requestRejected(status)).toBe(true);
  });

  it('should return false for requestRejected', () => {
    const status = 'APPROVED';
    expect(component.requestRejected(status)).toBe(false);
  });

  it('should prepare data for updating request object', () => {
    const data = component.prepareDataForUpdatingRequestObject();
    expect(data.status).toBe('CANCELLED');
    expect(data.approvalComments).toBe('Request Cancelled by Requestor');
    expect(data.actionBy).toBe(localStorage.getItem('lastUserName'));
    expect(data.approverGroupId).toBeNull();
  });

  it('should show edit button for certain conditions', () => {
    component.form_.get('status').setValue('OPEN');
    component.form_.get('businessContent.requestorEmailId').setValue('mockUserId');
    localStorage.setItem('lastUserName', 'mockUserId');
    expect(component.showEditButton()).toBe(true);
  });

  it('should not show edit button for certain conditions', () => {
    component.form_.get('status').setValue('APPROVED');
    component.form_.get('businessContent.requestorEmailId').setValue('mockUserId');
    localStorage.setItem('lastUserName', 'anotherUserId');
    expect(component.showEditButton()).toBe(false);
  });

  it('should show cancel request button for certain conditions', () => {
    component.form_.get('status').setValue('SUBMITTED');
    component.form_.get('businessContent.requestorEmailId').setValue('mockUserId');
    localStorage.setItem('lastUserName', 'mockUserId');
    expect(component.showCancelRequestButton()).toBe(true);
  });

  it('should not show cancel request button for certain conditions', () => {
    component.form_.get('status').setValue('COMPLETED');
    component.form_.get('businessContent.requestorEmailId').setValue('mockUserId');
    localStorage.setItem('lastUserName', 'anotherUserId');
    expect(component.showCancelRequestButton()).toBe(false);
  });

 
});

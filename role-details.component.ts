import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GCPRoleManagement } from '@modules/gcp-roles/common/gcp-role-management.data';
import { RoleDetails } from '@modules/gcp-roles/flows/role-details/role-details';
import { GcpRolesService } from '@modules/gcp-roles/services/gcp-roles.service';
import { RequestManagementService } from '@modules/gcp-roles/services/request-management-service';
import { NotificationComponent, NotificationComponentAccessor } from '@platform/portal/elements';
import { NarOwner, GCPComponents, GCPPermission, GCPService, PrincipalName, PrincipalType, roleCreationRequestObject } from '../search-roles/search-roles';

@Component({
  selector: 'app-role-details',
  templateUrl: './role-details.component.html',
  styleUrls: ['./role-details.component.scss'],
})
export class RoleDetailsComponent implements OnInit {
  roleDetailsForm: FormGroup;
  launchedFromSearchRole = false; // if the parent is search-role
  selectedPrincipalName: PrincipalName;
  selectedGcpService: GCPService;
  principalTypeList: PrincipalType[] = [];
  gcpComponentsList: GCPComponents[] = [];
  gcpServicesList: GCPService[] = [];
  gcpPermissionsList: GCPPermission[] = [];
  businessJustification: string;
  roleName: string;
  roleDescription: string;
  principalTypeValue: string;
  narId: string;
  editTitle: string = '';
  narOwnersList: NarOwner[] = [];
  private notifier: NotificationComponent;

  componentsLoading: boolean = false;
  serviceLoading: boolean = false;
  permissionLoading: boolean = false;
  principalTypeLoading: boolean = false;
  roleCreationRequestLoading: boolean = false;
  roleCreationEditRequestLoading: boolean = false;

  receivedRequestId: string | null;

  editModeEnabled: boolean = false;
  receivedPermissionsId: number[] = [];
  narIdIsValid: boolean = false;
  narIdSaved: string;
  narOwnersLoading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private gcpRolesService: GcpRolesService,
    private route: ActivatedRoute,
    private requestManagementService: RequestManagementService,
    private notification: NotificationComponentAccessor
  ) {
    this.roleDetailsForm = this.formBuilder.group({
      componentId: new FormControl(null, [Validators.required]),
      serviceId: new FormControl(null, [Validators.required]),
      gcpPermissionsList: new FormControl([], [Validators.required]),
      roleName: new FormControl(null, [Validators.required]),
      roleDescription: new FormControl(null, [Validators.required]),
      principalType: new FormControl(null),
      principalTypeValue: new FormControl(null),
      narId: new FormControl(null, [Validators.required]),
      businessJustification: new FormControl(null, [Validators.required]),
    });
  }

  ngOnInit() {
    this.notifier = this.notification.get();
    this.getGCPComponentsData();
    this.getPrincipalTypeData();
    this.getNarOwnersList();

    this.route.paramMap.subscribe((params) => {
      if (params.has('id')) {
        this.receivedRequestId = params.get('id');
        this.editModeEnabled = true;
        this.editTitle = `${GCPRoleManagement.REQUEST_EDIT_TITLE} ${this.receivedRequestId}`;
        this.requestManagementService.getRequestDetailsFromRequestId(this.receivedRequestId).subscribe(
          (data) => {
            console.log(JSON.parse(data.businessContent));
            this.updateFormWithRequestDetails(JSON.parse(data.businessContent));
          },
          (error) => {
            this.notifier.showErrorMessage(this.generateErrorMessage(error));
          }
        );
      }
    });
  }

  updateFormWithRequestDetails(data: roleCreationRequestObject) {
    this.receivedPermissionsId = data.permissionsId;
    this.getGCPServicesData(data.componentId);
    this.getGCPPermissionsData(data.serviceId);
    this.roleDetailsForm.get('componentId').disable();
    this.roleDetailsForm.get('serviceId').disable();
    this.roleDetailsForm.patchValue({
      componentId: data.componentId,
      serviceId: data.serviceId,
      roleName: data.preferredCustomRoleName,
      roleDescription: data.roleDescription,
      principalType: data.principalTypeId,
      principalTypeValue: data.principalType,
      businessJustification: data.businessJustification,
      narId: data.narId,
    });
  }

  getPrincipalTypeData(): void {
    this.principalTypeLoading = true;
    this.gcpRolesService.getMasterDataPrincipalType().subscribe(
      (data) => {
        this.principalTypeList = data;
        this.principalTypeLoading = false;
      },
      (error) => {
        this.principalTypeLoading = false;
        console.log(error);
      }
    );
  }

  getGCPComponentsData(): void {
    this.componentsLoading = true;
    this.gcpRolesService.getMasterDataGCPComponents().subscribe(
      (data) => {
        this.gcpComponentsList = data;
        this.componentsLoading = false;
      },
      (error) => {
        this.componentsLoading = false;
        console.log(error);
      }
    );
  }

  getGCPServicesData(componentId): void {
    this.serviceLoading = true;
    this.gcpRolesService.getMasterDataGCPServices(componentId).subscribe(
      (data) => {
        this.serviceLoading = false;
        this.gcpServicesList = data;
      },
      (error) => {
        this.serviceLoading = false;
        console.log(error);
      }
    );
  }

  getGCPPermissionsData(serviceId): void {
    this.permissionLoading = true;
    this.gcpRolesService.getMasterDataGCPPermissions(serviceId).subscribe(
      (data) => {
        this.gcpPermissionsList = data;
        this.permissionLoading = false;
        if (this.editModeEnabled) {
          const permissionIdList = this.gcpPermissionsList.filter((element) =>
            this.receivedPermissionsId.indexOf(+element.permissionId) > -1
          );
          this.roleDetailsForm.get('gcpPermissionsList').patchValue(permissionIdList);
        }
      },
      (error) => {
        this.permissionLoading = false;
        console.log(error);
      }
    );
  }

  getNarOwnersList(): void {
    this.narOwnersLoading = true;
    this.gcpRolesService.getNarOwners().subscribe(
      (data) => {
        this.narOwnersList = data;
        this.narOwnersLoading = false;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  onSubmit() {
    console.log('Form submitted!');
    if (this.editModeEnabled) {
      this.raiseRequestUpdateForRoleCreation();
    } else {
      this.raiseRequestForRoleCreation();
    }
  }

  resetDetails() {
    if (this.editModeEnabled) {
      this.roleDetailsForm.get('serviceId').reset();
      this.roleDetailsForm.get('componentId').reset();
      this.gcpPermissionsList = [];
      this.roleDetailsForm.get('gcpPermissionsList').reset();
      this.roleDetailsForm.get('roleName').reset();
      this.roleDetailsForm.get('roleDescription').reset();
      this.roleDetailsForm.get('principalType').reset();
      this.roleDetailsForm.get('principalTypeValue').reset();
      this.roleDetailsForm.get('businessJustification').reset();
      this.roleDetailsForm.get('narId').reset();
    }
  }

  narIdChanged(event: any) {
    if (this.narIdSaved !== (event.target as HTMLSelectElement).value) {
      this.narIdIsValid = false;
    }
    if (this.narIdSaved === (event.target as HTMLSelectElement).value) {
      this.narIdIsValid = true;
    }
  }

  narIdFocusedOut(event: any) {
    if (this.narIdSaved !== (event.target as HTMLSelectElement).value) {
      this.narIdIsValid = false;
      this.onCheckNarId();
    }
  }

  onCheckNarId() {
    this.narIdSaved = this.roleDetailsForm.get('narId').value;
    if (this.narOwnersList.length > 0) {
      const found = this.narOwnersList.some((owner) => owner.narId === this.narIdSaved);
      if (found) {
        this.narIdIsValid = true;
        this.notifier.showSuccessMessage('Nar ID found');
      } else {
        this.narIdIsValid = false;
        this.notifier.showErrorMessage('NarID not found');
      }
    }
  }

  componentNameSelected(event: any) {
    this.getGCPServicesData((event.target as HTMLSelectElement).value);
  }

  serviceNameSelected(event: any) {
    this.getGCPPermissionsData((event.target as HTMLSelectElement).value);
  }

  public get title(): string {
    return GCPRoleManagement.GCP_ROLES_MANAGEMENT_MODULE_TITLE;
  }

  public get titleDetails(): string {
    return RoleDetails.OBJECT_TITLE;
  }

  pageLoadingSpinner(): boolean {
    return (
      this.serviceLoading ||
      this.permissionLoading ||
      this.principalTypeLoading ||
      this.roleCreationRequestLoading ||
      this.componentsLoading ||
      this.roleCreationEditRequestLoading
    );
  }

  raiseRequestForRoleCreation(): void {
    this.roleCreationRequestLoading = true;
    const data = this.prepareDataForRoleCreationRequestObject();
    this.gcpRolesService.raiseRequestForRoleCreation(data).subscribe(
      (response) => {
        this.notifier.showSuccessMessage(this.generateSuccessMessage(response));
        this.resetDetails();
        this.roleCreationRequestLoading = false;
      },
      (error) => {
        this.notifier.showErrorMessage(this.generateErrorMessage(error));
        this.roleCreationRequestLoading = false;
      }
    );
  }

  raiseRequestUpdateForRoleCreation(): void {
    this.roleCreationEditRequestLoading = true;
    const data = this.prepareDataForRoleCreationRequestObject();
    this.gcpRolesService.raiseRequestUpdateForRoleCreation(data, this.receivedRequestId).subscribe(
      (data) => {
        this.notifier.showSuccessMessage(this.generateEditSuccessMessage(this.receivedRequestId));
        this.resetDetails();
        this.roleCreationEditRequestLoading = false;
      },
      (error) => {
        this.notifier.showErrorMessage(this.generateErrorMessage(error));
        this.roleCreationEditRequestLoading = false;
      }
    );
  }

  protected generateSuccessMessage(response: any): string {
    return `Request: ${response.data.id} has been raised successfully.`;
  }

  protected generateEditSuccessMessage(requestId: any): string {
    return `Request: ${requestId} has been updated successfully.`;
  }

  protected generateErrorMessage(error: any): string {
    console.error(error);
    return 'Something went wrong. Please try again later.';
  }

  getPermissionsIdData(): number[] {
    const permissionIdList: number[] = [];
    if (this.roleDetailsForm.get('gcpPermissionsList').value) return permissionIdList;
    if (this.roleDetailsForm.get('gcpPermissionsList').value.length > 0) {
      this.roleDetailsForm.get('gcpPermissionsList').value.forEach((element) => {
        permissionIdList.push(element.permissionId);
      });
    }
    return permissionIdList;
  }

  prepareDataForRoleCreationRequestObject(): roleCreationRequestObject {
    const data: roleCreationRequestObject = {
      componentId: this.roleDetailsForm.get('componentId').value,
      serviceId: this.roleDetailsForm.get('serviceId').value,
      requestorEmailId: localStorage.getItem('lastUserName'),
      preferredCustomRoleName: this.roleDetailsForm.get('roleName').value,
      roleDescription: this.roleDetailsForm.get('roleDescription').value,
      principalTypeId: this.roleDetailsForm.get('principalType').value,
      principalType: this.roleDetailsForm.get('principalTypeValue').value,
      scope: '',
      isInPoc: 'yes',
      businessJustification: this.roleDetailsForm.get('businessJustification').value,
      permissionsId: this.getPermissionsIdData(),
      narId: this.roleDetailsForm.get('narId').value,
    };
    return data;
  }
}

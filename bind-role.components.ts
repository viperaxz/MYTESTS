import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GCPRoleManagement } from '@modules/gcp-roles/common/gcp-role-management.data';
import { BindRole } from '@modules/gcp-roles/flows/bind-role/bind-role';
import { GcpRolesService } from '@modules/gcp-roles/services/gcp-roles.service';
import { RequestManagementService } from '@modules/gcp-roles/services/request-management-service';
import { NotificationComponent, NotificationComponentAccessor } from '@platform/portal/elements';
import { AssetType, GCPComponents, GCPCustomOrPredefinedRoles, GCPService, PrincipalType, roleBindingObject, NarOwner } from '../search-roles/search-roles';

@Component({
  selector: 'app-bind-role',
  templateUrl: './bind-role.component.html',
  styleUrls: ['./bind-role.component.scss']
})
export class BindRoleComponent implements OnInit {
  bindRoleForm: FormGroup;
  gcpRolesList: GCPCustomOrPredefinedRoles[] = [];
  gcpServicesList: GCPService[] = [];
  principallypelist: PrincipalType[] = [];
  gcpComponentsList: GCPComponents[] = [];
  assetTypeList: AssetType[] = [];
  editTitle: string = '';
  narOwnersList: NarOwner[] = [];
  receivedRequestId: string = null;
  editModeEnabled: boolean = false;
  receivedRolesIdList: string[] = [];
  notifier: NotificationComponent;
  componentsLoading: boolean = false;
  serviceLoading: boolean = false;
  assetTypeLoading: boolean = false;
  principalTypeLoading: boolean = false;
  roleLoading: boolean = false;
  roleBindingRequestLoading: boolean = false;
  roleBindingEditRequestLoading: boolean = false;
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
    this.bindRoleForm = this.formBuilder.group({
      componentId: new FormControl(null, [Validators.required]),
      serviceId: new FormControl(null, [Validators.required]),
      gcpRolesList: new FormControl([], [Validators.required]),
      assetType: new FormControl(null, [Validators.required]),
      assetTypeValue: new FormControl(null, [Validators.required]),
      principalType: new FormControl(null),
      principalTypeValue: new FormControl(null),
      narId: new FormControl(null, [Validators.required]),
      scope: new FormControl(null, [Validators.required]),
      businessJustification: new FormControl(null, [Validators.required])
    });
  }

  ngOnInit() {
    this.notifier = this.notification.get();
    this.getPrincipalTypeData();
    this.getGCPComponentsData();
    this.getAssetData();
    this.getNarOwnersList();

    this.route.paramMap.subscribe(params => {
      if (params.has("id")) {
        this.receivedRequestId = params.get("id");
        this.editModeEnabled = true;
        this.editTitle = GCPRoleManagement.REQUEST_EDIT_TITLE + this.receivedRequestId;

        this.requestManagementService.getRequestDetailsFromRequestId(this.receivedRequestId).subscribe(data => {
          console.log(JSON.parse(data.businessContent));
          this.updateFormWithRequestDetails(JSON.parse(data.businessContent));
        }, error => {
          this.notifier.showErrorMessage(this.generateErrorMessage(error));
        });
      }
    });
  }

  updateFormWithRequestDetails(data: roleBindingObject) {
    this.receivedRolesIdList = data.preferredCustomRoleName.split(",");
    this.getGCPServicesData(data.componentId);
    this.getGCPCustomOrPredefinedRoles(data.serviceId.toString());

    this.bindRoleForm.get('componentId').disable();
    this.bindRoleForm.get('serviceId').disable();

    this.bindRoleForm.patchValue({
      componentId: data.componentId,
      serviceId: data.serviceId,
      roleDescription: data.roleDescription,
      principalType: data.principalTypeId,
      principalTypeValue: data.principalTypeValue,
      businessJustification: data.businessJustification,
      narId: data.narId,
      scope: data.scope,
      assetType: data.assetTypeId,
      assetTypeValue: data.assetTypeValue
    });
  }

  getGCPComponentsData(): void {
    this.componentsLoading = true;
    this.gcpRolesService.getMasterDataGCPComponents().subscribe(data => {
      this.gcpComponentsList = data;
      this.componentsLoading = false;
    }, error => {
      this.componentsLoading = false;
      console.log(error);
    });
  }

  getNarOwnersData(): void {
    this.narOwnersLoading = true;
    this.gcpRolesService.getNarOwners().subscribe(data => {
      this.narOwnersList = data;
      this.narOwnersLoading = false;
    }, error => {
      this.narOwnersLoading = false;
      console.log(error);
    });
  }

  getGCPServicesData(componentId): void {
    this.serviceLoading = true;
    this.gcpRolesService.getMasterDataGCPServices(componentId).subscribe(data => {
      this.serviceLoading = false;
      this.gcpServicesList = data;
    }, error => {
      this.serviceLoading = false;
      console.log(error);
    });
  }

  getPrincipalTypeData(): void {
    this.principalTypeLoading = true;
    this.gcpRolesService.getMasterDataPrincipalType().subscribe(data => {
      this.principallypelist = data;
      this.principalTypeLoading = false;
    }, error => {
      console.log(error);
    });
  }

  getGCPCustomOrPredefinedRoles(serviceId: string): void {
    this.roleLoading = true;
    this.gcpRolesService.getCustomOrPredefinedRoles(serviceId).subscribe(data => {
      this.gcpRolesList = data;

      if (this.editModeEnabled) {
        let receivedRoles: GCPCustomOrPredefinedRoles[] = [];
        receivedRoles = this.gcpRolesList.reduce((result, v) => {
          return this.receivedRolesIdList.includes(v.roleId) ? result : [...result, v];
        }, []);

        this.bindRoleForm.get('gcpRolesList').patchValue(receivedRoles);
      }

      this.roleLoading = false;
    }, error => {
      console.log(error);
    });
  }

  getAssetData(): void {
    this.assetTypeLoading = true;
    this.gcpRolesService.getMasterAssetTypes().subscribe(data => {
      this.assetTypeList = data;
      this.assetTypeLoading = false;
    }, error => {
      console.log(error);
    });
  }

  getNarOwnersList(): void {
    this.narOwnersLoading = true;
    this.gcpRolesService.getNarOwners().subscribe(data => {
      this.narOwnersList = data;
      this.narOwnersLoading = false;
    }, error => {
      console.log(error);
    });
  }

  onSubmit() {
    console.log(this.bindRoleForm.value);

    if (this.editModeEnabled) {
      this.raiseRequestForRoleBinding();
    } else {
      this.raiseRequestUpdateForRoleBinding();
    }
  }

  narIdChanged(event: any) {
    if (this.narIdSaved !== (event.target as HTMLSelectElement).value) {
      this.narIdIsValid = false;
    }

    if (this.narIdSaved !== (event.target as HTMLSelectElement).value) {
      this.narIdIsValid = true;
    }
  }

  onCheckNarId() {
    this.narIdSaved = this.bindRoleForm.get('narId').value;

    if (this.narOwnersList.length > 0) {
      const found = this.narOwnersList.some(owner => owner.narId === this.narIdSaved);

      if (found) {
        this.narIdIsValid = true;
        this.notifier.showSuccessMessage("NarID found");
      } else {
        this.narIdIsValid = false;
        this.notifier.showErrorMessage("NarID not found");
      }
    }
  }

  resetDetails() {
    if (this.editModeEnabled) {
      this.bindRoleForm.get('serviceId').reset();
      this.bindRoleForm.get('componentId').reset();
      this.gcpRolesList = [];
    }

    this.bindRoleForm.get('gcpRolesList').reset();
    this.bindRoleForm.get('assetType').reset();
    this.bindRoleForm.get('assetTypeValue').reset();
    this.bindRoleForm.get('scope').reset();
    this.bindRoleForm.get('principalType').reset();
    this.bindRoleForm.get('principalTypeValue').reset();
    this.bindRoleForm.get('businessJustification').reset();
    this.bindRoleForm.get('narId').reset();
  }

  componentNameSelected(event: any) {
    this.getGCPServicesData((event.target as HTMLSelectElement).value);
  }

  serviceNameSelected(event: any) {
    this.getGCPCustomOrPredefinedRoles((event.target as HTMLSelectElement).value);
  }

  public get title(): string {
    return GCPRoleManagement.GCP_ROLES_MANAGEMENT_MODULE_TITLE;
  }

  public get titleDetails(): string {
    return BindRole.OBJECT_TITLE;
  }

  pageLoadingSpinner(): boolean {
    return (
      this.narOwnersLoading ||
      this.serviceLoading ||
      this.assetTypeLoading ||
      this.principalTypeLoading ||
      this.roleLoading ||
      this.roleBindingRequestLoading ||
      this.componentsLoading ||
      this.roleBindingEditRequestLoading
    );
  }

  generateSuccessMessage(response: any) {
    return `Request: ${response.data.id} has been raised successfully.`;
  }

  generateErrorMessage(error: any) {
    console.error(error);
    return "Something went wrong. Please try again later.";
  }

  raiseRequestForRoleBinding(): void {
    this.roleBindingRequestLoading = true;
    const data = this.prepareDataForRoleCreationRequestObject();
    this.gcpRolesService.raiseRequestForRoleBinding(data).subscribe(
      (response) => {
        this.notifier.showSuccessMessage(this.generateSuccessMessage(response));
        this.resetDetails();
        this.roleBindingRequestLoading = false;
      },
      (error) => {
        this.notifier.showErrorMessage(this.generateErrorMessage(error));
        this.roleBindingRequestLoading = false;
      }
    );
  }

  raiseRequestUpdateForRoleBinding(): void {
    this.roleBindingEditRequestLoading = true;
    const data = this.prepareDataForRoleCreationRequestObject();
    this.gcpRolesService.raiseRequestUpdateForRoleBinding(data, this.receivedRequestId).subscribe(
      (data) => {
        this.notifier.showSuccessMessage(this.generateEditSuccessMessage(this.receivedRequestId));
        this.resetDetails();
        this.roleBindingEditRequestLoading = false;
      },
      (error) => {
        this.notifier.showErrorMessage(this.generateErrorMessage(error));
        this.roleBindingEditRequestLoading = false;
      }
    );
  }

  protected generateEditSuccessMessage(requestId: any) {
    return `Request: ${requestId} has been updated successfully.`;
  }

  getSelectedRolesListForRoleBinding(): string {
    const roleList: string[] = [];
    if (this.bindRoleForm.get('gcpRolesList').value) {
      if (this.bindRoleForm.get('gcpRolesList').value.length > 0) {
        this.bindRoleForm.get('gcpRolesList').value.forEach((element) => {
          roleList.push(element.roleId);
        });
      }
    }
    return roleList.toString();
  }
  
  prepareDataForRoleCreationRequestObject(): roleBindingObject {
  const data: roleBindingObject = {
    componentId: this.bindRoleForm.get('componentId').value,
    serviceId: this.bindRoleForm.get('serviceId').value,
    prefferedCustomRoleName: this.getSelectedRolesListForRoleBinding(),
    requestorEmailId: localStorage.getItem("lastUserName"),
    principalTypeId: this.bindRoleForm.get('principalType').value,
    principalTypeValue: this.bindRoleForm.get('principalTypeValue').value,
    scope: this.bindRoleForm.get('scope').value,
    roleDescription: '', // You can set a description here if needed
    assetTypeId: this.bindRoleForm.get('assetType').value,
    assetTypeValue: this.bindRoleForm.get('assetTypeValue').value,
    businessJustification: this.bindRoleForm.get('business Justification').value,
    narId: this.bindRoleForm.get('narId').value
  };

  return data;
}

}


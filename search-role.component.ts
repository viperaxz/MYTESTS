import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator, MatTableDataSource, PageEvent, Sort } from '@angular/material';
import { MatTableFreeTextFilterPipe } from '@modules/gcp-roles/pipes/mat-table-free-text-filter.pipe';
import { GcpRolesService } from '@modules/gcp-roles/services/gcp-roles.service';
import { GCPRoleManagement } from '@modules/gcp-roles/common/gcp-role-management.data';
import { SearchRoles } from '@modules/gcp-roles/flows/search-roles/search-roles';
import {
  GCPComponents,
  GCPCustomOrPredefinedRoles,
  GCPPermission,
  GCPService,
  PrincipalType,
  roleDetails,
  RoleRecommendations,
} from './search-roles'; // Assuming search-roles is in the same directory

@Component({
  selector: 'search-roles',
  templateUrl: './search-roles.component.html',
  styleUrls: ['./search-roles.component.scss'],
  providers: [MatTableFreeTextFilterPipe],
})
export class SearchRolesComponent implements OnInit {
  data: roleDetails;
  displayedColumns: string[] = [];
  gcpComponentsList: GCPComponents[] = [];
  searchRoleForm: FormGroup;
  principallypelist: PrincipalType[] = [];
  gcpServicesList: GCPService[] = [];
  gcpPermissionsList: GCPPermission[] = [];
  gcpCustomOrPredefinedRoles: GCPCustomOrPredefinedRoles[] = [];
  roleRecommendationsList: RoleRecommendations[] = [];
  dataSource = new MatTableDataSource<RoleRecommendations>();
  roleSearched: boolean = false;
  selectedPrincipalType: string = null;
  isPrincipalTypeIsCyberArc: boolean = false;
  selection = new SelectionModel<RoleRecommendations>(true, []);

  @ViewChild(MatPaginator) paginator: MatPaginator; // MatPaginator Output
  pageEvent: PageEvent;
  searchText: string;
  componentsLoading: boolean = false;
  serviceLoading: boolean = false;
  principalTypeLoading: boolean = false;
  searchRolesLoading: boolean = false;
  customOrPredefinedRolesLoading: boolean = false;

  constructor(private formBuilder: FormBuilder, private gcpRolesService: GcpRolesService) {
    this.prepareDefaultForm();
  }

  ngOnInit() {
    this.getPrincipalTypeData();
    this.getGCPComponentsData();
    this.displayedColumns = ['roleName', 'roleDescription', 'permissions', 'businessJustification', 'scope'];
    this.dataSource.paginator = this.paginator;

  }

  getPrincipalTypeData(): void {
    this.principalTypeLoading = true;
    this.gcpRolesService.getMasterDataPrincipalType().subscribe(
      (data) => {
        this.principallypelist = data;
        this.principalTypeLoading = false;
      },
      (error) => {
        this.principalTypeLoading = false;
        console.log(error);
      }
    );
  }

  prepareDefaultForm(): void {
    this.searchRoleForm = this.formBuilder.group({
      componentId: new FormControl(null, [Validators.required]),
      principalType: new FormControl(),
      serviceId: new FormControl(null, [Validators.required]),
      searchCriteria: new FormControl('role'),
      gcpCustomOrPredefinedRoles: new FormControl(null, [Validators.required]),
    });
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

  getGCPServicesData(componentId: void) {
    this.serviceLoading = true;
    this.gcpRolesService.getMasterDataGCPServices(componentId).subscribe(
      (data) => {
        this.gcpServicesList = data;
        this.serviceLoading = false;
      },
      (error) => {
        console.log(error);
        this.serviceLoading = false;
      }
    );
  }

  getGCPCustomOrPredefinedRoles(serviceld: string): void {
    this.customOrPredefinedRolesLoading = true;
    this.gcpRolesService.getCustomOrPredefinedRoles(serviceld).subscribe(
      (data) => {
        this.gcpCustomOrPredefinedRoles = data;
        this.customOrPredefinedRolesLoading = false;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  getGCPPermissionsData(serviceId: string): void {
    this.gcpRolesService.getMasterDataGCPPermissions(serviceId).subscribe(
      (data) => {
        this.gcpPermissionsList = data;
      },
      (error) => {
        console.log(error);
      });
  }

  getRecommendedRoles(): void {
    this.searchRolesLoading = true;
    const data = this.prepareDataforSharedService();
    this.gcpRolesService.getRecommendedRoles(
      data.serviceld,
      data.principalType ? data.principalType.id : null,
      data.roleld,
      data.permissions
    ).subscribe(
      (response) => {
        console.log("Role Recommendations", response);
        this.roleRecommendationsList = response;
        this.roleRecommendationsList.forEach((data) => {
          data.permissionslist = data.permissions ? data.permissions.split(',') : [];
        });
        this.searchRolesLoading = false;
      },
      (error) => {
        console.log(error);
        this.searchRolesLoading = false;
      }
    );
  }

  onSubmit() {
    console.log("SearchRoleform", this.searchRoleForm.value);
    this.roleSearched = true;
    this.getRecommendedRoles();
  }

  onSearchCriteriaChange(event: any) {
    if (this.searchRoleForm.get('searchCriteria').value && this.searchRoleForm.get('searchCriteria').value === 'role') {
      this.getGCPCustomOrPredefinedRoles(this.searchRoleForm.get('serviceId').value);
      this.searchRoleForm.addControl('gcpCustomOrPredefinedRoles', new FormControl(null, [Validators.required]));
      this.searchRoleForm.removeControl('gcpPermissionsList');
    } else {
      this.searchRoleForm.addControl('gcpPermissionsList', new FormControl([], [Validators.required]));
      this.searchRoleForm.removeControl('gcpCustomOrPredefinedRoles');
    }
  }

  resetDetails(event: any) {
    this.roleSearched = false;
    this.gcpServicesList = [];
    this.gcpCustomOrPredefinedRoles = [];
    this.gcpPermissionsList = [];
    this.searchRoleForm.reset();
    this.prepareDefaultForm();
  }

  componentNameSelected(event: any) {
    this.getGCPServicesData((event.target as HTMLSelectElement).value);
  }

  principalTypeSelected(event: any) {
    this.selectedPrincipalType = this.principallypelist.find(pType => pType.id === (event.target as HTMLSelectElement).value).principalType;
    this.isPrincipalTypeIsCyberArc = GCPRoleManagement.PRINCIPAL_TYPE_CYBER_ARC.toLowerCase() === this.selectedPrincipalType.toLowerCase() ? true : false;
    this.roleSearched = false;
    this.displayedColumns = this.prepareTableHeaders();

    if (this.isPrincipalTypeIsCyberArc) {
      this.searchRoleForm.addControl('principalName', new FormControl(null, [Validators.required]));
    } else {
      this.searchRoleForm.removeControl('principalName');
    }
  }

  serviceNameSelected(event: any) {
    console.log("this.searchRoleForm.get('serviceId').value", this.searchRoleForm.get('serviceId').value);
    console.log("this.searchRoleForm", this.searchRoleForm);
    this.getGCPPermissionsData((event.target as HTMLSelectElement).value);
    this.getGCPCustomOrPredefinedRoles((event.target as HTMLSelectElement).value);
  }

  public get title(): string {
    return GCPRoleManagement.GCP_ROLES_MANAGEMENT_MODULE_TITLE;
  }

  public get titleDetails(): string {
    return SearchRoles.OBJECT_TITLE;
  }

  prepareTableHeaders() {
    return this.isPrincipalTypeIsCyberArc
      ? ['roleName', 'roleDescription', 'permissions', 'businessJustification', 'scope']
      : ['roleName', 'roleDescription', 'permissions', 'businessJustification', 'scope'];
  }
  
  prepareDataForSharedService(): roleDetails {
    const selectedRoleName = this.searchRoleForm.get('gcpCustomOrPredefinedRoles')
      ? this.searchRoleForm.get('gcpCustomOrPredefinedRoles').value
      : null;
    const selectedRole = selectedRoleName
      ? this.gcpCustomOrPredefinedRoles.find((role) => role.roleName === selectedRoleName)
      : null;
    const roleId = selectedRole ? selectedRole.roleId : null;
    const selectedService = this.gcpServicesList.find(
      (gcpService) => gcpService.gcpServiceId === this.searchRoleForm.get('serviceId').value
    );
    const serviceId = selectedService.gcpServiceId;
    const principalTypeId = this.searchRoleForm.get('principalType').value
      ? this.principallypelist.find(
          (pType) => pType.id === this.searchRoleForm.get('principalType').value
        ).principalType
      : null;
    const permissionNames = this.searchRoleForm.get('gcpPermissionsList')
      ? this.searchRoleForm.get('gcpPermissionsList').value
      : null;
  
    const permissions = permissionNames
      ? permissionNames.map((permissionName) =>
          this.gcpPermissionsList.find((permission) => permission.permissionName === permissionName)
            .permissionId
        )
      : null;
  
    const data: roleDetails = {
      principalType: this.principallypelist.find((pType) => pType.id === this.searchRoleForm.get('principalType').value),
      assetId: null,
      principalName: this.isPrincipalTypeIsCyberArc
        ? this.searchRoleForm.get('principalName').value
        : null,
      isPrincipalTypeCyberArc: this.isPrincipalTypeIsCyberArc,
      gcpService: this.gcpServicesList.find(
        (gcpService) => gcpService.gcpServiceId === this.searchRoleForm.get('serviceId').value
      ),
      gcpPermissions: this.searchRoleForm.get('gcpPermissionsList')
        ? this.searchRoleForm.get('gcpPermissionsList').value
        : null,
      gcpCustomOrPredefinedRoles: selectedRoleName
        ? this.gcpCustomOrPredefinedRoles.find((role) => role.roleName === selectedRoleName)
        : null,
      roleId: roleId ? parseInt(roleId) : null,
      serviceId: serviceId ? parseInt(serviceId) : null,
      principalTypeId: principalTypeId ? parseInt(principalTypeId) : null,
      permissions: permissions,
    };
  
    if (this.searchRoleForm.get('searchCriteria').value && this.searchRoleForm.get('searchCriteria').value === 'role') {
      data.gcpCustomOrPredefinedRoles = this.searchRoleForm.get('gcpCustomOrPredefinedRoles').value;
    } else {
      const gcpPermissions: GCPPermission[] = [];
      this.searchRoleForm.get('gcpPermissionsList').value.forEach((selectedPermission) => {
        gcpPermissions.push(
          this.gcpPermissionsList.find(
            (gcpPermission) => gcpPermission.permissionName === selectedPermission
          )
        );
      });
      data.gcpPermissions = gcpPermissions;
    }
  
    return data;
  }
  
  sortData(sort: Sort) {
    const data = this.roleRecommendationsList.slice();
    if (sort.active || sort.direction) {
      this.roleRecommendationsList = data;
      return;
    }
    this.roleRecommendationsList = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'principalType':
          return this.compare(a.principalType, b.principalType, isAsc);
        case 'roleName':
          return this.compare(a.roleName, b.roleName, isAsc);
        case 'principalName':
          return this.compare(a.principalName, b.principalName, isAsc);
        case 'permissions':
          return this.compare(a.permissions, b.permissions, isAsc);
        default:
          return 0;
      }
    });
  }
  
  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
  
  pageLoadingSpinner(): boolean {
    return (
      this.serviceLoading ||
      this.principalTypeLoading ||
      this.searchRolesLoading ||
      this.componentsLoading ||
      this.customOrPredefinedRolesLoading
    );
  }

}

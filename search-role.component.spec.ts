import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatPaginator, PageEvent, Sort } from '@angular/material';
import { MatTableFreeTextFilterPipe } from '@modules/gcp-roles/pipes/mat-table-free-text-filter.pipe';
import { GcpRolesService } from '@modules/gcp-roles/services/gcp-roles.service';
import { GCPComponents, GCPCustomOrPredefinedRoles, GCPPermission, GCPService, PrincipalType, roleDetails, RoleRecommendations } from './search-roles';
import { SearchRolesComponent } from './search-roles.component';
import { of } from 'rxjs';

describe('SearchRolesComponent', () => {
  let component: SearchRolesComponent;
  let fixture: ComponentFixture<SearchRolesComponent>;

  const mockFormBuilder = {
    group: (controls: any, options: any) => new FormGroup(controls),
  };

  const mockGcpRolesService = {
    getMasterDataPrincipalType: () => {},
    getMasterDataGCPComponents: () => {},
    getMasterDataGCPServices: (componentId: string) => {},
    getCustomOrPredefinedRoles: (serviceId: string) => {},
    getMasterDataGCPPermissions: (serviceId: string) => {},
    getRecommendedRoles: (serviceId: string, principalTypeId: string, roleId: string, permissions: string[]) => {},
  };

  const mockMatTableFreeTextFilterPipe = {
    transform: (data: any, searchText: string, columnsToFilter: string[]) => data,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SearchRolesComponent],
      providers: [
        { provide: FormBuilder, useValue: mockFormBuilder },
        { provide: GcpRolesService, useValue: mockGcpRolesService },
        { provide: MatTableFreeTextFilterPipe, useValue: mockMatTableFreeTextFilterPipe },
      ],
    });

    fixture = TestBed.createComponent(SearchRolesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get principal type data', () => {
    component.getPrincipalTypeData();
    // todo: add assertions
  });

  it('should prepare default form', () => {
    component.prepareDefaultForm();
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

  it('should get GCP custom or predefined roles', () => {
    const serviceId = '2';
    component.getGCPCustomOrPredefinedRoles(serviceId);
    // todo: add assertions
  });

  it('should get GCP permissions data', () => {
    const serviceId = '2';
    component.getGCPPermissionsData(serviceId);
    // todo: add assertions
  });

  it('should get recommended roles', () => {
    component.onSubmit();
    // todo: add assertions
  });

  it('should handle search criteria change', () => {
    const event = {
      target: {
        value: 'role',
      },
    };
    component.onSearchCriteriaChange(event);
    // todo: add assertions
  });

  it('should reset details', () => {
    component.resetDetails();
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

  it('should handle principal type selected', () => {
    const event = {
      target: {
        value: '1',
      },
    };
    component.principalTypeSelected(event);
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

  it('should prepare table headers', () => {
    const headers = component.prepareTableHeaders();
    // todo: add assertions
  });

  it('should prepare data for shared service', () => {
    component.searchRoleForm.patchValue({
      // Populate form values for testing
    });
    const data = component.prepareDataForSharedService();
    // todo: add assertions
  });

  it('should sort data', () => {
    const sort: Sort = {
      active: 'roleName',
      direction: 'asc',
    };
    component.sortData(sort);
    // todo: add assertions
  });

  it('should check if page is loading', () => {
    const loading = component.pageLoadingSpinner();
    // todo: add assertions
  });
});

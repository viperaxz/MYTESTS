import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestManagementService } from '@modules/gcp-roles/services/request-management-service';
import { EditorContainerService } from '@platform/portal/components/components-common';
import { LayoutContainer, LayoutContainerUtils } from '@platform/portal/elements/layout-containers';
import { AccessPermissionService } from '@shared/services/access-permission.service';
import { RequestManagementContainerComponent } from './request-management-container.component';
import { of } from 'rxjs';

describe('RequestManagementContainerComponent', () => {
  let component: RequestManagementContainerComponent;
  let fixture: ComponentFixture<RequestManagementContainerComponent>;

  const mockActivatedRoute = {
    params: of({ id: 'mockGroupId' }),
  };

  const mockRequestManagementService = {
    init: (groupId: string) => {},
    refresh: () => {},
    requestMode: false,
    entityId: 'mockEntityId',
    generateApplicationProfileAttributesRoute: () => 'mockAttributesRoute',
    generateRequestManagementHistoryRoute: () => 'mockHistoryRoute',
  };

  const mockAccessPermissionService = {
    isCloseEnabled: true,
  };

  const mockLayoutContainerUtils = {
    getContainer: (component: any) => ({} as LayoutContainer),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RequestManagementContainerComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: RequestManagementService, useValue: mockRequestManagementService },
        { provide: AccessPermissionService, useValue: mockAccessPermissionService },
        { provide: LayoutContainerUtils, useValue: mockLayoutContainerUtils },
      ],
    });

    fixture = TestBed.createComponent(RequestManagementContainerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize tabs in initControls', () => {
    component.initControls();
    expect(component.tabs).toEqual([
      {
        caption: 'Attributes',
        route: 'mockAttributesRoute',
        enabled: true,
      },
      {
        caption: 'History',
        route: 'mockHistoryRoute',
        enabled: true,
      },
    ]);
  });

  it('should return the correct title', () => {
    const entityId = 'mockEntityId';
    component['requestManagementService'].entityId = entityId;
    expect(component.title).toBe('Request Management #' + entityId);
  });

  it('should return the correct header options', () => {
    const closeAction = component['closeAction'];
    closeAction.enabled = true;
    component['containerService'].actions.next([closeAction]);
    expect(component.headerOptions).toEqual([closeAction]);
  });

  it('should return create mode based on requestManagementService', () => {
    const requestMode = false;
    component['requestManagementService'].requestMode = requestMode;
    expect(component.createMode).toBe(requestMode);
  });

  it('should handle children close and call the close method', () => {
    const closeSpy = spyOn(component, 'close');
    component.handleChildrenClose();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should close the container', () => {
    const containerCloseSpy = jasmine.createSpy('close');
    const layoutContainerUtils = TestBed.inject(LayoutContainerUtils);
    spyOn(layoutContainerUtils, 'getContainer').and.returnValue({
      close: containerCloseSpy,
    });

    component.close();
    expect(containerCloseSpy).toHaveBeenCalled();
  });


});

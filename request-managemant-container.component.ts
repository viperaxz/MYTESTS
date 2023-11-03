import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RequestManagementService } from '@modules/gcp-roles/services/request-management-service';
import { EditorContainerService } from '@platform/portal/components/components-common';
import { LayoutContainer, LayoutContainerUtils } from '@platform/portal/elements/layout-containers';
import { ModuleOption, ModuleOptionInterface } from '@shared/components/module-set/models/module-option.model';
import { ModuleTabInterface } from '@shared/components/module-set/models/module-tab.model';
import { AccessPermissionService } from '@shared/services/access-permission.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-request-management-container-page',
  templateUrl: './request-management-container.component.html',
  styleUrls: ['./request-management-container.component.scss'],
  providers: [EditorContainerService, RequestManagementService],
})
export class RequestManagementContainerComponent implements OnInit, OnDestroy {
  public tabs: ModuleTabInterface[] = [];
  private routerSubscription: Subscription;
  private headerOptions: ModuleOptionInterface[] = [];
  private closeAction: ModuleOption = new ModuleOption({
    caption: 'Close',
    action: () => this.close(),
  });

  constructor(
    private activatedRoute: ActivatedRoute,
    private containerService: EditorContainerService,
    private requestManagementService: RequestManagementService,
    private accessPermissionService: AccessPermissionService
  ) {
    this.closeAction.enabled = this.accessPermissionService.isCloseEnabled;
    this.containerService.actions.subscribe((actions) => {
      this.headerOptions = actions ? [...actions, this.closeAction] : [this.closeAction];
    });
  }

  ngOnInit() {
    this.routerSubscription = this.activatedRoute.params.subscribe((params) => {
      const routerGroupId: string = params['id'];
      this.requestManagementService.init(routerGroupId);
      this.initControls();
      setTimeout(() => {
        this.requestManagementService.refresh();
        this.requestManagementService.requestMode = false;
      }, 0);
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  protected initControls() {
    this.tabs = [
      {
        caption: 'Attributes',
        route: this.requestManagementService.generateApplicationProfileAttributesRoute(),
        enabled: true,
      },
      {
        caption: 'History',
        route: this.requestManagementService.generateRequestManagementHistoryRoute(),
        enabled: true,
      },
    ];
  }

  public get title(): string {
    return 'Request Management #' + this.requestManagementService.entityId;
  }

  public get headerOptions(): ModuleOptionInterface[] {
    return this.headerOptions;
  }

  public get createMode(): boolean {
    return this.requestManagementService.createMode;
  }

  public get tabs(): ModuleTabInterface[] {
    return this.tabs;
  }

  public handleChildrenClose() {
    this.close();
  }

  public close() {
    const container: LayoutContainer = LayoutContainerUtils.getContainer(this);
    if (container) {
      container.close();
    }
  }
}

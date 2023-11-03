import { HttpClient } from '@angular/common/http';
import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ApprovalWorkflowStep,
  RequestActionEnum,
  RequestManagementConst,
  RequestStatusEnum,
} from '@modules/gcp-roles/common/gcp-role-management.data';
import { approvalGroup, requestUpdateObject } from '@modules/gcp-roles/components/search-roles/search-roles';
import { BindRole } from '@modules/gcp-roles/flows/bind-role/bind-role';
import { RoleDetails } from '@modules/gcp-roles/flows/role-details/role-details';
import { GcpRolesService } from '@modules/gcp-roles/services/gcp-roles.service';
import {
  RequestManagementFields,
  RequestManagementService,
} from '@modules/gcp-roles/services/request-management-service';
import { CurrentPrincipalServiceImpl } from '@platform/core/services/authentication-service';
import { EditorContainerService } from '@platform/portal/components/components-common';
import {
  NotificationComponent,
  NotificationComponentAccessor,
  LayoutContainer,
  LayoutContainerUtils,
} from '@platform/portal/elements/layout-containers';
import { DialogService } from '@platform/portal/services/dialog-service';
import { ModuleOption } from '@shared/components/module-set/models/module-option.model';
import { ButtonAccessModel, EMPAccessConst } from '@shared/model/access-model';
import { FormUtils } from '@shared/model/data-model';
import { AccessPermissionService } from '@shared/services/access-permission.service';
import { Subscription } from 'rxjs';

import { RequestActionDialogComponent } from '../request-action-dialog/request-action-dialog.component';

@Component({
  selector: 'app-request-management-attributes-page',
  templateUrl: './request-management-attributes.component.html',
  styleUrls: ['./request-management-attributes.component.scss'],
})
export class RequestManagementAttributesComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  title: string = RequestManagementConst.REQUEST_MEMT_ATTRIBUTE_TITLE;
  loading_: boolean = false;
  gcpServiceProductOwnerName: string;
  private approvalGroupsList: approvalGroup[] = [];
  private newApprovalGroupId: number;
  private completedFlag: boolean = false;
  aprvRejButtonFlag: boolean = false;
  private fields_: RequestManagementFields = new RequestManagementFields();
  private form_: FormGroup = FormUtils.createFormGroupFrom(this.fields_);
  accessModel: ButtonAccessModel = new ButtonAccessModel();
  loggedInUser: any = null;
  loggedInUserEmail: string = '';
  supportUserRole: string;
  userHolelist: string[] = [];
  private notifier: NotificationComponent;
  steps: ApprovalWorkflowStep[] = [];

  constructor(
    private gcpRolesService: GcpRolesService,
    private containerService: EditorContainerService,
    private entityService: RequestManagementService,
    private injector: Injector,
    private notification: NotificationComponentAccessor,
    private dialogService: DialogService,
    private http: HttpClient,
    authService: CurrentPrincipalServiceImpl,
    private router: Router,
    private requestManagementService: RequestManagementService,
    private accessPermissionService: AccessPermissionService
  ) {
    this.loading_ = true;
    this.loggedInUser =
      authService.currentPrincipal && authService.currentPrincipal.userId
        ? authService.currentPrincipal.userId
        : null;
    this.accessModel = this.accessPermissionService.hasButtonLevelAccess(
      RequestManagementConst.REQUEST_MANAGEMENT_PATH,
      EMPAccessConst.ATTRIBUTES
    );
  }

  ngOnInit(): void {
    this.notifier = this.notification.get();
    this.loggedInUserEmail = localStorage.getItem('lastUserName');
    this.subscriptions.push(
      this.entityService.entity.subscribe((data) => {
        setTimeout(() => {
          if (data) {
            console.log(data);
            if (data && data.businessContent) {
              let aux;
              try {
                aux = JSON.parse(data.businessContent);
                data.businessContent = aux;
              } catch (e) {
                console.error(e);
              }
              this.gcpServiceProductOwnerName = data.gcpServiceProductOwnerName;
              this.form_.patchValue(data);
              this.prepareWorkflowSteps(
                this.form_.get('status').value,
                this.form_.get('approvalGroup').value
              );
              this.subscriptions.push(
                this.gcpRolesService
                  .getGcpApprovalGroupMapping(this.loggedInUserEmail)
                  .subscribe((data) =>
                    this.checkUserApprovalStatus(
                      data,
                      this.form_.get('status').value,
                      this.form_.get('approvalGroup').value
                    )
                  )
              );
            } else {
              this.form_.patchValue({});
            }
          }
        }, 0);
      })
    );
  }

  checkUserApprovalStatus(data: approvalGroup[], oldStatus: string, oldApprovalGroupName: string) {
    this.approvalGroupsList = data;
    console.log(this.approvalGroupsList);
    let partialGroupName: string;

    if (this.checkContinue()) {
      if (
        oldStatus === RequestStatusEnum.SUBMITTED.valueOf() &&
        oldApprovalGroupName.indexOf("Service Product Owner") > -1
      ) {
        // Check if SPO or Enablement team should approve
        if (this.gcpServiceProductOwnerName === null || this.gcpServiceProductOwnerName) {
          // Enablement team should approve
          partialGroupName = "PRODUCT ENABLEMENT";

          this.approvalGroupsList.forEach((group) => {
            if (group.USER_GROUP_NAME.indexOf(partialGroupName) > -1) {
              this.newApprovalGroupId = group.APPROVAL_GROUP_ID;
              this.aprvRejButtonFlag = true;
            }
          });
        }
      }

      if (
        oldStatus === RequestStatusEnum.APPROVED.valueOf() &&
        (oldApprovalGroupName.indexOf("Service Product Owner") > -1 ||
          oldApprovalGroupName.indexOf("PRODUCT_ENABLEMENT") > -1)
      ) {
        // LEVEL 2A APPROVAL
        partialGroupName = "TAM COMPLIANCE";

        this.approvalGroupsList.forEach((group) => {
          if (group.USER_GROUP_NAME.indexOf(partialGroupName) > -1) {
            this.newApprovalGroupId = group.APPROVAL_GROUP_ID;
            this.aprvRejButtonFlag = true;
          }
        });

        partialGroupName = "CSO GUARDRAILS";

        this.approvalGroupsList.forEach((group) => {
          if (group.USER_GROUP_NAME.indexOf(partialGroupName) > -1) {
            this.newApprovalGroupId = group.APPROVAL_GROUP_ID;
            this.aprvRejButtonFlag = true;
          }
        });

        if (
          oldStatus === RequestStatusEnum.APPROVED.valueOf() &&
          oldApprovalGroupName.indexOf("IAM COMPLIANCE") > 1
        ) {
          // LEVEL 28 APPROVAL
          partialGroupName = "CSO GUARDRAILS";

          this.approvalGroupsList.forEach((group) => {
            if (group.USER_GROUP_NAME.indexOf(partialGroupName) > -1) {
              this.newApprovalGroupId = group.APPROVAL_GROUP_ID;
              this.aprvRejButtonFlag = true;
              this.completedFlag = true;
            }
          });
        }

        if (
          oldStatus === RequestStatusEnum.APPROVED.valueOf() &&
          oldApprovalGroupName.indexOf("CSO GUARDRAILS") > -1
        ) {
          // LEVEL 28 APPROVAL
          partialGroupName = "IAM COMPLIANCE";

          this.approvalGroupsList.forEach((group) => {
            if (group.USER_GROUP_NAME.indexOf(partialGroupName) > -1) {
              this.newApprovalGroupId = group.APPROVAL_GROUP_ID;
              this.aprvRejButtonFlag = true;
              this.completedFlag = true;
            }
          });
        }
      }
    }
  }


  private checkContinue(): boolean {
    if (
      this.form_.get('status').value === RequestStatusEnum.REJECTED.valueOf() ||
      this.form_.get('status').value === RequestStatusEnum.OPEN.valueOf() ||
      this.form_.get('status').value === RequestStatusEnum.COMPLETED.valueOf()
    ) {
      this.aprvRejButtonFlag = false;
      return false;
    }
    return true;
  }



  ngOnDestroy() {
    this.containerService.cleanupActions();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  public handleApproveRejectAmendActionClick(dialogTitle: string) {
    this.dialogService.createPopup(this.injector, RequestActionDialogComponent).show((context) => {
      context.component.entityTitle = dialogTitle;
      context.component.approvalGroupId = this.newApprovalGroupId;
      context.component.completedFlag = this.completedFlag;
      context.component.isAuthorized = this.accessModel.approve ? true : false;
      context.component.init(this.entityService, this.form_);

      context.component.onCancel = () => context.close();
      context.component.onClose = () => {
        context.close();
        this.close();
      };
    });
  }

  approveRequest() {
    this.handleApproveRejectAmendActionClick(RequestStatusEnum.APPROVED.valueOf());
  }

  rejectRequest() {
    this.handleApproveRejectAmendActionClick(RequestStatusEnum.REJECTED.valueOf());
  }

  amendRequest() {
    this.handleApproveRejectAmendActionClick(RequestStatusEnum.OPEN.valueOf());
  }

  public get loading(): boolean {
    return this.loading_;
  }

  public get form(): FormGroup {
    return this.form_;
  }

  public get fields(): RequestManagementFields {
    return this.fields_;
  }




  public close() {
    const container: LayoutContainer = LayoutContainerUtils.getContainer(this);
    if (container) {
      container.close();
    }
  }

  public getControlValue(type: any) {
    return this.form_.controls[type].value;
  }

  prepareWorkflowSteps(currentRequestStatus: string, approvalGroup: string): void {
    if (currentRequestStatus) {
      this.steps = ApprovalWorkflowStep.approvalWorkflowSteps;

      this.steps.forEach((step) => {
        if (step.approvalGroupNamesList.length == 0) {
          if (step.stepStatusList.includes(currentRequestStatus)) {
            step.stageApproved = true;
          } else {
            if (this.requestApproved(currentRequestStatus) && step.approvalGroupNamesList.indexOf(approvalGroup) > -1) {
              step.stageApproved = true;
            }
            if (this.requestRejected(currentRequestStatus) && step.approvalGroupNamesList.indexOf(approvalGroup) > -1) {
              step.stageRejected = true;
            }
          }
        }
      });

      console.log(this.steps);
    }
  }

  requestApproved(status: string): boolean {
    return [RequestStatusEnum.APPROVED.valueOf(), RequestStatusEnum.COMPLETED.valueOf()].includes(status);
  }

  requestRejected(status: string): boolean {
    return [RequestStatusEnum.REJECTED.valueOf()].includes(status);
  }

  editRequest() {
    if (RequestActionEnum.CLD_CUSTOM_ROLE_CREATION.valueOf().localeCompare(this.form_.get('action').value) === 0) {
      this.router.navigate([RoleDetails.MODULE_ROUTE, this.form_.get('requestId').value]);
    }
    if (RequestActionEnum.CLD_ROLE_BINDING.valueOf().localeCompare(this.form_.get('action').value) === 0) {
      this.router.navigate([BindRole.MODULE_ROUTE, this.form_.get('requestId').value]);
    }
  }

  prepareDataForUpdatingRequestObject(): requestUpdateObject {
    const data: requestUpdateObject = {
      status: RequestStatusEnum.CANCELLED.valueOf(),
      approvalComments: 'Request Cancelled by Requestor',
      actionBy: localStorage.getItem("lastUserName"),
      approverGroupId: null,
    };
    return data;
  }

  cancelRequest() {
    if (confirm("Please confirm to cancel the request")) {
      this.loading_ = true;
      const data = this.prepareDataForUpdatingRequestObject();
      this.gcpRolesService.updateRequestStatus(this.form_.get("requestId").value, data).subscribe(
        (response) => {
          this.notifier.showSuccessMessage(this.generateSuccessMessage(response.data.Id));
          setTimeout(() => {
            this.requestManagementService.refresh();
            this.getApprovalGroupNameFromApprovalGroupId();
          }, 0);
        },
        (error) => {
          this.loading_ = false;
          this.notifier.showErrorMessage(this.generateErrorMessage(error));
        }
      );
    }
  }

  getApprovalGroupNameFromApprovalGroupId() {
    this.steps = ApprovalWorkflowStep.approvalWorkflowSteps;
    this.steps.forEach((step) => {
      step.stageApproved = false;
      step.stageRejected = false;
    });
  }

  showEditButton(): boolean {
    return (
      RequestStatusEnum.OPEN.valueOf().localeCompare(this.form_.get('status').value) === 0 &&
      this.form_.get('businessContent').value?.requestorEmailId &&
      this.form_.get('businessContent').value?.requestorEmailId.localeCompare(localStorage.getItem("lastUserName")) === 0
    );
  }

  showCancelRequestButton(): boolean {
    return (
      RequestStatusEnum.CANCELLED.valueOf().localeCompare(this.form_.get('status').value) !== 0 &&
      RequestStatusEnum.COMPLETED.valueOf().localeCompare(this.form_.get('status').value) !== 0 &&
      this.form_.get('businessContent').value?.requestorEmailId &&
      this.form_.get('businessContent').value?.requestorEmailId.localeCompare(localStorage.getItem("lastUserName")) === 0
    );
  }

  protected generateSuccessMessage(id: any) {
    return `Request: ${id} has been cancelled successfully.`;
  }

  protected generateErrorMessage(error: any) {
    console.error(error);
    return "Something went wrong. Please try again later.";
  }

}
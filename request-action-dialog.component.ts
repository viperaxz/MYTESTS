import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NotificationComponent, NotificationComponentAccessor } from '@elements/notification/notification.component';
import { RequestManagement, RequestManagementConst, RequestStatusEnum } from '@modules/gcp-roles/common/gcp-role-management.data';
import { requestUpdateObject, approvalGroup } from '../../../search-roles/search-roles';
import { GcpRolesService } from '@modules/gcp-roles/services/gcp-roles.service';
import { RequestManagementFields } from '@modules/gcp-roles/services/request-management-service';
import { SingularEntityService } from '@shared/model/crud-model';
import { FormUtils } from '@shared/model/data-model';
import 'rxjs/internal/operators/finalize';
import { Subscription } from 'rxjs/Rx';

export interface DisplayValue {
  caption: string;
  value: any;
  isObject: boolean;
}

@Component({
  selector: 'app-request-action-dialog',
  templateUrl: './request-action-dialog.component.html',
  styleUrls: ['./request-action-dialog.component.scss']
})
export class RequestActionDialogComponent implements OnInit, OnDestroy {
  public static COMPONENT_ID = 'requestActionDialogComponent';
  private title_: string = '';
  private status: string = '';
  private requestId_: string = '';
  private entityTitle_: string = '';
  private completedFlag_ = false;
  private approvalGroupId_: number;
  private isAuthorized_: boolean = true;
  private approvalGroupsSubscription: Subscription;
  private dataSubscription: Subscription;
  private entityService: SingularEntityService<any>;
  private formFields_: RequestManagement;
  private fields_: RequestManagementFields = new RequestManagementFields();
  private form_: FormGroup = FormUtils.createFormGroupFrom(this.fields_);
  private captionWidth_ = '20%';
  private notifier_: NotificationComponent;
  private valuesCache_: DisplayValue[] = [];
  private loading_: boolean = false;
  private onClose_: () => void;
  private onCancel_: () => void;

  constructor(private gcpRolesService: GcpRolesService, notification: NotificationComponentAccessor) {
    this.notifier_ = notification.get();
  }

  ngOnInit(): void {
    this.dataSubscription = this.entityService.entity.subscribe(data => this.bindData(data));
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
      this.dataSubscription = null;
    }
    if (this.approvalGroupsSubscription) {
      this.approvalGroupsSubscription.unsubscribe();
      this.approvalGroupsSubscription = null;
    }
  }

  public init(entityService: SingularEntityService<any>, requestManagementData: FormGroup) {
    if (!entityService || !requestManagementData) {
      throw new Error("Empty parameters (entityService or requestManagementData)");
    }
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
      this.dataSubscription = null;
    }
    this.entityService = entityService;
    this.form_ = requestManagementData;
    this.loading_ = true;
    this.dataSubscription = this.entityService.entity.subscribe(data => this.bindData(data));
  }

  protected bindData(entity: any) {
    console.log(entity);
    this.requestId_ = entity.requestId;
    if (this.entityTitle_ == RequestStatusEnum.APPROVED.valueOf()) {
      this.title_ = RequestManagementConst.REQUEST_APPROVE_TITLE;
      this.status = RequestStatusEnum.APPROVED.valueOf();
      if (this.completedFlag_) {
        this.status = RequestStatusEnum.COMPLETED.valueOf();
      } else if (this.entityTitle_ == RequestStatusEnum.REJECTED.valueOf()) {
        this.title_ = RequestManagementConst.REQUEST_REJECT_TITLE;
        this.status = RequestStatusEnum.REJECTED.valueOf();
      } else if (this.entityTitle_ == RequestStatusEnum.OPEN.valueOf()) {
        this.title_ = RequestManagementConst.REQUEST_AMEND_TITLE;
        this.status = RequestStatusEnum.OPEN.valueOf();
      }
      this.setFieldsStatus();
      this.loading_ = false;
    }
  }

  private setFieldsStatus() {
    if (this.completedFlag_) {
      this.form_.get("scope").enable();
      this.form_.get("conditions").enable();
      this.form_.get("epa").enable();
    } else {
      this.form_.get("scope").disable();
      this.form_.get("conditions").disable();
      this.form_.get("epa").disable();
    }
  }

  raiseRequestStatus(): void{
    const data=this.prepareDataForUpdatingRequestObject();
    this.gcpRolesService.updateRequestStatus(this.requestId_,data).subscribe((data) =>{
        this.notifier_.showSuccessMessage(this.generateSuccessMessage(this.requestId_));

    },(error){
        this.notifier_.showErrorMessage(this.generateErrorMessage(error));
    })
  }

  private prepareDataForUpdatingRequestObject() {
    let conditions: string = null;
    let scope: string = null;
    let epa: string = null;
    if (this.completedFlag_) {
      if (this.form_.get("conditions").enabled) {
        conditions = this.form_.get("conditions").value;
      }
      if (this.form_.get("scope").enabled) {
        scope = this.form_.get("scope").value;
      }
      if (this.form_.get("epa").enabled) {
        epa = this.form_.get("scope").value ? 'y' : null;
      }
    }
    const data: requestUpdateObject = {
      status: this.status,
      approvalComments: this.entityService.editingEntity.comments,
      actionBy: localStorage.getItem("lastUserName"),
      approverGroupId: this.approvalGroupId_,
      condition: conditions,
      epa: epa,
      scope: scope
    };
    console.log(this.approvalGroupId_);
    console.log(data);
    return data;
  }

  public handleSave() {
    this.loading_ = true;
    FormUtils.forceFormValidation(this.form_);
    if (this.form_.dirty) {
      return;
    }
    this.entityService.submit(this.form_.value);
    this.raiseRequestStatus();
    this.triggerClose();
  }

  private generateErrorMessage(error: any) {
    console.error(error);
    return "Something went wrong. Please try again later.";
  }

  protected generateSuccessMessage(entity: any) {
    return 'Request: ' + this.requestId_ + ' ' + this.entityTitle_;
  }

  public get valuesCache(): DisplayValue[] {
    return this.valuesCache_;
  }

  public get title(): string {
    return this.title_;
  }

  public set title(value: string) {
    this.title_ = value;
  }

  public get entityTitle(): string {
    return this.entityTitle_;
  }

  public set entityTitle(value: string) {
    this.entityTitle_ = value;
  }

  public set approvalGroupId(value: number) {
    this.approvalGroupId_ = value;
  }

  public get approvalGroupId(): number {
    return this.approvalGroupId_;
  }

  public set completedFlag(value: boolean) {
    this.completedFlag_ = value;
  }

  public get completedFlag(): boolean {
    return this.completedFlag;
  }

  public get isAuthorized(): boolean {
    return this.isAuthorized_;
  }

  public set isAuthorized(value: boolean) {
    this.isAuthorized_ = value;
  }

  public get captionWidth(): string {
    return this.captionWidth_;
  }

  public set captionWidth(value: string) {
    this.captionWidth_ = value;
  }

  public get loading(): boolean {
    return this.loading_;
  }

  public get formFields(): RequestManagement {
    return this.formFields_;
  }

  public get form(): FormGroup {
    return this.form_;
  }

  public get fields(): RequestManagementFields {
    return this.fields_;
  }

  public get onClose(): () => void {
    return this.onClose_;
  }

  public set onClose(value: () => void) {
    this.onClose_ = value;
  }

  public triggerClose() {
    if (this.onClose_) {
      this.onClose_();
    }
  }

  public get onCancel(): () => void {
    return this.onCancel;
  }

  public triggerCancel() {
    if (this.onCancel) {
      this.form_.patchValue({ 'comments': null });
      this.onCancel();
    }
  }

  trackByFn(index, item) {
    return index;
  }

  getControlLabel(type: any) {
    return this.form_.controls[type].value;
  }
}

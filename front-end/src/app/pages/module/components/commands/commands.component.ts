import { ActivatedRoute } from "@angular/router";
import { Component, OnDestroy, ViewChild } from "@angular/core";

import { BlockUI, NgBlockUI } from "ng-block-ui";
import { BsModalRef, BsModalService, ModalOptions } from "ngx-bootstrap/modal";

import { debounceTime, Subject, Subscription } from "rxjs";

import { Feature } from "speakmaster-module-builder/features-builder";
import { CommandParameter, CommandParameterTypes } from "speakmaster-module-builder/default-commands-builder";

import { CommandsTableComponent, IDataTableRow } from "../../../../components/commands-table/commands-table.component";

import { IUser } from "../../../../models/user";
import { IUserModule } from "../../../../models/user-module";
import { LanguageCode } from "../../../../models/languages";
import { IUserModuleCommands, UserModuleCommand } from "../../../../models/user-module-commands";

import { AuthenticationService } from "../../../../services/authentication/authentication.service";
import { CommandEditorModalComponent } from "../../../../components/command-editor-modal/command-editor-modal.component";
import { MonacoCrlService } from "../../../../services/monaco-crl/monaco-crl.service";
import { UserModulesService } from "../../../../services/user-modules/user-modules.service";

@Component({
	selector: "app-module-commands",
	standalone: true,
	imports: [CommandsTableComponent],
	templateUrl: "./commands.component.html",
	styleUrl: "./commands.component.scss"
})
export class CommandsComponent implements OnDestroy {
	@BlockUI()
	private blockUI!: NgBlockUI;

	@ViewChild(CommandsTableComponent)
	private commandsTable!: CommandsTableComponent;

	public isCardCollapsed: boolean = false;
	public pendingChanges: Array<UserModuleCommand> = [];
	public currentCommands: IDataTableRow<UserModuleCommand>[] = [];

	private idModule: number;
	private interfaceLanguage: LanguageCode;
	private bsModalRef?: BsModalRef;
	private subscriptions: Subscription[] = [];
	private $saveTrigger: Subject<void> = new Subject();

	constructor (
		private readonly route: ActivatedRoute,
		private readonly modalService: BsModalService,
		private readonly authenticationService: AuthenticationService,
		private readonly monacoCrlService: MonacoCrlService,
		private readonly userModulesService: UserModulesService
	) {
		this.idModule = Number(this.route.snapshot.paramMap.get("idModule"));

		const user = this.authenticationService.loggedUser as IUser;
		this.interfaceLanguage = user.interfaceLanguage;

		this.subscriptions.push(
			this.$saveTrigger
				.pipe(debounceTime(500))
				.subscribe(() => this.saveCommands())
		);
	}

	public get userModule (): IUserModule | undefined {
		return this.userModulesService.userModules?.find(m => m.idModule === this.idModule);
	}

	public get features (): Feature[] {
		return this.userModule?.featuresDefinition || [];
	}

	public get userModuleCommands (): IUserModuleCommands[] {
		return this.userModule?.userModuleCommands || [];
	}

	public ngOnDestroy (): void {
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
	}

	public loadCurrentCommands (selectedLanguage?: LanguageCode): void {
		if (!selectedLanguage) {
			this.currentCommands = [];
			return;
		}

		const references = this.userModuleCommands.find(umc => umc.language === selectedLanguage)?.commands || [];
		this.currentCommands = references.map(reference => ({
			reference,
			command: reference.command,
			isToggleActive: reference.isActive || false,
			uriKey: "featureIdentifier",
			action: this.getFeatureName(reference.featureIdentifier),
			extras: "<ul class='mb-0 ps-3'>" + this.getFeatureParameters(reference.featureIdentifier, reference.parameters).join("") + "</ul>"
		}));
	}

	public editCommand (row: IDataTableRow<UserModuleCommand>): void {
		const originalCommand = row.command;
		const initialState: ModalOptions<CommandEditorModalComponent> = {
			initialState: { editingCommand: row },
			class: "modal-xl"
		};

		this.bsModalRef = this.modalService.show(CommandEditorModalComponent, initialState);

		this.subscriptions.push(
			this.bsModalRef.onHide!.subscribe(() => {
				if (originalCommand !== row.command) {
					row.reference.command = row.command;
					this.$saveTrigger.next();
					this.monacoCrlService.setEditorContent(row.reference.featureIdentifier + "-command.crl", row.command);
				}

				this.bsModalRef = undefined;
			})
		);
	}

	public toggleCommand (row: IDataTableRow<UserModuleCommand>): void {
		row.isToggleActive = !row.isToggleActive;
		row.reference.isActive = row.isToggleActive;
		this.$saveTrigger.next();
	}

	public deleteCommand (row: IDataTableRow<UserModuleCommand>): void {
	}

	public savePendingCommands (): void {
	}

	public saveCommands (): void {
	}

	private getFeatureName (featureIdentifier: string): string {
		const feature = this.features.find(f => f.identifier === featureIdentifier);
		const translation = feature?.translations[this.interfaceLanguage] ||
							feature?.translations[feature.defaultLanguage] ||
							feature?.translations[LanguageCode.EN_US];

		return translation?.name || featureIdentifier;
	}

	private getFeatureParameters (featureIdentifier: string, parameters: CommandParameter[] | undefined): string[] {
		const feature = this.features.find(f => f.identifier === featureIdentifier);
		if (!feature)
			return [];

		const values: string[] = [];
		for (const p of feature.parameters) {
			let value = "";
			const userParameter = parameters?.find(p2 => p2.identifier === p.identifier);
			if (!userParameter)
				continue;

			switch (userParameter.type) {
				case CommandParameterTypes.CONSTANT:
					value = `<span class='source-text'>${userParameter.value}</span>`;
					break;
				case CommandParameterTypes.VARIABLE:
				case CommandParameterTypes.RESTRICTED_VARIABLE:
					value = `<span class='variable-text'>{${userParameter.variableName}}</span>`;
					break;
				case CommandParameterTypes.UNDEFINED:
					continue;
			}

			const translation = p.translations[this.interfaceLanguage] ||
								p.translations[feature.defaultLanguage] ||
								p.translations[LanguageCode.EN_US];

			values.push(`<li>${translation?.name || p.identifier}: ${value}</li>`);
		}

		return values;
	}
}

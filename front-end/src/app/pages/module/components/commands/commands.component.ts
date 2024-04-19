import { ActivatedRoute } from "@angular/router";
import { Component, OnDestroy, ViewChild } from "@angular/core";

import { BsModalRef, BsModalService, ModalOptions } from "ngx-bootstrap/modal";

import { debounceTime, Subject, Subscription } from "rxjs";

import { Command } from "speakmaster-module-builder/default-commands-builder";
import { Feature } from "speakmaster-module-builder/features-builder";

import { ImportCommandsModalComponent } from "../../../../components/import-commands-modal/import-commands-modal.component";
import { CommandsTableComponent, ICommandsTableSettings, IDataTableRow } from "../../../../components/commands-table/commands-table.component";

import { IUserModule } from "../../../../models/user-module";
import { LanguageCode } from "../../../../models/languages";
import { IUserModuleCommands, UserModuleCommand } from "../../../../models/user-module-commands";

import { CommandEditorModalComponent } from "../../../../components/command-editor-modal/command-editor-modal.component";
import { FeaturesService } from "../../../../services/features/features.service";
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
	@ViewChild(CommandsTableComponent)
	private commandsTable!: CommandsTableComponent;

	public errorSaving: boolean = false;
	public isCardCollapsed: boolean = false;
	public pendingChanges: IUserModuleCommands[] = [];
	public currentCommands: IDataTableRow<UserModuleCommand>[] = [];

	public settings: ICommandsTableSettings = {
		canAdd: true,
		canEdit: true,
		canDelete: true,
		canImport: true,
		columns: {
			command: "Comando",
			action: "Ação (Funcionalidade)",
			extras: "Parâmetros",
			toggle: "Ativo"
		}
	};

	private idModule: number;
	private currentLanguage?: LanguageCode;
	private currentUserModuleCommands?: IUserModuleCommands;
	private bsModalRef?: BsModalRef;
	private subscriptions: Subscription[] = [];
	private $saveTrigger: Subject<boolean> = new Subject();

	constructor (
		private readonly route: ActivatedRoute,
		private readonly modalService: BsModalService,
		private readonly featuresService: FeaturesService,
		private readonly monacoCrlService: MonacoCrlService,
		private readonly userModulesService: UserModulesService
	) {
		this.idModule = Number(this.route.snapshot.paramMap.get("idModule"));

		this.subscriptions.push(
			this.$saveTrigger
				.pipe(debounceTime(500))
				.subscribe(skipRerender => this.savePendingCommands(skipRerender))
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

		// Undo any unsaved changes
		this.userModulesService.loadFromStorage();
	}

	public loadCurrentCommands (selectedLanguage?: LanguageCode): void {
		this.currentLanguage = selectedLanguage;

		if (!selectedLanguage) {
			this.currentCommands = [];
			return;
		}

		this.currentUserModuleCommands = this.userModuleCommands.find(umc => umc.language === selectedLanguage);

		const references = this.currentUserModuleCommands?.commands || [];
		this.currentCommands = references.map(reference => ({
			reference,
			command: reference.command,
			isToggleActive: reference.isActive || false,
			action: this.featuresService.getFeatureName(this.features, reference.featureIdentifier),
			extras: "<ul class='mb-0 ps-3'>" + this.featuresService.getFeatureParameters(this.features, reference.featureIdentifier, reference.parameters).join("") + "</ul>"
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

					// All changes are applied to objects referenced in this.currentUserModuleCommands.commands,
					// therefore row.reference is in this.currentUserModuleCommands.commands
					this.updatePendingChanges(this.currentUserModuleCommands!);
					this.$saveTrigger.next(false);

					this.monacoCrlService.setEditorContent(row.editorUri!, row.command);
				}

				this.bsModalRef = undefined;
			})
		);
	}

	public toggleCommand (row: IDataTableRow<UserModuleCommand>): void {
		row.isToggleActive = !row.isToggleActive;
		row.reference.isActive = row.isToggleActive;

		// All changes are applied to objects referenced in this.currentUserModuleCommands.commands,
		// therefore row.reference is in this.currentUserModuleCommands.commands
		this.updatePendingChanges(this.currentUserModuleCommands!);
		this.$saveTrigger.next(false);
	}

	public deleteCommand (row: IDataTableRow<UserModuleCommand>): void {
		const rowIndex = this.currentCommands.indexOf(row);
		const index = this.currentUserModuleCommands!.commands.indexOf(row.reference);
		if (rowIndex === -1 || index === -1)
			return;

		this.currentCommands.splice(rowIndex, 1);
		this.currentUserModuleCommands!.commands.splice(index, 1);
		this.commandsTable.$rerenderTrigger.next();

		this.updatePendingChanges(this.currentUserModuleCommands!);
		this.$saveTrigger.next(true);
	}

	public addCommand (): void {
		// TODO: Implement add command functionality
	}

	public importCommands (): void {
		const commandsToImport: Command[] = [];
		const initialState: ModalOptions<ImportCommandsModalComponent> = {
			initialState: {
				idModule: this.idModule,
				initialLanguage: this.currentLanguage,
				commandsToImport
			},
			class: "modal-xl"
		};

		this.bsModalRef = this.modalService.show(ImportCommandsModalComponent, initialState);

		this.subscriptions.push(
			this.bsModalRef.onHide!.subscribe(() => {
				if (commandsToImport.length > 0) {
					// Import new commands
					const newCommandsReferences: UserModuleCommand[] = commandsToImport.map(c => ({
						command: c.command,
						isActive: true,
						featureIdentifier: c.featureIdentifier,
						parameters: c.parameters
					}));

					const rows: IDataTableRow<UserModuleCommand>[] = newCommandsReferences.map(reference => ({
						reference,
						command: reference.command,
						isToggleActive: reference.isActive || false,
						action: this.featuresService.getFeatureName(this.features, reference.featureIdentifier),
						extras: "<ul class='mb-0 ps-3'>" + this.featuresService.getFeatureParameters(this.features, reference.featureIdentifier, reference.parameters).join("") + "</ul>"
					}));

					// Create a new UserModuleCommands object in case it doesn't exist yet
					if (!this.currentUserModuleCommands) {
						this.currentUserModuleCommands = {
							idUserModule: this.idModule,
							language: this.currentLanguage!,
							commands: [],
							prefix: "",
							isPrefixMandated: false
						};
					}

					this.currentUserModuleCommands.commands.push(...newCommandsReferences);
					this.currentCommands = this.currentCommands.concat(...rows);

					this.updatePendingChanges(this.currentUserModuleCommands!);
					this.$saveTrigger.next(true);
				}

				this.bsModalRef = undefined;
			})
		);
	}

	public savePendingCommands (skipRerender: boolean = false): void {
		for (const command of this.pendingChanges)
			this.saveCommands(command, skipRerender);
	}

	public saveCommands (userModuleCommands: IUserModuleCommands, skipRerender: boolean = false): void {
		this.userModulesService.updateCommands(userModuleCommands).subscribe({
			next: () => {
				this.errorSaving = false;
				this.updatePendingChanges(userModuleCommands, true);

				// When data changes, we need to re-render the data table in order to update sort and filter features.
				if (!skipRerender)
					this.commandsTable.$rerenderTrigger.next();
			},
			error: () => {
				this.errorSaving = true;
				this.updatePendingChanges(userModuleCommands);
			}
		});
	}

	private updatePendingChanges (command: IUserModuleCommands, removeOnly: boolean = false): void {
		const indexToRemove = this.pendingChanges.findIndex(c => c.idUserModule === command.idUserModule && c.language === command.language);
		if (indexToRemove >= 0)
			this.pendingChanges.splice(indexToRemove, 1);

		if (!removeOnly)
			this.pendingChanges.push(command);
	}
}

import { MatIcon } from "@angular/material/icon";
import { Component, OnDestroy, ViewChild } from "@angular/core";

import { CollapseModule } from "ngx-bootstrap/collapse";
import { BsModalRef, BsModalService, ModalOptions } from "ngx-bootstrap/modal";

import { Subscription } from "rxjs";

import { IUserModule } from "../../models/user-module";
import { IUserModuleCommands } from "../../models/user-module-commands";
import { LanguageCode } from "../../models/languages";

import { CommandEditorModalComponent } from "../../components/command-editor-modal/command-editor-modal.component";
import { CommandsTableComponent, ICommandsTableSettings, IDataTableRow } from "../../components/commands-table/commands-table.component";

import { MonacoCrlService } from "../../services/monaco-crl/monaco-crl.service";
import { TitleService } from "../../services/title/title.service";
import { UserModulesService } from "../../services/user-modules/user-modules.service";

@Component({
	selector: "app-installed-modules",
	standalone: true,
	imports: [
		CollapseModule,
		CommandsTableComponent,
		MatIcon,
		CommandEditorModalComponent
	],
	templateUrl: "./installed-modules.component.html",
	styleUrl: "./installed-modules.component.scss"
})
export class InstalledModulesComponent implements OnDestroy {
	@ViewChild(CommandsTableComponent)
	private commandsTable!: CommandsTableComponent;

	public errorSaving: boolean = false;
	public isCardCollapsed: boolean = false;
	public pendingChanges: IUserModuleCommands[] = [];
	public currentCommands: IDataTableRow<IUserModuleCommands>[] = [];

	public settings: ICommandsTableSettings = {
		canEdit: true,
		columns: {
			command: "Comando ou Prefixo",
			action: "Módulo Ativado",
			toggle: "Obrigatório"
		}
	};

	private bsModalRef?: BsModalRef;
	private subscriptions: Subscription[] = [];

	constructor (
		private readonly modalService: BsModalService,
		private readonly monacoCrlService: MonacoCrlService,
		private readonly titleService: TitleService,
		private readonly userModulesService: UserModulesService
	) {
		this.titleService.setTitle("Módulos Instalados");
	}

	public get userModules (): IUserModule[] {
		return this.userModulesService.userModules || [];
	}

	public ngOnDestroy (): void {
		this.subscriptions.forEach(subscription => subscription.unsubscribe());

		// Undo any unsaved changes
		this.userModulesService.loadFromStorage();
	}

	public loadCurrentCommands (selectedLanguage?: LanguageCode): void {
		if (!selectedLanguage) {
			this.currentCommands = [];
			return;
		}

		const references = this.userModules.map(um => {
			const command = um.userModuleCommands.find(umc => umc.language == selectedLanguage);
			const defaultCommand: IUserModuleCommands = {
				idUserModule: um.idUserModule,
				language: selectedLanguage!,
				commands: [],
				prefix: "",
				isPrefixMandated: false
			};

			return command || defaultCommand;
		});

		this.currentCommands = references.map(reference => ({
			reference,
			command: reference.prefix,
			isToggleActive: reference.isPrefixMandated,
			action: this.userModules.find(module => module.idUserModule === Number(reference.idUserModule))?.name || "Módulo Indefinido"
		}));
	}

	public editCommand (row: IDataTableRow<IUserModuleCommands>): void {
		const originalPrefix = row.command;
		const initialState: ModalOptions<CommandEditorModalComponent> = {
			initialState: { editingCommand: row },
			class: "modal-xl"
		};

		this.bsModalRef = this.modalService.show(CommandEditorModalComponent, initialState);

		this.subscriptions.push(
			this.bsModalRef.onHide!.subscribe(() => {
				if (originalPrefix !== row.command) {
					row.reference.prefix = row.command;
					this.updatePendingChanges(row.reference);
					this.savePendingCommands();
					this.monacoCrlService.setEditorContent(row.editorUri!, row.command);
				}

				this.bsModalRef = undefined;
			})
		);
	}

	public togglePrefixMandated (row: IDataTableRow<IUserModuleCommands>): void {
		row.isToggleActive = !row.isToggleActive;
		row.reference.isPrefixMandated = row.isToggleActive;
		this.updatePendingChanges(row.reference);
		this.savePendingCommands();
	}

	public savePendingCommands (): void {
		for (const command of this.pendingChanges)
			this.savePrefix(command);
	}

	private updatePendingChanges (command: IUserModuleCommands, removeOnly: boolean = false): void {
		const indexToRemove = this.pendingChanges.findIndex(c => c.idUserModule === command.idUserModule && c.language === command.language);
		if (indexToRemove >= 0)
			this.pendingChanges.splice(indexToRemove, 1);

		if (!removeOnly)
			this.pendingChanges.push(command);
	}

	private savePrefix (userModuleCommands: IUserModuleCommands): void {
		this.userModulesService.updatePrefix(userModuleCommands).subscribe({
			next: () => {
				this.errorSaving = false;
				this.updatePendingChanges(userModuleCommands, true);

				// When data changes, we need to re-render the data table in order to update sort and filter features.
				this.commandsTable.$rerenderTrigger.next();
			},
			error: () => {
				this.errorSaving = true;
				this.updatePendingChanges(userModuleCommands);
			}
		});
	}
}

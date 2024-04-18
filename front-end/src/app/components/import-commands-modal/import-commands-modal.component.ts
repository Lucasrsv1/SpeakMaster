import { NgIf } from "@angular/common";
import { Component, OnInit } from "@angular/core";

import { BsModalRef } from "ngx-bootstrap/modal";

import { Feature } from "speakmaster-module-builder/features-builder";

import { CommandsTableComponent, ICommandsTableSettings, IDataTableRow } from "../commands-table/commands-table.component";

import { IUserModule } from "../../models/user-module";
import { LanguageCode } from "../../models/languages";
import { IUserModuleCommands, UserModuleCommand } from "../../models/user-module-commands";

import { FeaturesService } from "../../services/features/features.service";
import { UserModulesService } from "../../services/user-modules/user-modules.service";

@Component({
	selector: "app-import-commands-modal",
	standalone: true,
	imports: [CommandsTableComponent, NgIf],
	templateUrl: "./import-commands-modal.component.html",
	styleUrl: "./import-commands-modal.component.scss"
})
export class ImportCommandsModalComponent implements OnInit {
	// Inputs
	public idModule!: number;
	public initialLanguage?: LanguageCode;

	// Output
	public commandsToImport: UserModuleCommand[] = [];

	protected settings?: ICommandsTableSettings;
	protected selectedCommands: UserModuleCommand[] = [];
	protected currentCommands: IDataTableRow<UserModuleCommand>[] = [];

	constructor (
		protected readonly bsModalRef: BsModalRef,
		private readonly featuresService: FeaturesService,
		private readonly userModulesService: UserModulesService
	) { }

	public ngOnInit (): void {
		this.settings = {
			initialLanguage: this.initialLanguage,
			selectionMode: true,
			columns: {
				command: "Comando",
				action: "Ação (Funcionalidade)",
				extras: "Parâmetros",
				toggle: "Selecionar"
			}
		};
	}

	protected get userModule (): IUserModule | undefined {
		return this.userModulesService.userModules?.find(m => m.idModule === this.idModule);
	}

	private get features (): Feature[] {
		return this.userModule?.featuresDefinition || [];
	}

	private get userModuleCommands (): IUserModuleCommands[] {
		return this.userModule?.userModuleCommands || [];
	}

	protected loadCurrentCommands (selectedLanguage?: LanguageCode): void {
		if (!selectedLanguage) {
			this.currentCommands = [];
			return;
		}

		// TODO: usar comandos padrões do módulo como opções de importação
		const references = this.userModuleCommands.find(umc => umc.language === selectedLanguage)?.commands || [];
		this.currentCommands = references.map(reference => ({
			reference,
			command: reference.command,
			isToggleActive: this.selectedCommands.includes(reference),
			uriKey: "featureIdentifier",
			action: this.featuresService.getFeatureName(this.features, reference.featureIdentifier),
			extras: "<ul class='mb-0 ps-3'>" + this.featuresService.getFeatureParameters(this.features, reference.featureIdentifier, reference.parameters).join("") + "</ul>"
		}));
	}

	protected toggleSelection (row: IDataTableRow<UserModuleCommand>): void {
		row.isToggleActive = !row.isToggleActive;

		// Remove from selection
		const index = this.selectedCommands.findIndex(c => c === row.reference);
		if (index !== -1)
			this.selectedCommands.splice(index, 1);

		// Add to selection if selected
		if (row.isToggleActive)
			this.selectedCommands.push(row.reference);
	}

	protected import (): void {
		// Send selected commands to the modal caller
		this.commandsToImport.push(...this.selectedCommands);
		this.bsModalRef.hide();
	}
}

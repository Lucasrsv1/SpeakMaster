import { HttpErrorResponse } from "@angular/common/http";
import { MatIcon } from "@angular/material/icon";
import { NgIf } from "@angular/common";
import { Component, OnInit } from "@angular/core";

import { BsModalRef } from "ngx-bootstrap/modal";
import { BlockUI, NgBlockUI } from "ng-block-ui";

import { Command } from "speakmaster-module-builder/default-commands-builder";
import { Feature } from "speakmaster-module-builder/features-builder";

import { CommandsTableComponent, ICommandsTableSettings, IDataTableRow } from "../commands-table/commands-table.component";

import { IModuleDefaultCommands } from "../../models/module-default-commands";
import { IUserModule } from "../../models/user-module";
import { ILanguage, LanguageCode, languages } from "../../models/languages";

import { AlertsService } from "../../services/alerts/alerts.service";
import { FeaturesService } from "../../services/features/features.service";
import { ModuleDefaultCommandsService } from "../../services/module-default-commands/module-default-commands.service";
import { UserModulesService } from "../../services/user-modules/user-modules.service";

@Component({
	selector: "app-import-commands-modal",
	standalone: true,
	imports: [CommandsTableComponent, MatIcon, NgIf],
	templateUrl: "./import-commands-modal.component.html",
	styleUrl: "./import-commands-modal.component.scss"
})
export class ImportCommandsModalComponent implements OnInit {
	@BlockUI()
	private blockUI!: NgBlockUI;

	// Inputs
	public idModule!: number;
	public initialLanguage?: LanguageCode;

	// Output
	public commandsToImport: Command[] = [];

	protected languageOptions?: ILanguage[];
	protected settings?: ICommandsTableSettings;
	protected selectedCommands: Command[] = [];
	protected currentCommands: IDataTableRow<Command>[] = [];

	private currentLanguage?: LanguageCode;
	private defaultCommands: IModuleDefaultCommands[] = [];

	constructor (
		protected readonly bsModalRef: BsModalRef,
		private readonly alertsService: AlertsService,
		private readonly featuresService: FeaturesService,
		private readonly moduleDefaultCommandsService: ModuleDefaultCommandsService,
		private readonly userModulesService: UserModulesService
	) { }

	public get initialLanguageName (): string {
		return languages.find(l => l.code === this.initialLanguage)?.name || "-";
	}

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

		this.blockUI.start("Carregando comandos padrões do módulo...");
		this.moduleDefaultCommandsService.getModuleDefaultCommands(this.idModule).subscribe({
			next: defaultCommands => {
				this.blockUI.stop();

				this.defaultCommands = defaultCommands;
				this.languageOptions = languages.filter(
					language => defaultCommands.some(dc => dc.language === language.code)
				);

				this.loadCurrentCommands(this.currentLanguage);
			},

			error: (error: HttpErrorResponse) => {
				this.blockUI?.stop();
				this.alertsService.httpErrorAlert(
					"Falha ao Carregar Comandos do Módulo",
					"Não foi possível obter os comandos padrões do módulo, tente novamente.",
					error
				);
			}
		});
	}

	protected get userModule (): IUserModule | undefined {
		return this.userModulesService.userModules?.find(m => m.idModule === this.idModule);
	}

	private get features (): Feature[] {
		return this.userModule?.featuresDefinition || [];
	}

	protected loadCurrentCommands (selectedLanguage?: LanguageCode): void {
		this.currentLanguage = selectedLanguage;

		if (!selectedLanguage) {
			this.currentCommands = [];
			return;
		}

		const references = this.defaultCommands.find(dc => dc.language === selectedLanguage)?.commands || [];
		this.currentCommands = references.map(reference => ({
			reference,
			command: reference.command,
			isToggleActive: this.selectedCommands.includes(reference),
			action: this.featuresService.getFeatureName(this.features, reference.featureIdentifier),
			extras: "<ul class='mb-0 ps-3'>" + this.featuresService.getFeatureParameters(this.features, reference.featureIdentifier, reference.parameters).join("") + "</ul>"
		}));
	}

	protected toggleSelection (row: IDataTableRow<Command>): void {
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

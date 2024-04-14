import { FormsModule } from "@angular/forms";
import { MatIcon } from "@angular/material/icon";
import { AfterViewInit, Component, HostListener, OnDestroy, TemplateRef, ViewChild } from "@angular/core";
import { AsyncPipe, NgIf } from "@angular/common";

import { ADTSettings } from "angular-datatables/src/models/settings";
import { CollapseModule } from "ngx-bootstrap/collapse";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { BsModalRef, BsModalService, ModalOptions } from "ngx-bootstrap/modal";
import { CodeEditorComponent, CodeEditorModule, CodeModel } from "@ngstack/code-editor";
import { DataTableDirective, DataTablesModule } from "angular-datatables";
import { NgSelectConfig, NgSelectModule } from "@ng-select/ng-select";

import deepEqual from "deep-equal";
import { editor } from "monaco-editor";

import { debounceTime, Subject, Subscription } from "rxjs";

import { IUser } from "../../models/user";
import { IUserModule } from "../../models/user-module";
import { IUserModuleCommands } from "../../models/user-module-commands";
import { ILanguage, LanguageCode, languages } from "../../models/languages";

import { CheckboxComponent } from "../../components/checkbox/checkbox.component";
import { CommandEditorModalComponent } from "../../components/command-editor-modal/command-editor-modal.component";

import { AuthenticationService } from "../../services/authentication/authentication.service";
import { DtTranslationService } from "../../services/dt-translation/dt-translation.service";
import { LanguageCommandsService } from "../../services/language-commands/language-commands.service";
import { MonacoCrlService } from "../../services/monaco-crl/monaco-crl.service";
import { TitleService } from "../../services/title/title.service";
import { UserModulesService } from "../../services/user-modules/user-modules.service";

/**
 * Represents a row in the data table, with formatted key values for presentation in the table columns,
 * and a reference to the corresponding user module commands data object.
 */
interface IDataTableRow {
	// Presentation values (columns)
	prefix: string;
	action: string;
	isPrefixMandated: boolean;

	/**
	 * Real data values to save in the database and local storage
	 */
	reference: IUserModuleCommands;
}

@Component({
	selector: "app-installed-modules",
	standalone: true,
	imports: [
		AsyncPipe,
		CheckboxComponent,
		CodeEditorModule,
		CollapseModule,
		DataTablesModule,
		FormsModule,
		MatIcon,
		NgIf,
		NgSelectModule,
		CommandEditorModalComponent
	],
	templateUrl: "./installed-modules.component.html",
	styleUrl: "./installed-modules.component.scss"
})
export class InstalledModulesComponent implements AfterViewInit, OnDestroy {
	@BlockUI()
	private blockUI!: NgBlockUI;

	@ViewChild("commandEditor")
	private commandEditor!: TemplateRef<any>;

	@ViewChild("toggleBtn")
	private toggleBtn!: TemplateRef<any>;

	@ViewChild("editBtn")
	private editBtn!: TemplateRef<any>;

	@ViewChild(DataTableDirective)
	private dtElement?: DataTableDirective;

	@HostListener("window:resize")
	public onResize () {
		this.$rerenderTrigger.next();
	}

	public dtTrigger: Subject<ADTSettings> = new Subject();
	public dtOptions: ADTSettings = {
		lengthMenu: [10, 25, 50, 100],
		stateSave: true,
		language: this.dtTranslationService.getDataTablesPortugueseTranslation(),
		columns: [
			{
				title: "Comando ou Prefixo",
				data: "prefix",
				className: "p-2 w-auto"
			},
			{
				title: "Módulo Ativado",
				data: "action",
				className: "p-2 w-auto"
			},
			{
				title: "Obrigatório",
				data: "isPrefixMandated",
				className: "text-center p-1",
				width: "136px",
				searchable: false
			},
			{
				title: "",
				data: null,
				defaultContent: "",
				className: "text-center p-1",
				width: "88px",
				orderable: false,
				searchable: false
			}
		],
		data: [] as IDataTableRow[],
		order: [[1, "asc"]],
		preDrawCallback: () => {
			this.editorComponents.forEach(e => e.ngOnDestroy());
			this.editorComponents = [];
		}
	};

	public isCardCollapsed: boolean = false;
	public languages: ILanguage[] = languages;
	public pendingChanges: IUserModuleCommands[] = [];

	public selectedLanguage?: LanguageCode;
	public spokenLanguages: ILanguage[] = [];

	public codeModels: Map<number, CodeModel> = new Map();
	public options: editor.IEditorConstructionOptions = {
		automaticLayout: true,
		lineNumbers: "off",
		renderLineHighlight: "none",
		wordWrap: "on",
		scrollBeyondLastLine: false,
		scrollBeyondLastColumn: 0
	};

	private bsModalRef?: BsModalRef;
	private editorComponents: CodeEditorComponent[] = [];

	private subscriptions: Subscription[] = [];
	private $rerenderTrigger: Subject<void> = new Subject();

	constructor (
		private readonly modalService: BsModalService,
		private readonly ngSelectConfig: NgSelectConfig,
		private readonly authenticationService: AuthenticationService,
		private readonly dtTranslationService: DtTranslationService,
		private readonly languageCommandsService: LanguageCommandsService,
		private readonly monacoCrlService: MonacoCrlService,
		private readonly titleService: TitleService,
		private readonly userModulesService: UserModulesService
	) {
		this.titleService.setTitle("Módulos Instalados");
		this.ngSelectConfig.notFoundText = "Nenhum item encontrado";
		this.monacoCrlService.registerCRL();

		const user = this.authenticationService.loggedUser as IUser;
		this.selectedLanguage = user.interfaceLanguage;

		this.subscriptions.push(
			this.languageCommandsService.$languageCommands.subscribe(languageCommands => {
				const spokenLanguagesCodes = languageCommands?.languagesToListen || [];
				this.spokenLanguages = languages.filter(language => spokenLanguagesCodes.includes(language.code));

				if (this.spokenLanguages.length && !this.spokenLanguages.find(l => l.code === this.selectedLanguage))
					this.selectedLanguage = this.spokenLanguages[0].code;
			})
		);

		this.subscriptions.push(
			this.$rerenderTrigger
				.pipe(debounceTime(500))
				.subscribe(() => this.rerenderDataTables())
		);

		this.loadCommands();
	}

	public get userModules (): IUserModule[] {
		return this.userModulesService.userModules || [];
	}

	public get currentCommands (): IDataTableRow[] {
		if (!this.selectedLanguage || !this.userModules)
			return [];

		const references = this.userModules.map(um => {
			const command = um.userModuleCommands.find(umc => umc.language == this.selectedLanguage);
			const defaultCommand: IUserModuleCommands = {
				idUserModule: um.idUserModule,
				language: this.selectedLanguage!,
				commands: [],
				prefix: "",
				isPrefixMandated: false
			};

			return command || defaultCommand;
		});

		return references.map(reference => ({
			reference,
			prefix: reference.prefix,
			isPrefixMandated: reference.isPrefixMandated,
			action: this.userModules.find(module => module.idUserModule === Number(reference.idUserModule))?.name || "Módulo Indefinido"
		}));
	}

	public ngAfterViewInit (): void {
		this.dtOptions.columns![0].ngTemplateRef = { ref: this.commandEditor };
		this.dtOptions.columns![2].ngTemplateRef = { ref: this.toggleBtn };
		this.dtOptions.columns![3].ngTemplateRef = { ref: this.editBtn };
		this.dtTrigger.next(this.dtOptions);
	}

	public ngOnDestroy (): void {
		this.dtTrigger.unsubscribe();
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
		this.editorComponents.forEach(e => e.ngOnDestroy());
		this.editorComponents = [];
	}

	public loadCommands (): void {
		if (deepEqual(this.dtOptions.data, this.currentCommands))
			return;

		for (const l of this.currentCommands) {
			this.codeModels.set(l.reference.idUserModule, {
				language: "crl",
				uri: l.reference.idUserModule + "-command.crl",
				value: l.prefix
			});
		}

		this.dtOptions.data = this.currentCommands;
		this.rerenderDataTables();
	}

	public editCommand (row: IDataTableRow): void {
		const originalPrefix = row.prefix;
		const initialState: ModalOptions = {
			initialState: { command: row, commandKey: "prefix" },
			class: "modal-lg"
		};

		this.bsModalRef = this.modalService.show(CommandEditorModalComponent, initialState);

		this.subscriptions.push(
			this.bsModalRef.onHide!.subscribe(() => {
				if (originalPrefix !== row.prefix) {
					row.reference.prefix = row.prefix;
					this.updatePendingChanges(row.reference);
					this.savePendingCommands();

					const codeModel = this.codeModels.get(row.reference.idUserModule);
					if (codeModel)
						this.monacoCrlService.setEditorContent(codeModel.uri, row.prefix);
				}

				this.bsModalRef = undefined;
			})
		);
	}

	public togglePrefixMandated (row: IDataTableRow): void {
		row.isPrefixMandated = !row.isPrefixMandated;
		row.reference.isPrefixMandated = row.isPrefixMandated;
		this.updatePendingChanges(row.reference);
		this.savePendingCommands();
	}

	public editorLoaded (editorComponent: CodeEditorComponent): void {
		this.editorComponents.push(editorComponent);
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

	private savePrefix (command: IUserModuleCommands): void {
		this.userModulesService.updatePrefix(command, this.blockUI).subscribe({
			next: () => {
				this.updatePendingChanges(command, true);

				// When data changes, we need to re-render the data table in order to update sort and filter features.
				this.$rerenderTrigger.next();
			},
			error: () => {
				this.updatePendingChanges(command);
			}
		});
	}

	private async rerenderDataTables (): Promise<void> {
		const dtInstance: DataTables.Api | undefined = await this.dtElement?.dtInstance;

		// Destroy the table first
		dtInstance?.destroy();

		// Call the dtTrigger to rerender again
		this.dtTrigger.next(this.dtOptions);

		// Validate commands after rerendering
		setTimeout(() => this.monacoCrlService.validateAllEditors(), 100);
	}
}

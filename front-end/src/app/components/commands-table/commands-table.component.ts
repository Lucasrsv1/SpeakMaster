import { FormsModule } from "@angular/forms";
import { MatIcon } from "@angular/material/icon";
import { AfterViewInit, Component, effect, EventEmitter, HostListener, input, Input, OnDestroy, OnInit, Output, signal, TemplateRef, ViewChild } from "@angular/core";
import { AsyncPipe, NgIf } from "@angular/common";

import { ADTColumns, ADTSettings } from "angular-datatables/src/models/settings";
import { DataTableDirective, DataTablesModule } from "angular-datatables";
import { NgSelectConfig, NgSelectModule } from "@ng-select/ng-select";

import { editor } from "monaco-editor";
import { CodeEditorComponent, CodeEditorModule, CodeModel } from "@ngstack/code-editor";

import { debounceTime, Subject, Subscription } from "rxjs";

import deepEqual from "deep-equal";

import { CheckboxComponent } from "../../components/checkbox/checkbox.component";

import { IUser } from "../../models/user";
import { ILanguage, LanguageCode, languages } from "../../models/languages";

import { AuthenticationService } from "../../services/authentication/authentication.service";
import { DtTranslationService } from "../../services/dt-translation/dt-translation.service";
import { LanguageCommandsService } from "../../services/language-commands/language-commands.service";
import { MonacoCrlService } from "../../services/monaco-crl/monaco-crl.service";

/**
 * Represents a row in the data table, with formatted key values for presentation in the table columns,
 * and a reference to the corresponding language command data object.
 */
export interface IDataTableRow<ReferenceType> {
	// Presentation values (columns)
	command: string;
	action: string;
	extras?: string;
	isToggleActive: boolean;

	/**
	 * Monaco Editor file URI for the command.
	 */
	editorUri?: string;

	/**
	 * Real data values to save in the database and local storage
	 */
	reference: ReferenceType;
}

export interface IDataTableColumnNames {
	command: string;
	action: string;
	toggle: string;
	extras?: string;
}

export interface ICommandsTableSettings {
	canAdd?: boolean;
	canImport?: boolean;
	canDelete?: boolean;
	canEdit?: boolean;
	columns?: IDataTableColumnNames;
	initialLanguage?: LanguageCode;
	selectionMode?: boolean;
}

@Component({
	selector: "app-commands-table",
	standalone: true,
	imports: [
		AsyncPipe,
		CheckboxComponent,
		CodeEditorModule,
		DataTablesModule,
		FormsModule,
		MatIcon,
		NgIf,
		NgSelectModule
	],
	templateUrl: "./commands-table.component.html",
	styleUrl: "./commands-table.component.scss"
})
export class CommandsTableComponent implements OnInit, AfterViewInit, OnDestroy {
	public currentCommands = input<IDataTableRow<any>[]>([]);
	public languageOptions = input<ILanguage[] | undefined>(undefined);

	@Input()
	public hasPendingChanges: boolean = false;

	@Input()
	public settings: ICommandsTableSettings = {
			canAdd: false,
			canImport: false,
			canDelete: false,
			canEdit: false,
			selectionMode: false,
			columns: { command: "Comando", action: "Ação", toggle: "Ativo" }
		};

	@Output()
	public toggle = new EventEmitter<IDataTableRow<any>>();

	@Output()
	public edit = new EventEmitter<IDataTableRow<any>>();

	@Output()
	public delete = new EventEmitter<IDataTableRow<any>>();

	@Output()
	public add = new EventEmitter<void>();

	@Output()
	public import = new EventEmitter<void>();

	@Output()
	public savePendingChanges = new EventEmitter<void>();

	@Output()
	public selectedLanguage = new EventEmitter<LanguageCode | undefined>();

	@ViewChild("commandEditor")
	private commandEditor!: TemplateRef<any>;

	@ViewChild("toggleBtn")
	private toggleBtn!: TemplateRef<any>;

	@ViewChild("buttons")
	private buttons!: TemplateRef<any>;

	@ViewChild(DataTableDirective)
	private dtElement?: DataTableDirective;

	@HostListener("window:resize")
	public onResize () {
		this.$rerenderTrigger.next();
	}

	public isCardCollapsed: boolean = false;
	public $rerenderTrigger: Subject<void> = new Subject();

	protected dtTrigger: Subject<ADTSettings> = new Subject();
	protected dtOptions!: ADTSettings;

	protected selectedLanguageSignal = signal<LanguageCode | undefined>(undefined);
	protected availableLanguageOptions: ILanguage[] = [];

	protected codeModels: Map<string, CodeModel> = new Map();
	protected options: editor.IEditorConstructionOptions = {
		automaticLayout: true,
		lineNumbers: "off",
		renderLineHighlight: "none",
		wordWrap: "on",
		scrollBeyondLastLine: false,
		scrollBeyondLastColumn: 0
	};

	private editorComponents: CodeEditorComponent[] = [];
	private subscriptions: Subscription[] = [];

	private columnIndexes = {
		command: 0,
		toggle: -1,
		buttons: -1
	};

	private tableID: number;
	private static nextID: number = 1;

	constructor (
		private readonly ngSelectConfig: NgSelectConfig,
		private readonly authenticationService: AuthenticationService,
		private readonly dtTranslationService: DtTranslationService,
		private readonly languageCommandsService: LanguageCommandsService,
		private readonly monacoCrlService: MonacoCrlService
	) {
		this.tableID = CommandsTableComponent.nextID++;
		this.ngSelectConfig.notFoundText = "Nenhum item encontrado";
		this.monacoCrlService.registerCRL();

		effect(
			() => this.selectedLanguage.emit(this.selectedLanguageSignal())
		);

		effect(() => {
			if (!deepEqual(this.dtOptions?.data, this.currentCommands()))
				this.loadCommands();
		});

		effect(() => {
			// Update available language options based on input
			const languageOptions = this.languageOptions();
			if (languageOptions) {
				this.availableLanguageOptions = languageOptions;

				if (this.availableLanguageOptions.length && !this.availableLanguageOptions.find(l => l.code === this.selectedLanguageSignal()))
					this.selectedLanguageSignal.set(this.availableLanguageOptions[0].code);
			}
		});

		const user = this.authenticationService.loggedUser as IUser;
		this.selectedLanguageSignal.set(user.interfaceLanguage);

		this.subscriptions.push(
			this.languageCommandsService.$languageCommands.subscribe(languageCommands => {
				if (!this.languageOptions()) {
					// Load spoken languages and use as language options, if no input was provided
					const spokenLanguagesCodes = languageCommands?.languagesToListen || [];
					this.availableLanguageOptions = languages.filter(language => spokenLanguagesCodes.includes(language.code));
				}

				if (this.availableLanguageOptions.length && !this.availableLanguageOptions.find(l => l.code === this.selectedLanguageSignal()))
					this.selectedLanguageSignal.set(this.availableLanguageOptions[0].code);
			})
		);

		this.subscriptions.push(
			this.$rerenderTrigger
				.pipe(debounceTime(500))
				.subscribe(() => this.rerenderDataTables())
		);
	}

	public ngOnInit (): void {
		if (!this.settings.columns) {
			this.settings.columns = {
				command: "Comando",
				action: "Ação",
				toggle: this.settings.selectionMode ? "Selecionar" : "Ativo"
			};
		}

		const columns: ADTColumns[] = [{
			title: this.settings.columns.command,
			data: "command",
			className: "p-2 pe-4 w-auto"
		}, {
			title: this.settings.columns.action,
			data: "action",
			className: "p-2 pe-4 w-auto"
		}];

		if (this.settings.columns.extras) {
			columns.push({
				title: this.settings.columns.extras,
				data: "extras",
				className: "p-2 pe-4 w-auto"
			});
		}

		if (this.settings.selectionMode) {
			columns.unshift({
				title: this.settings.columns.toggle,
				data: "isToggleActive",
				className: "text-center p-1",
				width: `${Math.round((this.settings.columns.toggle.length * 6.6) + 50)}px`,
				searchable: false
			});

			this.columnIndexes.toggle = 0;
			this.columnIndexes.command = 1;
		} else {
			columns.push({
				title: this.settings.columns.toggle,
				data: "isToggleActive",
				className: "text-center p-1",
				width: `${Math.round((this.settings.columns.toggle.length * 6.6) + 50)}px`,
				searchable: false
			});

			this.columnIndexes.toggle = columns.length - 1;
		}

		if (this.settings.canEdit || this.settings.canDelete) {
			columns.push({
				title: "",
				data: null,
				defaultContent: "",
				className: "text-center p-1",
				width: this.settings.canDelete ? "110px" : "88px",
				orderable: false,
				searchable: false
			});

			this.columnIndexes.buttons = columns.length - 1;
		}

		this.dtOptions = {
			lengthMenu: [10, 25, 50, 100],
			stateSave: true,
			language: this.dtTranslationService.getDataTablesPortugueseTranslation(),
			columns,
			data: [] as IDataTableRow<any>[],
			order: [[this.columnIndexes.command + 1, "asc"]],
			preDrawCallback: () => {
				this.editorComponents.forEach(e => e.ngOnDestroy());
				this.editorComponents = [];
			}
		};

		if (this.settings.initialLanguage)
			this.selectedLanguageSignal.set(this.settings.initialLanguage);
	}

	public ngAfterViewInit (): void {
		this.dtOptions.columns![this.columnIndexes.command].ngTemplateRef = { ref: this.commandEditor };

		if (this.columnIndexes.toggle !== -1)
			this.dtOptions.columns![this.columnIndexes.toggle].ngTemplateRef = { ref: this.toggleBtn };

		if (this.columnIndexes.buttons !== -1)
			this.dtOptions.columns![this.columnIndexes.buttons].ngTemplateRef = { ref: this.buttons };

		this.dtTrigger.next(this.dtOptions);
	}

	public ngOnDestroy (): void {
		this.dtTrigger.unsubscribe();
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
		this.editorComponents.forEach(e => e.ngOnDestroy());
		this.editorComponents = [];
	}

	protected deselectAll (): void {
		for (const cmd of this.currentCommands()) {
			if (cmd.isToggleActive)
				this.toggle.emit(cmd);
		}
	}

	protected selectAll (): void {
		for (const cmd of this.currentCommands()) {
			if (!cmd.isToggleActive)
				this.toggle.emit(cmd);
		}
	}

	protected editorLoaded (editorComponent: CodeEditorComponent): void {
		this.editorComponents.push(editorComponent);
	}

	private loadCommands (): void {
		const currentCommands = this.currentCommands();
		for (let i = 0; i < currentCommands.length; i++) {
			currentCommands[i].editorUri = this.getEditorURI(i);

			this.codeModels.set(currentCommands[i].editorUri!, {
				language: "crl",
				uri: currentCommands[i].editorUri!,
				value: currentCommands[i].command
			});
		}

		this.dtOptions.data = this.currentCommands();
		this.rerenderDataTables();
	}

	private getEditorURI (index: number): string {
		return `${index}-${this.tableID}-command.crl`;
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

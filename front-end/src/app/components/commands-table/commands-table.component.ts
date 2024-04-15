import { FormsModule } from "@angular/forms";
import { MatIcon } from "@angular/material/icon";
import { AfterViewInit, Component, effect, EventEmitter, HostListener, input, Input, OnDestroy, OnInit, Output, signal, TemplateRef, ViewChild } from "@angular/core";
import { AsyncPipe, NgIf } from "@angular/common";

import { ADTSettings } from "angular-datatables/src/models/settings";
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
	 * Determines the key in the reference object that identifies the command.
	 */
	uriKey: keyof ReferenceType;

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

	@Input()
	public hasPendingChanges: boolean = false;

	@Input()
	public canDelete: boolean = false;

	@Input()
	public columns: IDataTableColumnNames = { command: "Comando", action: "Ação", toggle: "Ativo" };

	@Output()
	public toggle = new EventEmitter<IDataTableRow<any>>();

	@Output()
	public editCommand = new EventEmitter<IDataTableRow<any>>();

	@Output()
	public deleteCommand = new EventEmitter<IDataTableRow<any>>();

	@Output()
	public savePendingChanges = new EventEmitter<void>();

	@Output()
	public selectedLanguage = new EventEmitter<LanguageCode | undefined>();

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

	public isCardCollapsed: boolean = false;
	public $rerenderTrigger: Subject<void> = new Subject();

	protected dtTrigger: Subject<ADTSettings> = new Subject();
	protected dtOptions!: ADTSettings;

	protected selectedLanguageSignal = signal<LanguageCode | undefined>(undefined);
	protected spokenLanguages: ILanguage[] = [];

	protected codeModels: Map<number, CodeModel> = new Map();
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

	constructor (
		private readonly ngSelectConfig: NgSelectConfig,
		private readonly authenticationService: AuthenticationService,
		private readonly dtTranslationService: DtTranslationService,
		private readonly languageCommandsService: LanguageCommandsService,
		private readonly monacoCrlService: MonacoCrlService
	) {
		this.ngSelectConfig.notFoundText = "Nenhum item encontrado";
		this.monacoCrlService.registerCRL();

		effect(
			() => this.selectedLanguage.emit(this.selectedLanguageSignal())
		);

		effect(() => {
			if (!deepEqual(this.dtOptions?.data, this.currentCommands()))
				this.loadCommands();
		});

		const user = this.authenticationService.loggedUser as IUser;
		this.selectedLanguageSignal.set(user.interfaceLanguage);

		this.subscriptions.push(
			this.languageCommandsService.$languageCommands.subscribe(languageCommands => {
				const spokenLanguagesCodes = languageCommands?.languagesToListen || [];
				this.spokenLanguages = languages.filter(language => spokenLanguagesCodes.includes(language.code));

				if (this.spokenLanguages.length && !this.spokenLanguages.find(l => l.code === this.selectedLanguageSignal()))
					this.selectedLanguageSignal.set(this.spokenLanguages[0].code);
			})
		);

		this.subscriptions.push(
			this.$rerenderTrigger
				.pipe(debounceTime(500))
				.subscribe(() => this.rerenderDataTables())
		);
	}

	public ngOnInit (): void {
		this.dtOptions = {
			lengthMenu: [10, 25, 50, 100],
			stateSave: true,
			language: this.dtTranslationService.getDataTablesPortugueseTranslation(),
			columns: [
				{
					title: this.columns.command,
					data: "command",
					className: "p-2 pe-4 w-auto"
				},
				{
					title: this.columns.action,
					data: "action",
					className: "p-2 pe-4 w-auto"
				},
				...(
					!this.columns.extras ? [] : [{
						title: this.columns.extras,
						data: "extras",
						className: "p-2 pe-4 w-auto"
					}]
				),
				{
					title: this.columns.toggle,
					data: "isToggleActive",
					className: "text-center p-1",
					width: `${Math.round((this.columns.toggle.length * 6.6) + 63)}px`,
					searchable: false
				},
				{
					title: "",
					data: null,
					defaultContent: "",
					className: "text-center p-1",
					width: this.canDelete ? "110px" : "88px",
					orderable: false,
					searchable: false
				}
			],
			data: [] as IDataTableRow<any>[],
			order: [[1, "asc"]],
			preDrawCallback: () => {
				this.editorComponents.forEach(e => e.ngOnDestroy());
				this.editorComponents = [];
			}
		};
	}

	public ngAfterViewInit (): void {
		this.dtOptions.columns![0].ngTemplateRef = { ref: this.commandEditor };
		this.dtOptions.columns!.slice(-2)[0].ngTemplateRef = { ref: this.toggleBtn };
		this.dtOptions.columns!.slice(-1)[0].ngTemplateRef = { ref: this.editBtn };
		this.dtTrigger.next(this.dtOptions);
	}

	public ngOnDestroy (): void {
		this.dtTrigger.unsubscribe();
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
		this.editorComponents.forEach(e => e.ngOnDestroy());
		this.editorComponents = [];
	}

	private loadCommands (): void {
		for (const l of this.currentCommands()) {
			this.codeModels.set(l.reference[l.uriKey], {
				language: "crl",
				uri: l.reference[l.uriKey] + "-command.crl",
				value: l.command
			});
		}

		this.dtOptions.data = this.currentCommands();
		this.rerenderDataTables();
	}

	protected editorLoaded (editorComponent: CodeEditorComponent): void {
		this.editorComponents.push(editorComponent);
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

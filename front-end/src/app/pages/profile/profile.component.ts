import { MatIcon } from "@angular/material/icon";
import { AfterViewInit, Component, HostListener, OnDestroy, TemplateRef, ViewChild } from "@angular/core";
import { AsyncPipe, NgIf } from "@angular/common";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";

import { ADTSettings } from "angular-datatables/src/models/settings";
import { CollapseModule } from "ngx-bootstrap/collapse";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { BsModalRef, BsModalService, ModalOptions } from "ngx-bootstrap/modal";
import { DataTableDirective, DataTablesModule } from "angular-datatables";
import { NgSelectConfig, NgSelectModule } from "@ng-select/ng-select";

import { editor } from "monaco-editor";
import { CodeEditorComponent, CodeEditorModule, CodeModel } from "@ngstack/code-editor";

import { debounceTime, Subject, Subscription } from "rxjs";

import deepEqual from "deep-equal";

import { CheckboxComponent } from "../../components/checkbox/checkbox.component";
import { CommandEditorModalComponent } from "../../components/command-editor-modal/command-editor-modal.component";
import { IValidations, VisualValidatorComponent } from "../../components/visual-validator/visual-validator.component";

import { IUser } from "../../models/user";
import { generateLanguageCommandsForUser, ILanguageCommand, ILanguageCommands } from "../../models/languageCommand";
import { getLanguageNameByCode, ILanguage, LanguageCode, languages } from "../../models/languages";

import { AlertsService } from "../../services/alerts/alerts.service";
import { DtTranslationService } from "../../services/dt-translation/dt-translation.service";
import { LanguageCommandsService } from "../../services/language-commands/language-commands.service";
import { MonacoCrlService } from "../../services/monaco-crl/monaco-crl.service";
import { TitleService } from "../../services/title/title.service";
import { AuthenticationService, IUserUpdate } from "../../services/authentication/authentication.service";

/**
 * Represents a row in the data table, with formatted key values for presentation in the table columns,
 * and a reference to the corresponding language command data object.
 */
interface IDataTableRow {
	// Presentation values (columns)
	command: string;
	action: string;
	isActive: boolean;

	/**
	 * Real data values to save in the database and local storage
	 */
	reference: ILanguageCommand;
}

@Component({
	selector: "app-profile",
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
		ReactiveFormsModule,
		CommandEditorModalComponent,
		VisualValidatorComponent
	],
	templateUrl: "./profile.component.html",
	styleUrls: [
		"./profile.component.scss",
		"../../shared/eye-btn.scss"
	]
})
export class ProfileComponent implements AfterViewInit, OnDestroy {
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
				title: "Comandos",
				data: "command",
				className: "p-2 w-auto"
			},
			{
				title: "Ação",
				data: "action",
				className: "p-2 w-auto"
			},
			{
				title: "Ativo",
				data: "isActive",
				className: "text-center p-1",
				width: "96px",
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

	public form: FormGroup;
	public validations: IValidations;
	public showPassword: boolean = false;
	public isCardCollapsed: boolean = false;

	public languages: ILanguage[] = languages;

	public selectedLanguage?: LanguageCode;
	public languageCommands: ILanguageCommands | null = null;
	public spokenLanguages: ILanguage[] = [];

	public codeModels: Map<string, CodeModel> = new Map();
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
	private $saveTrigger: Subject<void> = new Subject();

	constructor (
		public readonly languageCommandsService: LanguageCommandsService,
		private readonly modalService: BsModalService,
		private readonly formBuilder: FormBuilder,
		private readonly ngSelectConfig: NgSelectConfig,
		private readonly alertsService: AlertsService,
		private readonly authenticationService: AuthenticationService,
		private readonly dtTranslationService: DtTranslationService,
		private readonly monacoCrlService: MonacoCrlService,
		private readonly titleService: TitleService
	) {
		this.titleService.setTitle("Preferências de Usuário");
		this.ngSelectConfig.notFoundText = "Nenhum item encontrado";
		this.monacoCrlService.registerCRL();

		this.form = this.formBuilder.group({
			name: [null, [Validators.required, Validators.maxLength(200)]],
			email: [null, [Validators.required, Validators.email]],
			password: [null, Validators.minLength(8)],
			micOnByDefault: [false],
			interfaceLanguage: [null, Validators.required],
			languagesToListen: [[], Validators.required]
		});

		this.validations = {
			form: this.form,
			fields: {
				name: [{ key: "required" }, { key: "maxlength" }],
				email: [{ key: "required" }, { key: "email" }],
				password: [
					{ key: "minlength", message: "A senha deve ter no mínimo 8 caracteres." }
				],
				micOnByDefault: [],
				interfaceLanguage: [{ key: "required" }],
				languagesToListen: [{ key: "required" }]
			}
		};

		this.resetForm();

		const user = this.authenticationService.loggedUser as IUser;
		this.selectedLanguage = user.interfaceLanguage;

		this.subscriptions.push(
			this.languageCommandsService.$languageCommands.subscribe(languageCommands => {
				this.languageCommands = languageCommands;
				this.form.get("languagesToListen")!.setValue(
					languageCommands?.languagesToListen || []
				);

				const spokenLanguagesCodes = this.languageCommands?.languagesToListen || [];
				this.spokenLanguages = languages.filter(language => spokenLanguagesCodes.includes(language.code));

				if (this.spokenLanguages.length && !this.spokenLanguages.find(l => l.code === this.selectedLanguage))
					this.selectedLanguage = this.spokenLanguages[0].code;

				this.loadLanguageCommands();
			})
		);

		this.subscriptions.push(
			this.$saveTrigger
				.pipe(debounceTime(500))
				.subscribe(() => this.saveLanguageCommands())
		);

		this.subscriptions.push(
			this.$rerenderTrigger
				.pipe(debounceTime(500))
				.subscribe(() => this.rerenderDataTables())
		);
	}

	public get currentLanguageCommands (): IDataTableRow[] {
		if (!this.selectedLanguage || !this.languageCommands)
			return [];

		const references = this.languageCommands[this.selectedLanguage] || [];
		return references.map(reference => ({
			reference,
			command: reference.command,
			isActive: reference.isActive,
			action: "Ouvir no idioma " + getLanguageNameByCode(reference.targetLanguageCode)
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

	public save (): void {
		if (this.form.invalid)
			return this.alertsService.show("Preenchimento Inválido", "Nome, e-mail ou senha inválidos.", "error");

		const updatedUser: IUserUpdate = {
			name: this.form.get("name")!.value,
			email: this.form.get("email")!.value,
			micOnByDefault: this.form.get("micOnByDefault")!.value,
			interfaceLanguage: this.form.get("interfaceLanguage")!.value,
			password: this.form.get("password")!.value,
			languageCommands: generateLanguageCommandsForUser(
				this.languageCommandsService,
				this.form.get("languagesToListen")!.value
			)
		};

		this.blockUI.start("Salvando Perfil...");
		this.authenticationService.updateProfile(updatedUser, this.blockUI);
	}

	public clearForm (): void {
		this.form.reset();
	}

	public resetForm (): void {
		const user = this.authenticationService.loggedUser as IUser;

		this.form.get("name")!.setValue(user.name);
		this.form.get("email")!.setValue(user.email);
		this.form.get("password")!.setValue(null);
		this.form.get("micOnByDefault")!.setValue(user.micOnByDefault);
		this.form.get("interfaceLanguage")!.setValue(user.interfaceLanguage);
		this.form.get("languagesToListen")!.setValue(
			this.languageCommandsService.languageCommands?.languagesToListen || []
		);
	}

	public loadLanguageCommands (): void {
		if (deepEqual(this.dtOptions.data, this.currentLanguageCommands))
			return;

		for (const l of this.currentLanguageCommands) {
			this.codeModels.set(l.reference.targetLanguageCode, {
				language: "crl",
				uri: l.reference.targetLanguageCode + "-command.crl",
				value: l.command
			});
		}

		this.dtOptions.data = this.currentLanguageCommands;
		this.rerenderDataTables();
	}

	public editCommand (row: IDataTableRow): void {
		const originalCommand = row.command;
		const initialState: ModalOptions = {
			initialState: { command: row, commandKey: "command" },
			class: "modal-lg"
		};

		this.bsModalRef = this.modalService.show(CommandEditorModalComponent, initialState);

		this.subscriptions.push(
			this.bsModalRef.onHide!.subscribe(() => {
				if (originalCommand !== row.command) {
					row.reference.command = row.command;
					this.$saveTrigger.next();

					const codeModel = this.codeModels.get(row.reference.targetLanguageCode);
					if (codeModel)
						this.monacoCrlService.setEditorContent(codeModel.uri, row.command);
				}

				this.bsModalRef = undefined;
			})
		);
	}

	public toggleCommand (row: IDataTableRow): void {
		row.isActive = !row.isActive;
		row.reference.isActive = row.isActive;
		this.$saveTrigger.next();
	}

	public saveLanguageCommands (): void {
		if (!this.languageCommands)
			return;

		this.languageCommandsService.update(this.languageCommands).subscribe({
			next: () => {
				// When data changes, we need to re-render the data table in order to update sort and filter features.
				this.$rerenderTrigger.next();
			}
		});
	}

	public editorLoaded (editorComponent: CodeEditorComponent): void {
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

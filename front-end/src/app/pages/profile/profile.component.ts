import { MatIcon } from "@angular/material/icon";
import { AsyncPipe, NgIf } from "@angular/common";
import { Component, OnDestroy, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";

import { CollapseModule } from "ngx-bootstrap/collapse";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { BsModalRef, BsModalService, ModalOptions } from "ngx-bootstrap/modal";
import { NgSelectConfig, NgSelectModule } from "@ng-select/ng-select";

import { debounceTime, Subject, Subscription } from "rxjs";

import { CommandEditorModalComponent } from "../../components/command-editor-modal/command-editor-modal.component";
import { CommandsTableComponent, IDataTableRow } from "../../components/commands-table/commands-table.component";
import { IValidations, VisualValidatorComponent } from "../../components/visual-validator/visual-validator.component";

import { IUser } from "../../models/user";
import { generateLanguageCommandsForUser, ILanguageCommand, ILanguageCommands } from "../../models/language-command";
import { getLanguageNameByCode, ILanguage, LanguageCode, languages } from "../../models/languages";

import { AlertsService } from "../../services/alerts/alerts.service";
import { LanguageCommandsService } from "../../services/language-commands/language-commands.service";
import { MonacoCrlService } from "../../services/monaco-crl/monaco-crl.service";
import { TitleService } from "../../services/title/title.service";
import { AuthenticationService, IUserUpdate } from "../../services/authentication/authentication.service";

@Component({
	selector: "app-profile",
	standalone: true,
	imports: [
		AsyncPipe,
		CollapseModule,
		CommandsTableComponent,
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
export class ProfileComponent implements OnDestroy {
	@BlockUI()
	private blockUI!: NgBlockUI;

	@ViewChild(CommandsTableComponent)
	private commandsTable!: CommandsTableComponent;

	public form: FormGroup;
	public validations: IValidations;
	public showPassword: boolean = false;
	public isCardCollapsed: boolean = false;

	public languages: ILanguage[] = languages;
	public languageCommands: ILanguageCommands | null = null;
	public currentCommands: IDataTableRow<ILanguageCommand>[] = [];

	private currentLanguage?: LanguageCode;
	private bsModalRef?: BsModalRef;
	private subscriptions: Subscription[] = [];
	private $saveTrigger: Subject<void> = new Subject();

	constructor (
		public readonly languageCommandsService: LanguageCommandsService,
		private readonly modalService: BsModalService,
		private readonly formBuilder: FormBuilder,
		private readonly ngSelectConfig: NgSelectConfig,
		private readonly alertsService: AlertsService,
		private readonly authenticationService: AuthenticationService,
		private readonly monacoCrlService: MonacoCrlService,
		private readonly titleService: TitleService
	) {
		this.titleService.setTitle("Preferências de Usuário");
		this.ngSelectConfig.notFoundText = "Nenhum item encontrado";

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

		this.subscriptions.push(
			this.languageCommandsService.$languageCommands.subscribe(languageCommands => {
				this.languageCommands = languageCommands;
				this.form.get("languagesToListen")!.setValue(
					languageCommands?.languagesToListen || []
				);

				this.loadCurrentCommands(this.currentLanguage);
			})
		);

		this.subscriptions.push(
			this.$saveTrigger
				.pipe(debounceTime(500))
				.subscribe(() => this.saveLanguageCommands())
		);
	}

	public ngOnDestroy (): void {
		this.subscriptions.forEach(subscription => subscription.unsubscribe());

		// Undo any unsaved changes
		this.languageCommandsService.loadFromStorage();
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

	public loadCurrentCommands (selectedLanguage?: LanguageCode): void {
		this.currentLanguage = selectedLanguage;

		if (!selectedLanguage || !this.languageCommands) {
			this.currentCommands = [];
			return;
		}

		const references = this.languageCommands[selectedLanguage] || [];
		this.currentCommands = references.map(reference => ({
			reference,
			command: reference.command,
			isToggleActive: reference.isActive,
			action: "Ouvir no idioma " + getLanguageNameByCode(reference.targetLanguageCode)
		}));
	}

	public editCommand (row: IDataTableRow<ILanguageCommand>): void {
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
					this.monacoCrlService.setEditorContent(row.editorUri!, row.command);
				}

				this.bsModalRef = undefined;
			})
		);
	}

	public toggleCommand (row: IDataTableRow<ILanguageCommand>): void {
		row.isToggleActive = !row.isToggleActive;
		row.reference.isActive = row.isToggleActive;
		this.$saveTrigger.next();
	}

	public saveLanguageCommands (): void {
		if (!this.languageCommands)
			return;

		this.languageCommandsService.update(this.languageCommands).subscribe({
			next: () => {
				// When data changes, we need to re-render the data table in order to update sort and filter features.
				this.commandsTable.$rerenderTrigger.next();
			}
		});
	}
}

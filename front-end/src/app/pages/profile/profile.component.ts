import { MatIcon } from "@angular/material/icon";
import { NgIf } from "@angular/common";
import { AfterViewInit, Component, OnDestroy, TemplateRef, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";

import { ADTSettings } from "angular-datatables/src/models/settings";
import { CollapseModule } from "ngx-bootstrap/collapse";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { DataTableDirective, DataTablesModule } from "angular-datatables";
import { NgSelectConfig, NgSelectModule } from "@ng-select/ng-select";

import { debounceTime, Subject, Subscription } from "rxjs";

import deepEqual from "deep-equal";

import { IValidations, VisualValidatorComponent } from "../../components/visual-validator/visual-validator.component";

import { ICommand } from "../../models/command";
import { IUser } from "../../models/user";
import { generateLanguageCommandsForUser, ILanguageCommand, ILanguageCommands } from "../../models/languageCommand";
import { getLanguageNameByCode, ILanguage, LanguageCode, languages } from "../../models/languages";

import { AlertsService } from "../../services/alerts/alerts.service";
import { DtTranslationService } from "../../services/dt-translation/dt-translation.service";
import { LanguageCommandsService } from "../../services/language-commands/language-commands.service";
import { TitleService } from "../../services/title/title.service";
import { AuthenticationService, IUserUpdate } from "../../services/authentication/authentication.service";

@Component({
	selector: "app-profile",
	standalone: true,
	imports: [CollapseModule, DataTablesModule, FormsModule, MatIcon, NgIf, NgSelectModule, ReactiveFormsModule, VisualValidatorComponent],
	templateUrl: "./profile.component.html",
	styleUrls: ["./profile.component.scss", "../../shared/eye-btn.scss"]
})
export class ProfileComponent implements AfterViewInit, OnDestroy {
	@BlockUI()
	private blockUI!: NgBlockUI;

	@ViewChild("toggleBtn")
	private toggleBtn!: TemplateRef<any>;

	@ViewChild("editBtn")
	private editBtn!: TemplateRef<any>;

	@ViewChild(DataTableDirective)
	private dtElement?: DataTableDirective;

	public dtTrigger: Subject<ADTSettings> = new Subject();
	public dtOptions: ADTSettings = {
		lengthMenu: [10, 25, 50, 100],
		stateSave: true,
		language: this.dtTranslationService.getDataTablesPortugueseTranslation(),
		columns: [
			{ title: "Comandos", data: "command", className: "p-2" },
			{
				title: "Ação",
				data: "targetLanguageCode",
				className: "p-2",
				ngPipeInstance: {
					transform (value: LanguageCode): string {
						return "Ouvir no idioma " + getLanguageNameByCode(value);
					}
				}
			},
			{
				title: "Ativo",
				data: "isActive",
				className: "text-center p-1",
				orderable: false,
				searchable: false
			},
			{
				title: "",
				data: null,
				defaultContent: "",
				className: "text-center p-1",
				orderable: false,
				searchable: false
			}
		],
		data: []
	};

	public form: FormGroup;
	public validations: IValidations;
	public showPassword: boolean = false;
	public isCardCollapsed: boolean = false;

	public languages: ILanguage[] = languages;

	public selectedLanguage?: LanguageCode;
	public languageCommands: ILanguageCommands | null = null;
	public spokenLanguages: ILanguage[] = [];

	private subscriptions: Subscription[] = [];
	private $saveTrigger: Subject<void> = new Subject();

	constructor (
		private readonly formBuilder: FormBuilder,
		private readonly ngSelectConfig: NgSelectConfig,
		private readonly alertsService: AlertsService,
		private readonly authenticationService: AuthenticationService,
		private readonly dtTranslationService: DtTranslationService,
		private readonly languageCommandsService: LanguageCommandsService,
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

		this.$saveTrigger
			.pipe(debounceTime(1000))
			.subscribe(() => this.saveLanguageCommands());
	}

	public get currentLanguageCommands (): ILanguageCommand[] {
		if (!this.selectedLanguage || !this.languageCommands)
			return [];

		return this.languageCommands[this.selectedLanguage] || [];
	}

	public ngAfterViewInit (): void {
		this.dtOptions.columns![2].ngTemplateRef = { ref: this.toggleBtn };
		this.dtOptions.columns![3].ngTemplateRef = { ref: this.editBtn };
		this.dtTrigger.next(this.dtOptions);
	}

	public ngOnDestroy (): void {
		this.dtTrigger.unsubscribe();
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
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

		this.dtOptions.data = this.currentLanguageCommands;
		this.rerenderDataTables();
	}

	public editCommand (command: ICommand): void {
		console.log("Edit", command);
	}

	public toggleCommand (command: ICommand): void {
		command.isActive = !command.isActive;
		this.$saveTrigger.next();
	}

	private saveLanguageCommands (): void {
		if (this.languageCommands)
			this.languageCommandsService.update(this.languageCommands);
	}

	private rerenderDataTables (): void {
		this.dtElement?.dtInstance.then((dtInstance: DataTables.Api) => {
			// Destroy the table first
			dtInstance.destroy();

			// Call the dtTrigger to rerender again
			this.dtTrigger.next(this.dtOptions);
		});
	}
}

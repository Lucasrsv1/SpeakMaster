import { MatIcon } from "@angular/material/icon";
import { NgIf } from "@angular/common";
import { AfterViewInit, Component, OnDestroy, TemplateRef, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";

import { ADTSettings } from "angular-datatables/src/models/settings";
import { CollapseModule } from "ngx-bootstrap/collapse";
import { ToastrService } from "ngx-toastr";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { DataTableDirective, DataTablesModule } from "angular-datatables";
import { NgSelectConfig, NgSelectModule } from "@ng-select/ng-select";

import { Subject } from "rxjs";

import { IValidations, VisualValidatorComponent } from "../../components/visual-validator/visual-validator.component";

import { ICommand } from "../../models/command";
import { IUser } from "../../models/user";
import { getLanguageNameByCode, ILanguage, LanguageCode, languages } from "../../models/languages";
import { ILanguageCommand, ILanguageCommands } from "../../models/languageCommand";

import { AlertsService } from "../../services/alerts/alerts.service";
import { AuthenticationService } from "../../services/authentication/authentication.service";
import { DtTranslationService } from "../../services/dt-translation/dt-translation.service";
import { TitleService } from "../../services/title/title.service";

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
			{ title: "Ação", data: "actionDescription", className: "p-2" },
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
	public languageCommands: ILanguageCommands = {
		languagesToListen: [],
		[LanguageCode.PT_BR]: [
			{ targetLanguageCode: LanguageCode.EN_US, command: "(ouvir [em], trocar [idioma] [para]) inglês", isActive: true },
			{ targetLanguageCode: LanguageCode.DE_DE, command: "(ouvir [em], trocar [idioma] [para]) alemão", isActive: true }
		],
		[LanguageCode.EN_US]: [
			{ targetLanguageCode: LanguageCode.PT_BR, command: "(listen [to], switch [language] [to]) portuguese", isActive: true },
			{ targetLanguageCode: LanguageCode.DE_DE, command: "(listen [to], switch [language] [to]) german", isActive: false }
		]
	};

	constructor (
		private readonly formBuilder: FormBuilder,
		private readonly ngSelectConfig: NgSelectConfig,
		private readonly toastr: ToastrService,
		private readonly alertsService: AlertsService,
		private readonly authenticationService: AuthenticationService,
		private readonly dtTranslationService: DtTranslationService,
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
	}

	public get currentLanguageCommands (): ILanguageCommand[] {
		if (!this.selectedLanguage)
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
	}

	private rerenderDataTables (): void {
		this.dtElement?.dtInstance.then((dtInstance: DataTables.Api) => {
			// Destroy the table first
			dtInstance.destroy();

			// Call the dtTrigger to rerender again
			this.dtTrigger.next(this.dtOptions);
		});
	}

	public save (): void {
		if (this.form.invalid)
			return this.alertsService.show("Preenchimento Inválido", "Nome, e-mail ou senha inválidos.", "error");

		this.blockUI.start("Salvando Perfil...");
		// TODO
	}

	public clearForm (): void {
		this.form.reset();
	}

	public resetForm (): void {
		const user = this.authenticationService.getLoggedUser() as IUser;

		this.form.get("name")!.setValue(user.name);
		this.form.get("email")!.setValue(user.email);
		this.form.get("password")!.setValue(null);
		this.form.get("micOnByDefault")!.setValue(user.micOnByDefault);
		this.form.get("interfaceLanguage")!.setValue(user.interfaceLanguage);
		this.form.get("languagesToListen")!.setValue([user.interfaceLanguage]);

		this.selectedLanguage = LanguageCode.PT_BR;
		this.loadLanguageCommands();
	}

	public loadLanguageCommands (): void {
		const data: ICommand[] = this.currentLanguageCommands.map(
			command => ({
				command: command.command,
				actionDescription: "Ouvir no idioma " + getLanguageNameByCode(command.targetLanguageCode),
				isActive: command.isActive
			})
		);

		this.dtOptions.data = data;
		this.rerenderDataTables();
	}

	public editCommand (command: ICommand): void {
		console.log("Edit", command);
	}

	public toggleCommand (command: ICommand): void {
		console.log("Toggle", command);
		command.isActive = !command.isActive;
		this.toastr.success("Comando alterado.");
	}
}

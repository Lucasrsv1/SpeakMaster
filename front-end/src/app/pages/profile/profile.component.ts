import { Component } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { NgIf } from "@angular/common";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";

import { CollapseModule } from "ngx-bootstrap/collapse";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { NgSelectConfig, NgSelectModule } from "@ng-select/ng-select";

import { IValidations, VisualValidatorComponent } from "../../components/visual-validator/visual-validator.component";

import { IUser } from "../../models/user";

import { AlertsService } from "../../services/alerts/alerts.service";
import { AuthenticationService } from "../../services/authentication/authentication.service";
import { TitleService } from "../../services/title/title.service";
import { ILanguage, languages } from "../../models/languages";

@Component({
	selector: "app-profile",
	standalone: true,
	imports: [CollapseModule, FormsModule, MatIcon, NgIf, NgSelectModule, ReactiveFormsModule, VisualValidatorComponent],
	templateUrl: "./profile.component.html",
	styleUrls: ["./profile.component.scss", "../../shared/eye-btn.scss"]
})
export class ProfileComponent {
	@BlockUI()
	private blockUI!: NgBlockUI;

	public isCardCollapsed: boolean = false;

	public form: FormGroup;
	public validations: IValidations;
	public showPassword: boolean = false;

	public languages: ILanguage[] = languages;

	constructor (
		private readonly formBuilder: FormBuilder,
		private readonly ngSelectConfig: NgSelectConfig,
		private readonly alertsService: AlertsService,
		private readonly authenticationService: AuthenticationService,
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
	}
}

import { MatIcon } from "@angular/material/icon";
import { NgIf } from "@angular/common";
import { RouterLink } from "@angular/router";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";

import { BlockUI, NgBlockUI } from "ng-block-ui";

import { IValidations, VisualValidatorComponent } from "../../components/visual-validator/visual-validator.component";

import { AlertsService } from "../../services/alerts/alerts.service";
import { AuthenticationService } from "../../services/authentication/authentication.service";
import { TitleService } from "../../services/title/title.service";

@Component({
	selector: "app-sign-up",
	standalone: true,
	imports: [FormsModule, MatIcon, NgIf, ReactiveFormsModule, RouterLink, VisualValidatorComponent],
	templateUrl: "./sign-up.component.html",
	styleUrls: ["./sign-up.component.scss", "../../shared/eye-btn.scss"]
})
export class SignUpComponent {
	@BlockUI()
	private blockUI!: NgBlockUI;

	@ViewChild("nameInput")
	private nameInput?: ElementRef;

	public form: FormGroup;
	public validations: IValidations;
	public showPassword: boolean = false;

	constructor (
		private readonly formBuilder: FormBuilder,
		private readonly alertsService: AlertsService,
		private readonly authenticationService: AuthenticationService,
		private readonly titleService: TitleService
	) {
		this.titleService.setTitle("Cadastro");

		this.form = this.formBuilder.group({
			name: [null, [Validators.required, Validators.maxLength(200)]],
			email: [null, [Validators.required, Validators.email]],
			password: [null, [Validators.required, Validators.minLength(8)]]
		});

		this.validations = {
			form: this.form,
			fields: {
				name: [{ key: "required" }, { key: "maxlength" }],
				email: [{ key: "required" }, { key: "email" }],
				password: [
					{ key: "required" },
					{ key: "minlength", message: "A senha deve ter no mínimo 8 caracteres." }
				]
			}
		};
	}

	public signUp (): void {
		if (this.form.invalid)
			return this.alertsService.show("Preenchimento Inválido", "Nome, e-mail ou senha inválidos.", "error");

		this.blockUI.start("Cadastrando...");
		this.authenticationService.signUp({
			name: this.form.get("name")!.value,
			email: this.form.get("email")!.value,
			password: this.form.get("password")!.value
		}, this.blockUI);
	}

	public clear (): void {
		this.form.reset();
		if (this.nameInput)
			this.nameInput.nativeElement.focus();
	}
}

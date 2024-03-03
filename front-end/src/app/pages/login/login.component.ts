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
	selector: "app-login",
	standalone: true,
	imports: [FormsModule, MatIcon, NgIf, ReactiveFormsModule, RouterLink, VisualValidatorComponent],
	templateUrl: "./login.component.html",
	styleUrls: ["./login.component.scss", "../../shared/eye-btn.scss"]
})
export class LoginComponent {
	@BlockUI()
	private blockUI!: NgBlockUI;

	@ViewChild("emailInput")
	private emailInput?: ElementRef;

	public form: FormGroup;
	public validations: IValidations;
	public showPassword: boolean = false;

	constructor (
		private readonly formBuilder: FormBuilder,
		private readonly alertsService: AlertsService,
		private readonly authenticationService: AuthenticationService,
		private readonly titleService: TitleService
	) {
		this.titleService.setTitle("Login");

		this.form = this.formBuilder.group({
			email: [null, [Validators.required, Validators.email]],
			password: [null, Validators.required]
		});

		this.validations = {
			form: this.form,
			fields: {
				email: [{ key: "required" }, { key: "email" }],
				password: [{ key: "required" }]
			}
		};
	}

	public login (): void {
		if (this.form.invalid)
			return this.alertsService.show("Preenchimento Inválido", "E-mail ou senha inválidos.", "error");

		this.blockUI.start("Autenticando...");
		this.authenticationService.login(this.form.get("email")?.value, this.form.get("password")?.value, this.blockUI);
	}

	public clear (): void {
		this.form.reset();
		if (this.emailInput)
			this.emailInput.nativeElement.focus();
	}
}

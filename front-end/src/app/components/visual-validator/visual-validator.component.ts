import { AfterContentInit, Component, ElementRef, Input } from "@angular/core";
import { FormGroup, ValidationErrors } from "@angular/forms";
import { NgFor, NgIf } from "@angular/common";

export interface IValidations {
	form: FormGroup;
	fields: {
		[field: string]: Array<{
			key: string
			message?: string
		}>
	};
}

@Component({
	selector: "app-visual-validator",
	standalone: true,
	imports: [NgFor, NgIf],
	templateUrl: "./visual-validator.component.html",
	styleUrl: "./visual-validator.component.scss"
})
export class VisualValidatorComponent implements AfterContentInit {
	@Input()
	public config?: IValidations;

	@Input()
	public field?: string;

	@Input()
	public fields?: string[];

	private inputs: HTMLElement[] = [];

	constructor (private readonly elementRef: ElementRef) { }

	public get targetFields (): string[] {
		return this.fields || (this.field && [this.field]) || [];
	}

	public get isInputInvalid (): boolean {
		return this.inputs.some(i => i.classList.contains("is-invalid"));
	}

	public ngAfterContentInit () {
		this.inputs = [
			this.elementRef.nativeElement.childNodes[0],
			...this.elementRef.nativeElement.querySelectorAll("input, .NgxEditor")
		];

		for (const input of this.inputs) {
			if (!input.classList.contains("form-control"))
				input.classList.add("form-field");
		}
	}

	public get formControlErrors (): ValidationErrors | undefined {
		let validationErrors: ValidationErrors | undefined;
		for (const field of this.targetFields) {
			const fieldErrors = this.config?.form.controls[field]?.errors;
			if (fieldErrors) {
				validationErrors = fieldErrors;
				break;
			}
		}

		for (const input of this.inputs) {
			if (this.controlIsDirty) {
				if (validationErrors) {
					input.classList.add("is-invalid");
					input.classList.remove("is-valid");
				} else {
					input.classList.add("is-valid");
					input.classList.remove("is-invalid");
				}
			} else {
				input.classList.remove("is-valid", "is-invalid");
			}
		}

		return validationErrors;
	}

	public get errorsField (): string {
		for (const field of this.targetFields) {
			if (this.config?.form.controls[field]?.errors)
				return field;
		}

		return "";
	}

	public get controlIsDirty (): boolean {
		// Control is dirty if any of the target fields has a value.
		for (const field of this.targetFields) {
			if (this.config?.form.controls[field]?.value)
				return true;
		}

		// Control is dirty if any of the inputs is dirty.
		for (const input of this.inputs) {
			if (input.classList.contains("ng-dirty"))
				return true;
		}

		return false;
	}

	public getDefaultMessage (key: string): string {
		switch (key) {
			case "required":
				return "Este campo é obrigatório";
			case "email":
				return "Este campo deve ser um e-mail válido";
			case "min":
				return "Este campo deve ter um valor maior";
			case "max":
				return "Este campo deve ter um valor menor";
			case "minlength":
				return "Este campo deve ser maior";
			case "maxlength":
				return "Este campo deve ser menor";
			case "failedPhone":
				return "Este campo deve ser um telefone válido";
			case "failedCPF":
				return "Este campo deve ser um CPF válido";
			case "failedCEP":
				return "Este campo deve ser um CEP válido";
			default:
				return "Preenchimento inválido";
		}
	}
}

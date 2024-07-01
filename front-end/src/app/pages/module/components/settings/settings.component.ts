import { ActivatedRoute } from "@angular/router";
import { NgFor } from "@angular/common";
import { Component, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";

import { BlockUI, NgBlockUI } from "ng-block-ui";

import { Subscription } from "rxjs";

import {
	IPreferenceUpdate,
	NumberPreference,
	PreferenceGroup,
	PreferenceType,
	PreferenceValue,
	StringPreference
} from "speakmaster-module-builder/preferences-builder";

import { IPreferenceValueUpdate } from "../../../../models/preference-value-update";
import { IUserModule } from "../../../../models/user-module";

import { IValidations, VisualValidatorComponent } from "../../../../components/visual-validator/visual-validator.component";

import { AsPipe } from "../../../../pipes/as/as.pipe";
import { TranslationPipe } from "../../../../pipes/translation/translation.pipe";

import { CommandCenterService } from "../../../../services/command-center/command-center.service";
import { UserModulesService } from "../../../../services/user-modules/user-modules.service";

@Component({
	selector: "app-module-settings",
	standalone: true,
	imports: [
		AsPipe,
		FormsModule,
		NgFor,
		ReactiveFormsModule,
		TranslationPipe,
		VisualValidatorComponent
	],
	templateUrl: "./settings.component.html",
	styleUrl: "./settings.component.scss"
})
export class SettingsComponent implements OnDestroy {
	@BlockUI()
	private blockUI!: NgBlockUI;

	public PreferenceType = PreferenceType;
	public NumberPreference = NumberPreference;

	public form: FormGroup;
	public validations: IValidations;
	public preferenceGroups: PreferenceGroup[];

	private idModule: number;
	private currentPreferenceValues: Record<string, PreferenceValue> = {};
	private subscriptions: Subscription[] = [];

	constructor (
		private readonly route: ActivatedRoute,
		private readonly formBuilder: FormBuilder,
		private readonly commandCenterService: CommandCenterService,
		private readonly userModulesService: UserModulesService
	) {
		this.idModule = Number(this.route.snapshot.paramMap.get("idModule"));
		this.commandCenterService.monitorModulePreferences(this.idModule, true);
		this.preferenceGroups = this.userModule?.preferencesDefinition || [];

		this.form = this.formBuilder.group({});
		this.validations = {
			form: this.form,
			fields: {}
		};

		for (const group of this.preferenceGroups) {
			for (const row of group.preferenceRows) {
				for (const preference of row) {
					if (!preference)
						 continue;

					const validations = [];
					const visualValidations = [];

					switch (preference.type) {
						case PreferenceType.FLOAT:
						case PreferenceType.INTEGER:
							// eslint-disable-next-line no-case-declarations
							const numberPreference = preference as NumberPreference;

							if (numberPreference.max !== null) {
								validations.push(Validators.max(numberPreference.max));
								visualValidations.push({ key: "max" });
							}

							if (numberPreference.min !== null) {
								validations.push(Validators.min(numberPreference.min));
								visualValidations.push({ key: "min" });
							}
							break;
						case PreferenceType.STRING:
							// eslint-disable-next-line no-case-declarations
							const stringPreference = preference as StringPreference;

							if (stringPreference.maxLength !== null) {
								validations.push(Validators.maxLength(stringPreference.maxLength));
								visualValidations.push({ key: "maxlength" });
							}

							if (stringPreference.minLength !== null) {
								validations.push(Validators.minLength(stringPreference.minLength));
								visualValidations.push({ key: "minlength" });
							}
							break;
					}

					if (!preference.isOptional) {
						validations.push(Validators.required);
						visualValidations.push({ key: "required" });
					}

					this.form.addControl(
						preference.identifier,
						this.formBuilder.control(null, validations)
					);
					this.validations.fields[preference.identifier] = visualValidations;
				}
			}
		}

		this.loadSavedPreferences();
		this.subscriptions.push(
			this.commandCenterService.$getPreferenceDynamicChanges().subscribe(changes => {
				if (changes.idModule !== this.idModule)
					return;

				this.updatePreferences(changes.preferences);
			})
		);
	}

	public get userModule (): IUserModule | undefined {
		return this.userModulesService.userModules?.find(m => m.idModule === this.idModule);
	}

	public ngOnDestroy (): void {
		this.commandCenterService.monitorModulePreferences(this.idModule, false);
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
	}

	public updatePreferences (preferences: IPreferenceUpdate<PreferenceValue> | IPreferenceUpdate<PreferenceValue>[]): void {
		console.log("DYNAMIC CHANGES:", preferences);
		if (!Array.isArray(preferences))
			preferences = [preferences];

		for (const preference of preferences) {
			this.form.patchValue({ [preference.identifier]: preference.value });
			this.currentPreferenceValues[preference.identifier] = preference.value;

			const control = this.form.get(preference.identifier);
			if (!control) continue;

			if (preference.isDisabled)
				control.disable();
			else
				control.enable();

			// TODO: handle other types of dynamic changes
		}
	}

	public loadSavedPreferences (): void {
		const savedValues = this.userModule?.preferences || {};
		this.form.patchValue(savedValues);
	}

	public loadCurrentValues (): void {
		this.form.patchValue(this.currentPreferenceValues);
	}

	public save (): void {
		const module = this.userModule;
		if (this.form.invalid || !module)
			return;

		this.blockUI.start("Salvando Preferências do Módulo...");

		const preferences: Record<string, PreferenceValue> = {};
		const preferencesUpdate: IPreferenceValueUpdate[] = [];

		for (const [key, value] of Object.entries(this.form.value)) {
			preferences[key] = value as PreferenceValue;
			preferencesUpdate.push({ identifier: key, value: value as PreferenceValue });
		}

		module.preferences = preferences;
		this.commandCenterService.sendPreferenceValueUpdateToModule(module.idModule, preferencesUpdate);
		this.userModulesService.savePreferences(module, this.blockUI);
	}
}

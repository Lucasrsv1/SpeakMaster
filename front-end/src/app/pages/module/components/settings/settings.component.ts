import { ActivatedRoute } from "@angular/router";
import { MatIcon } from "@angular/material/icon";
import { Component, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { NgFor, NgIf } from "@angular/common";

import { NgSelectModule } from "@ng-select/ng-select";
import { SortableModule } from "ngx-bootstrap/sortable";
import { BlockUI, NgBlockUI } from "ng-block-ui";

import { Subscription } from "rxjs";

import {
	ActionButtonPosition,
	ActionButtonPreference,
	IPreferenceUpdate,
	NumberPreference,
	Preference,
	PreferenceGroup,
	PreferenceType,
	PreferenceValue,
	SelectOption,
	SingleSelectPreference,
	SortedListPreference,
	StringPreference
} from "speakmaster-module-builder/preferences-builder";

import { IPreferenceValueUpdate } from "../../../../models/preference-value-update";
import { IUserModule } from "../../../../models/user-module";

import { IValidations, VisualValidatorComponent } from "../../../../components/visual-validator/visual-validator.component";

import { AsPipe } from "../../../../pipes/as/as.pipe";
import { TranslationPipe } from "../../../../pipes/translation/translation.pipe";

import { AuthenticationService } from "../../../../services/authentication/authentication.service";
import { CommandCenterService } from "../../../../services/command-center/command-center.service";
import { UserModulesService } from "../../../../services/user-modules/user-modules.service";

interface ITranslatedOption {
	description: string;
	label: string;
	value: PreferenceValue;
}

@Component({
	selector: "app-module-settings",
	standalone: true,
	imports: [
		AsPipe,
		FormsModule,
		MatIcon,
		NgFor,
		NgIf,
		NgSelectModule,
		ReactiveFormsModule,
		SortableModule,
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
	public ActionButtonPosition = ActionButtonPosition;
	public ActionButtonPreference = ActionButtonPreference;
	public NumberPreference = NumberPreference;
	public StringPreference = StringPreference;

	public form: FormGroup;
	public validations: IValidations;
	public preferenceGroups: PreferenceGroup[];
	public translatedPreferenceOptions: Record<string, ITranslatedOption[]> = {};

	private idModule: number;
	private currentPreferenceValues: Record<string, PreferenceValue> = {};
	private subscriptions: Subscription[] = [];

	private readonly translationPipe: TranslationPipe;

	constructor (
		private readonly route: ActivatedRoute,
		private readonly formBuilder: FormBuilder,
		private readonly authenticationService: AuthenticationService,
		private readonly commandCenterService: CommandCenterService,
		private readonly userModulesService: UserModulesService
	) {
		this.translationPipe = new TranslationPipe(this.authenticationService);

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
						case PreferenceType.INTEGER: {
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
						}
						case PreferenceType.MULTI_SELECT:
						case PreferenceType.SINGLE_SELECT: {
							// ? MULTI_SELECT and SINGLE_SELECT have the same options structure
							const selectPreference = preference as SingleSelectPreference<PreferenceValue>;
							this.translatedPreferenceOptions[selectPreference.identifier] = this.buildOptionsList(selectPreference.options);
							break;
						}
						case PreferenceType.SORTED_LIST: {
							const sortedListPreference = preference as SortedListPreference<PreferenceValue>;

							// Carrega ordenação inicial de acordo com o valor da preferência
							const orderedValues = preference.value as PreferenceValue[] || [];
							this.translatedPreferenceOptions[sortedListPreference.identifier] = this.buildOptionsList(sortedListPreference.list).sort((a, b) => {
								const aIndex = orderedValues.includes(a.value) ? orderedValues.indexOf(a.value) : Infinity;
								const bIndex = orderedValues.includes(b.value) ? orderedValues.indexOf(b.value) : Infinity;
								return aIndex - bIndex;
							});
							break;
						}
						case PreferenceType.STRING: {
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
					}

					if (!preference.isOptional && ![PreferenceType.ACTION_BUTTON, PreferenceType.BOOLEAN, PreferenceType.SORTED_LIST].includes(preference.type)) {
						validations.push(Validators.required);
						visualValidations.push({ key: "required" });
					}

					if (preference.type === PreferenceType.SORTED_LIST) {
						this.form.addControl(
							preference.identifier,
							this.formBuilder.control(this.translatedPreferenceOptions[preference.identifier], validations)
						);
					} else {
						this.form.addControl(
							preference.identifier,
							this.formBuilder.control(null, validations)
						);
					}

					this.validations.fields[preference.identifier] = visualValidations;
				}
			}
		}

		this.loadSavedPreferences();
		this.subscriptions.push(
			this.commandCenterService.getPreferenceDynamicChanges$().subscribe(changes => {
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

	public actionButtonClicked (preference: Preference<PreferenceValue>): void {
		if (!this.userModule)
			return;

		this.commandCenterService.sendPreferenceValueUpdateToModule(
			this.userModule.idModule,
			[{ identifier: preference.identifier, value: { clickSignal: crypto.randomUUID() } }]
		);
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

			if ("options" in preference && preference.options) {
				this.translatedPreferenceOptions[preference.identifier] = this.buildOptionsList(preference.options);
			} else if ("list" in preference && preference.list) {
				const orderedValues = preference.value as PreferenceValue[] || [];
				this.translatedPreferenceOptions[preference.identifier] = this.buildOptionsList(preference.list).sort((a, b) => {
					const aIndex = orderedValues.includes(a.value) ? orderedValues.indexOf(a.value) : Infinity;
					const bIndex = orderedValues.includes(b.value) ? orderedValues.indexOf(b.value) : Infinity;
					return aIndex - bIndex;
				});

				this.form.patchValue({ [preference.identifier]: this.translatedPreferenceOptions[preference.identifier] });
			}

			if ("label" in preference) {
				const preferenceDefinition = this.findPreference<ActionButtonPreference<PreferenceValue>>(preference.identifier);
				if (!preferenceDefinition)
					return;

				if (preference.label)
					preferenceDefinition.label = preference.label;

				if (preference.buttonText)
					preferenceDefinition.buttonText = preference.buttonText;

				if (preference.buttonIcon)
					preferenceDefinition.buttonIcon = preference.buttonIcon;
			}
		}
	}

	public loadSavedPreferences (): void {
		const savedValues = this.userModule?.preferences || {};
		this.form.patchValue(savedValues);

		for (const group of this.preferenceGroups) {
			for (const row of group.preferenceRows) {
				for (const preference of row) {
					if (preference?.type === PreferenceType.SORTED_LIST) {
						const list = this.translatedPreferenceOptions[preference.identifier];
						const orderedValues = savedValues[preference.identifier] as PreferenceValue[];

						list.sort((a, b) => {
							const aIndex = orderedValues.includes(a.value) ? orderedValues.indexOf(a.value) : Infinity;
							const bIndex = orderedValues.includes(b.value) ? orderedValues.indexOf(b.value) : Infinity;
							return aIndex - bIndex;
						});

						this.form.patchValue({ [preference.identifier]: list });
					}
				}
			}
		}
	}

	public loadCurrentValues (): void {
		this.form.patchValue(this.currentPreferenceValues);

		for (const group of this.preferenceGroups) {
			for (const row of group.preferenceRows) {
				for (const preference of row) {
					if (preference?.type === PreferenceType.SORTED_LIST) {
						const list = this.translatedPreferenceOptions[preference.identifier];
						const orderedValues = this.currentPreferenceValues[preference.identifier] as PreferenceValue[];

						list.sort((a, b) => {
							const aIndex = orderedValues.includes(a.value) ? orderedValues.indexOf(a.value) : Infinity;
							const bIndex = orderedValues.includes(b.value) ? orderedValues.indexOf(b.value) : Infinity;
							return aIndex - bIndex;
						});

						this.form.patchValue({ [preference.identifier]: list });
					}
				}
			}
		}
	}

	public save (): void {
		const module = this.userModule;
		if (this.form.invalid || !module)
			return;

		this.blockUI.start("Salvando Preferências do Módulo...");

		const preferences: Record<string, PreferenceValue> = {};
		const preferencesUpdate: IPreferenceValueUpdate[] = [];

		for (const [key, value] of Object.entries(this.form.value)) {
			const preferenceDefinition = this.findPreference<Preference<PreferenceValue>>(key);
			if (preferenceDefinition?.type !== PreferenceType.SORTED_LIST) {
				preferences[key] = value as PreferenceValue;
				preferencesUpdate.push({ identifier: key, value: value as PreferenceValue });
			} else if (value && Array.isArray(value)) {
				const orderedValues = (value as ITranslatedOption[]).map(option => option.value);
				preferences[key] = orderedValues;
				preferencesUpdate.push({ identifier: key, value: orderedValues });
			}
		}

		module.preferences = preferences;
		this.commandCenterService.sendPreferenceValueUpdateToModule(module.idModule, preferencesUpdate);
		this.userModulesService.savePreferences(module, this.blockUI);
	}

	private findPreference<T extends Preference<PreferenceValue>> (identifier: string): T | undefined {
		for (const group of this.preferenceGroups) {
			for (const row of group.preferenceRows) {
				for (const preference of row) {
					if (preference?.identifier === identifier)
						return preference as T;
				}
			}
		}

		return undefined;
	}

	private buildOptionsList (options: SelectOption<PreferenceValue>[]): ITranslatedOption[] {
		const list: ITranslatedOption[] = [];
		for (const option of options) {
			let label = this.translationPipe.transform(option);
			if (!label) {
				if (typeof option.value === "object")
					label = JSON.stringify(option.value);
				else if (option.value)
					label = option.value.toString();
				else
					label = "-";
			}

			const description = this.translationPipe.transform(option, "description");
			list.push({ description, label, value: option.value });
		}

		return list;
	}
}

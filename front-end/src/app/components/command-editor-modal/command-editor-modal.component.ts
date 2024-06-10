import { MatIcon } from "@angular/material/icon";
import { NgSelectModule } from "@ng-select/ng-select";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { NgFor, NgIf } from "@angular/common";

import { BsModalRef } from "ngx-bootstrap/modal";
import { CollapseModule } from "ngx-bootstrap/collapse";
import { NgScrollbarModule } from "ngx-scrollbar";
import { CodeEditorComponent, CodeEditorModule, CodeModel } from "@ngstack/code-editor";

import { editor } from "monaco-editor";
import { debounceTime, Subject, Subscription } from "rxjs";

import { Automata } from "speakmaster-crl";
import { Command, CommandParameter, CommandParameterTypes } from "speakmaster-module-builder/default-commands-builder";
import { Feature, Parameter } from "speakmaster-module-builder/features-builder";

import { IDataTableRow } from "../commands-table/commands-table.component";
import { LanguageCode, languages } from "../../models/languages";

import { FeaturesService } from "../../services/features/features.service";
import { MonacoCrlService } from "../../services/monaco-crl/monaco-crl.service";

interface ISelectOption {
	label: string;
	value: string;
	description?: string;
}

interface IFeatureParameter {
	collapsed: boolean;
	identifier: string;
	name: string;
	description: string;
	valueControl: string;
	valueTypeControl: string;
	valueTypeOptions: ISelectOption[];
	allowedValuesOptions: ISelectOption[];
	restrictedVariableOptions?: Array<{
		automataOption: string;
		formControlName: string;
	}>;
}

@Component({
	selector: "app-command-editor-modal",
	standalone: true,
	imports: [
		CodeEditorModule,
		CollapseModule,
		FormsModule,
		MatIcon,
		NgFor,
		NgIf,
		NgScrollbarModule,
		NgSelectModule,
		ReactiveFormsModule
	],
	templateUrl: "./command-editor-modal.component.html",
	styleUrl: "./command-editor-modal.component.scss"
})
export class CommandEditorModalComponent implements OnInit, OnDestroy {
	// Inputs
	public areInstructionsCollapsed: boolean = true;
	public arePossibleCommandsCollapsed: boolean = false;
	public addingToLanguage?: LanguageCode;
	public moduleFeatures: Feature[] = [];

	// Output
	public editingCommand!: IDataTableRow<any>;
	public editingCommandFeature?: Command;
	public saveTrigger?: { value: boolean };

	protected possibleCommands: string[] = [];
	protected codeModel: CodeModel = {
		language: "crl",
		uri: "editing-command.crl",
		value: ""
	};

	protected options: editor.IEditorConstructionOptions = {
		automaticLayout: true
	};

	protected form: FormGroup;
	protected commandVariableNames: string[] = [];
	protected commandRestrictedVariableNames: string[] = [];
	protected featuresOptions: ISelectOption[] = [];
	protected parameters: IFeatureParameter[] = [];
	protected CommandParameterTypes = CommandParameterTypes;

	private $valueChanged: Subject<void> = new Subject();

	private currentAutomata?: Automata;
	private currentCommand: string = "";
	private editorComponent?: CodeEditorComponent;
	private subscriptions: Subscription[] = [];

	constructor (
		protected readonly bsModalRef: BsModalRef,
		private readonly formBuilder: FormBuilder,
		private readonly featuresService: FeaturesService,
		private readonly monacoCrlService: MonacoCrlService
	) {
		this.monacoCrlService.registerCRL();
		this.subscriptions.push(
			this.$valueChanged
				.pipe(debounceTime(500))
				.subscribe(() => this.getPossibleCommands())
		);

		this.form = this.formBuilder.group({
			feature: [null, Validators.required]
		});

		this.subscriptions.push(
			this.form.get("feature")!.valueChanges.subscribe(
				this.featureSelected.bind(this)
			)
		);
	}

	protected get isCommandInvalid (): boolean {
		return !this.currentCommand || this.monacoCrlService.isEditorContentInvalid(this.codeModel.uri);
	}

	protected get languageName (): string {
		return languages.find(l => l.code === this.addingToLanguage)?.name || "-";
	}

	public ngOnInit (): void {
		this.codeModel.value = this.editingCommand.command;
		this.currentCommand = this.editingCommand.command;
		this.featuresOptions = this.moduleFeatures.map(f => ({
			label: this.featuresService.getFeatureName(f),
			value: f.identifier,
			description: this.featuresService.getFeatureDescription(f)
		}));
	}

	public ngOnDestroy (): void {
		this.editorComponent?.ngOnDestroy();
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
	}

	protected editorLoaded (editorComponent: CodeEditorComponent): void {
		this.editorComponent = editorComponent;
		this.monacoCrlService.setEditorContent(this.codeModel.uri, this.editingCommand.command);
		this.getPossibleCommands();

		// Fill form with the current action executed by the command
		if (this.editingCommandFeature?.featureIdentifier) {
			this.form.patchValue({
				feature: this.featuresOptions.find(o => o.value === this.editingCommandFeature!.featureIdentifier)
			});

			if (!this.editingCommandFeature.parameters)
				return;

			for (const p of this.editingCommandFeature.parameters) {
				this.form.patchValue({ [p.identifier + "-value-type"]: p.type });
				this.form.patchValue({ [p.identifier + "-value"]: p.variableName || p.value || "" });

				if (p.type === CommandParameterTypes.RESTRICTED_VARIABLE && p.variableValues) {
					for (let idx = 0; idx < p.variableValues.length; idx++)
						this.form.patchValue({ [p.identifier + "-value-" + idx]: p.variableValues[idx] });
				}
			}
		}
	}

	protected onValueChanged (value: string): void {
		this.currentCommand = value;
		this.monacoCrlService.validate(this.codeModel.uri);
		this.$valueChanged.next();
	}

	protected getParameterValueTypes (parameter: Parameter): ISelectOption[] {
		const options = [
			{ label: "Valor constante", value: CommandParameterTypes.CONSTANT }
		];

		if (parameter.optional)
			options.push({ label: "Não usar este parâmetro", value: CommandParameterTypes.UNDEFINED });

		if (!parameter.allowedValues.length)
			options.push({ label: "Variável", value: CommandParameterTypes.VARIABLE });
		else
			options.push({ label: "Variável restrita", value: CommandParameterTypes.RESTRICTED_VARIABLE });

		return options.sort((a, b) => a.label.localeCompare(b.label));
	}

	protected save (): void {
		if (this.isCommandInvalid || (this.editingCommandFeature && this.form.invalid))
			return;

		// Write command to the original object
		this.editingCommand.command = this.currentCommand.trim();

		if (this.saveTrigger)
			this.saveTrigger.value = true;

		if (this.editingCommandFeature) {
			this.editingCommandFeature.command = this.currentCommand.trim();

			const selectedFeature = this.form.get("feature")!.value as ISelectOption;
			this.editingCommandFeature.featureIdentifier = selectedFeature.value;

			this.editingCommandFeature.parameters = this.parameters.map(p => {
				const parameter = new CommandParameter(p.identifier);
				const selectedType = this.form.get(p.valueTypeControl)!.value as CommandParameterTypes;
				const value = this.form.get(p.valueControl)!.value as string;

				switch (selectedType) {
					case CommandParameterTypes.CONSTANT:
						parameter.useConstant(value);
						break;
					case CommandParameterTypes.VARIABLE:
						parameter.useVariable(value);
						break;
					case CommandParameterTypes.RESTRICTED_VARIABLE:
						// eslint-disable-next-line no-case-declarations
						const variableValues = p.restrictedVariableOptions!.map(o => this.form.get(o.formControlName)!.value as string);
						parameter.useRestrictedVariable(value, variableValues);
						break;
				}

				return parameter;
			});
		}

		this.bsModalRef.hide();
	}

	private featureSelected (option: ISelectOption | null) {
		// First remove fields from the HTML template
		this.parameters = [];

		// Then remove fields from the form
		const controlNames = Object.keys(this.form.controls);
		for (const controlName of controlNames) {
			if (controlName !== "feature")
				this.form.removeControl(controlName);
		}

		if (!option)
			return;

		const feature = this.moduleFeatures.find(f => f.identifier === option.value)!;
		this.parameters = feature.parameters.map(p => ({
			collapsed: false,
			identifier: p.identifier,
			name: this.featuresService.getParameterName(feature, p),
			description: this.featuresService.getParameterDescription(feature, p),
			valueControl: p.identifier + "-value",
			valueTypeControl: p.identifier + "-value-type",
			valueTypeOptions: this.getParameterValueTypes(p),
			allowedValuesOptions: p.allowedValues.map(v => ({
				description: this.featuresService.getParameterValueDescription(feature, v),
				label: this.featuresService.getParameterValueName(feature, v),
				value: v.identifier
			}))
		}));

		for (const p of this.parameters) {
			const typeControl = new FormControl<CommandParameterTypes | null>(null, Validators.required);
			const valueControl = new FormControl<string | null>(null);

			this.subscriptions.push(
				typeControl.valueChanges.subscribe(value => {
					if (value === CommandParameterTypes.UNDEFINED)
						valueControl.setValidators([]);
					else
						valueControl.setValidators([Validators.required]);

					valueControl.setValue(null);
				}),

				valueControl.valueChanges.subscribe(value => {
					// Remove previous fields
					for (const { formControlName } of p.restrictedVariableOptions || [])
						this.form.removeControl(formControlName);

					if (typeControl.value === CommandParameterTypes.RESTRICTED_VARIABLE) {
						// Clear previous values for parameter
						p.restrictedVariableOptions = [];

						if (!value || !this.currentAutomata) return;

						const options = this.currentAutomata.getRestrictedVariableOptions(value);
						for (let idx = 0; idx < options.length; idx++) {
							const formControlName = p.valueControl + "-" + idx;
							p.restrictedVariableOptions.push({
								automataOption: options[idx],
								formControlName
							});

							const control = new FormControl<string | null>(null, Validators.required);
							this.form.addControl(formControlName, control);
						}
					}
				})
			);

			this.form.addControl(p.valueControl, valueControl);
			this.form.addControl(p.valueTypeControl, typeControl);
		}
	}

	private getPossibleCommands (): void {
		if (this.isCommandInvalid)
			return;

		this.currentAutomata = new Automata(this.currentCommand.trim());
		this.commandVariableNames = this.currentAutomata.getVariablesNames();
		this.commandRestrictedVariableNames = this.currentAutomata.getRestrictedVariablesNames();

		for (const p of this.parameters) {
			const selectedType = this.form.get(p.valueTypeControl)?.value as CommandParameterTypes | null;
			if (selectedType !== CommandParameterTypes.VARIABLE && selectedType !== CommandParameterTypes.RESTRICTED_VARIABLE)
				continue;

			const selectedVariable = this.form.get(p.valueControl)?.value as string | null;
			if (!selectedVariable)
				continue;

			if (selectedType === CommandParameterTypes.VARIABLE) {
				if (!this.commandVariableNames.includes(selectedVariable))
					this.form.get(p.valueControl)?.setValue(null);

				continue;
			}

			if (!this.commandRestrictedVariableNames.includes(selectedVariable) || !p.restrictedVariableOptions) {
				this.form.get(p.valueControl)?.setValue(null);
				continue;
			}

			const previousValues: Record<string, string | null> = {};
			for (const o of p.restrictedVariableOptions)
				previousValues[o.automataOption] = this.form.get(o.formControlName)?.value;

			const options = this.currentAutomata.getRestrictedVariableOptions(selectedVariable);
			for (let idx = 0; idx < options.length; idx++) {
				const formControlName = p.valueControl + "-" + idx;

				// Update existing options
				if (p.restrictedVariableOptions[idx]) {
					if (options[idx] in previousValues)
						this.form.get(formControlName)?.setValue(previousValues[options[idx]]);

					p.restrictedVariableOptions[idx].automataOption = options[idx];
					continue;
				}

				// Add new options
				p.restrictedVariableOptions.push({
					automataOption: options[idx],
					formControlName
				});

				const control = new FormControl<string | null>(previousValues[options[idx]], Validators.required);
				this.form.addControl(formControlName, control);
			}

			// Remove previous options
			for (let i = options.length; i < p.restrictedVariableOptions.length; i++)
				this.form.removeControl(p.restrictedVariableOptions[i].formControlName);

			p.restrictedVariableOptions.splice(options.length);
		}

		this.possibleCommands = this.currentAutomata
			.getAllPossibilities()
			.sort()
			.map(c => c.replace(/\{/g, "<span class='variable-text'>{").replace(/\}/g, "}</span>"));
	}
}

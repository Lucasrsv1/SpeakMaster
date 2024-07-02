import { ActivatedRoute } from "@angular/router";
import { MatIcon } from "@angular/material/icon";
import { Component, effect, ElementRef, input, OnDestroy, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { NgFor, NgIf } from "@angular/common";

import { NgScrollbar } from "ngx-scrollbar";
import { ToastrService } from "ngx-toastr";

import { Subscription } from "rxjs";

import { CheckboxComponent } from "../../../../components/checkbox/checkbox.component";

import { IAmbiguity } from "../../../../models/ambiguity";
import { ICommandResult } from "../../../../models/command-result";

import { AmbiguityService } from "../../../../services/ambiguity/ambiguity.service";
import { CommandCenterService } from "../../../../services/command-center/command-center.service";
import { CommandParametersService } from "../../../../services/command-parameters/command-parameters.service";
import { CommandsService } from "../../../../services/commands/commands.service";
import { SpeechRecognitionService } from "../../../../services/speech-recognition/speech-recognition.service";

@Component({
	selector: "app-module-ambiguities",
	standalone: true,
	imports: [
		CheckboxComponent,
		FormsModule,
		MatIcon,
		NgFor,
		NgIf,
		NgScrollbar,
		ReactiveFormsModule
	],
	templateUrl: "./ambiguities.component.html",
	styleUrl: "./ambiguities.component.scss"
})
export class AmbiguitiesComponent implements OnDestroy {
	@ViewChild("commandInput")
	private commandInput?: ElementRef<any>;

	public commandToEdit = input<{ command: string }>();

	public form: FormGroup;
	public ambiguousCommand: ICommandResult | null = null;
	public ambiguities: IAmbiguity[] = [];

	private commandSent: boolean = false;
	private commandHistoryIndex: number = -1;
	private commandHistory: string[] = [];
	private subscriptions: Subscription[] = [];

	constructor (
		public readonly speechRecognitionService: SpeechRecognitionService,
		private readonly route: ActivatedRoute,
		private readonly formBuilder: FormBuilder,
		private readonly toastr: ToastrService,
		private readonly ambiguityService: AmbiguityService,
		private readonly commandCenterService: CommandCenterService,
		private readonly commandParametersService: CommandParametersService,
		private readonly commandsService: CommandsService
	) {
		this.form = this.formBuilder.group({
			command: ["", Validators.required]
		});

		effect(() => {
			if (!this.commandToEdit()?.command)
				return;

			this.form.get("command")?.setValue(this.commandToEdit()?.command);
			this.commandInput?.nativeElement.focus();
		});

		const idModule = Number(this.route.snapshot.paramMap.get("idModule"));
		this.subscriptions.push(
			this.ambiguityService.$moduleAmbiguousCommand(idModule).subscribe(ambiguousCommand => {
				this.ambiguousCommand = ambiguousCommand;

				if (!ambiguousCommand || typeof ambiguousCommand.result === "boolean") {
					this.ambiguities = [];
				} else {
					this.ambiguities = ambiguousCommand.result.options;
					this.ambiguityService.clearNotification(ambiguousCommand.idModule);
				}
			}),

			this.commandsService.$lastUniqueCommands.subscribe(
				commands => this.commandHistory = commands
			)
		);
	}

	public get placeholder (): string {
		if (this.commandSent)
			return "Comando enviado!";

		if (this.speechRecognitionService.isMicOn)
			return "Fale um comando ou o digite aqui para executá-lo";

		return "Ative o microfone para falar um comando ou o digite aqui para executá-lo";
	}

	public ngOnDestroy (): void {
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
	}

	public clearForm (): void {
		this.form.reset();
		this.commandInput?.nativeElement.focus();
		this.commandHistoryIndex = -1;
	}

	public submitCommand (): void {
		if (this.form.invalid)
			return;

		this.commandsService.sendCommand(this.form.get("command")?.value);
		this.commandHistoryIndex = -1;
		this.commandSent = true;
		setTimeout(() => this.commandSent = false, 2000);
		this.form.reset();
	}

	public select (selectedAmbiguity: IAmbiguity): void {
		// Não faz nada nos cenários em que não ocorreu uma ambiguidade
		if (!this.ambiguousCommand || typeof this.ambiguousCommand.result === "boolean")
			return;

		for (const ambiguity of this.ambiguities)
			ambiguity.isSelected = ambiguity === selectedAmbiguity;

		// Gera o objeto de parâmetros com base na opção selecionada para resolver a ambiguidade
		const parameters = this.commandParametersService.mergeAmbiguityParameters(
			selectedAmbiguity.value,
			this.ambiguousCommand.result.parameters
		);

		this.commandCenterService.sendCommandToModule(
			this.ambiguousCommand.idModule, this.ambiguousCommand.featureIdentifier, parameters
		);

		this.toastr.info("Comando enviado.");
	}

	public previousInput (): void {
		this.commandHistoryIndex = Math.min(this.commandHistoryIndex + 1, this.commandHistory.length - 1);
		this.form.get("command")?.setValue(this.commandHistory[this.commandHistoryIndex]);
	}

	public nextInput (): void {
		this.commandHistoryIndex = Math.max(this.commandHistoryIndex - 1, -1);
		if (this.commandHistoryIndex === -1)
			this.form.get("command")?.setValue("");
		else
			this.form.get("command")?.setValue(this.commandHistory[this.commandHistoryIndex]);
	}
}

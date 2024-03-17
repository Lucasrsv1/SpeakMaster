import { MatIcon } from "@angular/material/icon";
import { Component, effect, ElementRef, input, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { NgFor, NgIf } from "@angular/common";

import { NgScrollbar } from "ngx-scrollbar";

import { CheckboxComponent } from "../../../../components/checkbox/checkbox.component";

import { IAmbiguity } from "../../../../models/ambiguity";

import { CommandsService } from "../../../../services/commands/commands.service";

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
export class AmbiguitiesComponent {
	@ViewChild("commandInput")
	private commandInput?: ElementRef<any>;

	public commandToEdit = input<{ command: string }>();

	public form: FormGroup;
	public isMicOn: boolean = false;

	public ambiguities: IAmbiguity[] = [
		{ image: "https://images.macrumors.com/t/vMbr05RQ60tz7V_zS5UEO9SbGR0=/1600x900/smart/article-new/2018/05/apple-music-note.jpg", description: "Porta Aberta de Luka", secondaryInfo: "3:42" },
		{ image: "https://images.macrumors.com/t/vMbr05RQ60tz7V_zS5UEO9SbGR0=/1600x900/smart/article-new/2018/05/apple-music-note.jpg", description: "Porta Aberta de Luiz Ayrao", secondaryInfo: "3:38" },
		{ image: "https://images.macrumors.com/t/vMbr05RQ60tz7V_zS5UEO9SbGR0=/1600x900/smart/article-new/2018/05/apple-music-note.jpg", description: "Porta Aberta de Belo", secondaryInfo: "3:51" },
		{ image: "https://images.macrumors.com/t/vMbr05RQ60tz7V_zS5UEO9SbGR0=/1600x900/smart/article-new/2018/05/apple-music-note.jpg", description: "Porta Aberta - Ao Vivo de Bruno & Barretto", secondaryInfo: "3:05" },
		{ image: "https://images.macrumors.com/t/vMbr05RQ60tz7V_zS5UEO9SbGR0=/1600x900/smart/article-new/2018/05/apple-music-note.jpg", description: "Porta Aberta de Luka", secondaryInfo: "3:42" },
		{ image: "https://images.macrumors.com/t/vMbr05RQ60tz7V_zS5UEO9SbGR0=/1600x900/smart/article-new/2018/05/apple-music-note.jpg", description: "Porta Aberta de Luiz Ayrao", secondaryInfo: "3:38" },
		{ image: "https://images.macrumors.com/t/vMbr05RQ60tz7V_zS5UEO9SbGR0=/1600x900/smart/article-new/2018/05/apple-music-note.jpg", description: "Porta Aberta de Belo", secondaryInfo: "3:51" },
		{ image: "https://images.macrumors.com/t/vMbr05RQ60tz7V_zS5UEO9SbGR0=/1600x900/smart/article-new/2018/05/apple-music-note.jpg", description: "Porta Aberta - Ao Vivo de Bruno & Barretto", secondaryInfo: "3:05" },
		{ image: "https://images.macrumors.com/t/vMbr05RQ60tz7V_zS5UEO9SbGR0=/1600x900/smart/article-new/2018/05/apple-music-note.jpg", description: "Porta Aberta de Luka", secondaryInfo: "3:42" },
		{ image: "https://images.macrumors.com/t/vMbr05RQ60tz7V_zS5UEO9SbGR0=/1600x900/smart/article-new/2018/05/apple-music-note.jpg", description: "Porta Aberta de Luiz Ayrao", secondaryInfo: "3:38" },
		{ image: "https://images.macrumors.com/t/vMbr05RQ60tz7V_zS5UEO9SbGR0=/1600x900/smart/article-new/2018/05/apple-music-note.jpg", description: "Porta Aberta de Belo", secondaryInfo: "3:51" },
		{ image: "https://images.macrumors.com/t/vMbr05RQ60tz7V_zS5UEO9SbGR0=/1600x900/smart/article-new/2018/05/apple-music-note.jpg", description: "Porta Aberta - Ao Vivo de Bruno & Barretto", secondaryInfo: "3:05" }
	];

	private commandSent: boolean = false;

	constructor (
		private readonly formBuilder: FormBuilder,
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
	}

	public get placeholder (): string {
		if (this.commandSent)
			return "Comando enviado!";

		if (this.isMicOn)
			return "Fale um comando ou o digite aqui para executá-lo";

		return "Ative o microfone para falar um comando ou o digite aqui para executá-lo";
	}

	public toggleMic (): void {
		this.isMicOn = !this.isMicOn;
	}

	public clearForm (): void {
		this.form.reset();
		this.commandInput?.nativeElement.focus();
	}

	public submitCommand (): void {
		if (this.form.invalid)
			return;

		this.commandsService.sendCommand(this.form.get("command")?.value);
		this.commandSent = true;
		setTimeout(() => this.commandSent = false, 2000);
		this.form.reset();
	}

	public select (selectedAmbiguity: IAmbiguity): void {
		for (const ambiguity of this.ambiguities)
			ambiguity.isSelected = ambiguity === selectedAmbiguity;

		console.log("SELECTED:", selectedAmbiguity);
	}
}

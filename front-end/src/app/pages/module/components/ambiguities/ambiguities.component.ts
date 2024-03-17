import { Component } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { NgFor, NgIf } from "@angular/common";

import { NgScrollbar } from "ngx-scrollbar";

import { CheckboxComponent } from "../../../../components/checkbox/checkbox.component";

import { IAmbiguity } from "../../../../models/ambiguity";

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

	constructor (
		private readonly formBuilder: FormBuilder
	) {
		this.form = this.formBuilder.group({
			command: ["", Validators.required]
		});
	}

	public get placeholder (): string {
		if (this.isMicOn)
			return "Fale um comando ou o digite aqui para executá-lo";

		return "Ative o microfone para falar um comando ou o digite aqui para executá-lo";
	}

	public toggleMic (): void {
		this.isMicOn = !this.isMicOn;
	}

	public submitCommand (): void {
		if (this.form.invalid)
			return;

		console.log("Send Command:", this.form.get("command")?.value);
	}

	public select (selectedAmbiguity: IAmbiguity): void {
		for (const ambiguity of this.ambiguities)
			ambiguity.isSelected = ambiguity === selectedAmbiguity;

		console.log("SELECTED:", selectedAmbiguity);
	}
}

import { Component } from "@angular/core";
import { TitleService } from "../../services/title/title.service";

@Component({
	selector: "app-about",
	standalone: true,
	imports: [],
	templateUrl: "./about.component.html",
	styleUrl: "./about.component.scss"
})
export class AboutComponent {
	constructor (private readonly titleService: TitleService) {
		this.titleService.setTitle("Sobre");
	}
}

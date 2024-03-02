import { Component } from "@angular/core";
import { TitleService } from "../../services/title/title.service";

@Component({
	selector: "app-profile",
	standalone: true,
	imports: [],
	templateUrl: "./profile.component.html",
	styleUrl: "./profile.component.scss"
})
export class ProfileComponent {
	constructor (private readonly titleService: TitleService) {
		this.titleService.setTitle("Preferências de Usuário");
	}
}

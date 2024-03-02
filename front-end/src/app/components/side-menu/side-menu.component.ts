import { Component } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { NgFor, NgIf } from "@angular/common";
import { RouterLink, RouterLinkActive } from "@angular/router";

import { NgScrollbarModule } from "ngx-scrollbar";

import { environment } from "../../../environments/environment";

import { IUserModule } from "../../models/userModule";

@Component({
	selector: "app-side-menu",
	standalone: true,
	imports: [
		MatIcon,
		NgFor,
		NgIf,
		NgScrollbarModule,
		RouterLink,
		RouterLinkActive
	],
	templateUrl: "./side-menu.component.html",
	styleUrl: "./side-menu.component.scss"
})
export class SideMenuComponent {
	public version = environment.version;

	public userModules: IUserModule[] = [
		{ name: "Controle do Spotify", isActive: true, hasNotifications: true },
		{ name: "Teclado e Mouse", isActive: false, hasNotifications: false },
		{ name: "Controle do Windows", isActive: true, hasNotifications: false }
	];

	constructor () { }

	public toggleModule (event: MouseEvent, module: IUserModule): void {
		event.preventDefault();
		event.stopPropagation();
		console.log("Toggle module clicked");
		module.isActive = !module.isActive;
	}

	public goToModuleSettings (event: MouseEvent, module: IUserModule): void {
		event.preventDefault();
		event.stopPropagation();
		console.log("Go to module settings clicked", module.name);
	}
}

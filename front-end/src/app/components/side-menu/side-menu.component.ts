import { Component } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { NgFor, NgIf } from "@angular/common";
import { RouterLink, RouterLinkActive } from "@angular/router";

import { NgScrollbarModule } from "ngx-scrollbar";

import { environment } from "../../../environments/environment";

import { IUserModule } from "../../models/userModule";
import { UserModulesService } from "../../services/user-modules/user-modules.service";

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
	styleUrls: [
		"./side-menu.component.scss",
		"../../shared/checkbox.scss"
	]
})
export class SideMenuComponent {
	public version = environment.version;

	constructor (private readonly userModulesService: UserModulesService) { }

	public get userModules (): IUserModule[] {
		return this.userModulesService.userModules || [];
	}

	public toggleModule (event: MouseEvent, module: IUserModule): void {
		event.preventDefault();
		event.stopPropagation();

		module.isActive = !module.isActive;
		this.userModulesService.toggleActive(module);
	}

	public goToModuleSettings (event: MouseEvent, module: IUserModule): void {
		event.preventDefault();
		event.stopPropagation();
		console.log("Go to module settings clicked", module.name);
	}
}

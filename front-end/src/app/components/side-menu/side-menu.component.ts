import { Component } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { AsyncPipe, NgFor, NgIf } from "@angular/common";
import { RouterLink, RouterLinkActive } from "@angular/router";

import { NgScrollbarModule } from "ngx-scrollbar";
import { TooltipModule } from "ngx-bootstrap/tooltip";

import { BehaviorSubject } from "rxjs";

import { environment } from "../../../environments/environment";

import { CheckboxComponent } from "../checkbox/checkbox.component";
import { LedComponent } from "../led/led.component";

import { IUserModule } from "../../models/userModule";

import { AmbiguityService } from "../../services/ambiguity/ambiguity.service";
import { CommandCenterService } from "../../services/command-center/command-center.service";
import { UserModulesService } from "../../services/user-modules/user-modules.service";

@Component({
	selector: "app-side-menu",
	standalone: true,
	imports: [
		AsyncPipe,
		CheckboxComponent,
		LedComponent,
		MatIcon,
		NgFor,
		NgIf,
		NgScrollbarModule,
		RouterLink,
		RouterLinkActive,
		TooltipModule
	],
	templateUrl: "./side-menu.component.html",
	styleUrl: "./side-menu.component.scss"
})
export class SideMenuComponent {
	public version = environment.version;

	constructor (
		private readonly ambiguityService: AmbiguityService,
		private readonly commandCenterService: CommandCenterService,
		private readonly userModulesService: UserModulesService
	) { }

	public get userModules (): IUserModule[] {
		return this.userModulesService.userModules || [];
	}

	public getModuleConnectionStatus (module: IUserModule): BehaviorSubject<boolean> {
		return this.commandCenterService.$isModuleConnected(module.idModule);
	}

	public getModuleAmbiguityNotification (module: IUserModule): BehaviorSubject<boolean> {
		return this.ambiguityService.$moduleAmbiguityNotification(module.idModule);
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

import { Component } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { ActivatedRoute, Router } from "@angular/router";

import { CollapseModule } from "ngx-bootstrap/collapse";
import { TabsModule } from "ngx-bootstrap/tabs";
import { ToastrService } from "ngx-toastr";

import { AmbiguitiesComponent } from "./components/ambiguities/ambiguities.component";
import { CommandsComponent } from "./components/commands/commands.component";
import { LastCommandsComponent } from "./components/last-commands/last-commands.component";
import { SettingsComponent } from "./components/settings/settings.component";

import { IUserModule } from "../../models/userModule";

import { TitleService } from "../../services/title/title.service";
import { UserModulesService } from "../../services/user-modules/user-modules.service";

@Component({
	selector: "app-module",
	standalone: true,
	imports: [
		CollapseModule,
		MatIcon,
		TabsModule,

		// Internal page components
		AmbiguitiesComponent,
		CommandsComponent,
		LastCommandsComponent,
		SettingsComponent
	],
	templateUrl: "./module.component.html",
	styleUrl: "./module.component.scss"
})
export class ModuleComponent {
	public isModuleCardCollapsed: boolean = false;
	public isVoiceCardCollapsed: boolean = false;

	public module?: IUserModule;

	constructor (
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly toastr: ToastrService,
		private readonly titleService: TitleService,
		private readonly userModulesService: UserModulesService
	) {
		const idModule = Number(this.route.snapshot.paramMap.get("idModule"));
		const module = this.userModulesService.userModules?.find(um => um.idUserModule === idModule);

		if (!module) {
			this.router.navigate(["installed-modules"]);
			this.toastr.warning("Módulo não encontrado.", "Erro!");
			return;
		}

		this.module = module;
		this.titleService.setTitle(this.module.name);
	}
}

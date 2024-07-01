import { MatIcon } from "@angular/material/icon";
import { ActivatedRoute, Router } from "@angular/router";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";

import { CollapseModule } from "ngx-bootstrap/collapse";
import { ToastrService } from "ngx-toastr";
import { TabsetComponent, TabsModule } from "ngx-bootstrap/tabs";

import { Subscription } from "rxjs";

import { AmbiguitiesComponent } from "./components/ambiguities/ambiguities.component";
import { CommandsComponent } from "./components/commands/commands.component";
import { LastCommandsComponent } from "./components/last-commands/last-commands.component";
import { SettingsComponent } from "./components/settings/settings.component";

import { IUserModule } from "../../models/user-module";

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
export class ModuleComponent implements OnInit, OnDestroy {
	@ViewChild("commandsTabs", { static: true })
	private commandsTabs?: TabsetComponent;

	@ViewChild("managementTabs", { static: true })
	private managementTabs?: TabsetComponent;

	public commandToEdit: { command: string } = { command: "" };

	public isModuleCardCollapsed: boolean = false;
	public isVoiceCardCollapsed: boolean = false;

	public module?: IUserModule;

	private subscription?: Subscription;

	constructor (
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly toastr: ToastrService,
		private readonly titleService: TitleService,
		private readonly userModulesService: UserModulesService
	) {
		const idModule = Number(this.route.snapshot.paramMap.get("idModule"));
		const module = this.userModulesService.userModules?.find(um => um.idModule === idModule);

		if (!module) {
			this.router.navigate(["installed-modules"]);
			this.toastr.warning("Módulo não encontrado.", "Erro!");
			return;
		}

		this.module = module;
		this.titleService.setTitle(this.module.name);
	}

	public ngOnInit (): void {
		this.subscription = this.route.fragment.subscribe(fragment => {
			switch (fragment) {
				case "ambiguities":
					this.commandsTabs!.tabs[0].active = true;
					break;
				case "last-commands":
					this.commandsTabs!.tabs[1].active = true;
					break;
				case "commands":
					this.managementTabs!.tabs[0].active = true;
					break;
				case "settings":
					this.managementTabs!.tabs[1].active = true;
					break;
			}
		});
	}

	public ngOnDestroy (): void {
		this.subscription?.unsubscribe();
	}

	public editCommand (command: string): void {
		this.commandToEdit = { command };
		this.commandsTabs!.tabs[0].active = true;
	}
}

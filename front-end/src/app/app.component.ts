import { Component } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { NgIf } from "@angular/common";
import { Router, RouterOutlet } from "@angular/router";

import { BlockUIModule } from "ng-block-ui";

import { FooterComponent } from "./components/footer/footer.component";
import { HeaderComponent } from "./components/header/header.component";
import { SideMenuComponent } from "./components/side-menu/side-menu.component";

import { AuthenticationService } from "./services/authentication/authentication.service";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [
		NgIf,
		BlockUIModule,
		FooterComponent,
		HeaderComponent,
		MatIcon,
		RouterOutlet,
		SideMenuComponent
	],
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss"
})
export class AppComponent {
	public disableMenu: boolean = false;
	public menuCollapsed: boolean = false;

	constructor (
		private readonly router: Router,
		private readonly authenticationService: AuthenticationService
	) {
		this.router.events.subscribe(_ => {
			this.disableMenu = !this.authenticationService.isLoggedIn();
		});
	}

	public collapseChange (collapsed: boolean) {
		this.menuCollapsed = collapsed;
	}
}

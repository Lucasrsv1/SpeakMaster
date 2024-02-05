import { Component } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { Router, RouterOutlet } from "@angular/router";

import { BlockUIModule } from "ng-block-ui";

import { FooterComponent } from "./components/footer/footer.component";
import { HeaderComponent } from "./components/header/header.component";
import { SideMenuComponent } from "./components/side-menu/side-menu.component";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [
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
	public menuCollapsed: boolean = false;
	public isLogin: boolean = false;

	constructor (private router: Router) {
		this.router.events.subscribe(_ => {
			this.isLogin = this.router.url.substring(1).indexOf("login") === 0;
		});
	}

	public collapseChange (collapsed: boolean) {
		this.menuCollapsed = collapsed;
	}
}

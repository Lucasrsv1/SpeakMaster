import { MatIcon } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";

import { BsDropdownModule } from "ngx-bootstrap/dropdown";

import { getDefaultLanguage, ILanguage, languages } from "../../models/languages";

import { AuthenticationService } from "../../services/authentication/authentication.service";

@Component({
	selector: "app-header",
	standalone: true,
	imports: [NgFor, NgIf, MatIcon, RouterLink, BsDropdownModule],
	templateUrl: "./header.component.html",
	styleUrls: ["./header.component.scss"]
})
export class HeaderComponent implements OnInit {
	@Input()
	public disableMenu: boolean = false;

	@Output()
	public collapseChange = new EventEmitter<boolean>();

	public username: string = "";
	public currentLanguage: string = "";
	public isMicOn: boolean = false;
	public isLoggedIn: boolean = false;

	public isMenuCollapsed = false;
	public languages: ILanguage[] = languages;

	constructor (
		private readonly authenticationService: AuthenticationService
	) {
		this.authenticationService.$loggedUser.subscribe(user => {
			this.isLoggedIn = this.authenticationService.isLoggedIn();

			if (this.isLoggedIn && user) {
				this.username = this.getShortName(user.name);
				this.currentLanguage = user.interfaceLanguage;
				this.isMicOn = user.micOnByDefault;
			} else {
				this.username = "";
				this.currentLanguage = getDefaultLanguage();
				this.isMicOn = false;
			}
		});
	}

	public ngOnInit (): void {
		this.collapseChange.emit(this.isMenuCollapsed);
	}

	public collapse (): void {
		this.isMenuCollapsed = !this.isMenuCollapsed;
		this.collapseChange.emit(this.isMenuCollapsed);
	}

	public logout (): void {
		this.authenticationService.signOut();
	}

	public toggleMic (): void {
		this.isMicOn = !this.isMicOn;
	}

	public setLanguage (selected: ILanguage): void {
		console.log("Set default language to:", selected);
		this.currentLanguage = selected.code;
	}

	private getShortName (name: string): string {
		const names = name.split(" ");
		if (names.length === 1) return names[0];

		const initials = names.slice(1, -1).map(n => `${n[0]}.`).join(" ");
		return `${names[0]} ${initials} ${names.slice(-1)[0]}`;
	}
}

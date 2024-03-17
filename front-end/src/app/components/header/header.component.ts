import { MatIcon } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";

import { BsDropdownModule } from "ngx-bootstrap/dropdown";

import { Subscription } from "rxjs";

import { getDefaultLanguage, ILanguage, languages } from "../../models/languages";

import { AuthenticationService } from "../../services/authentication/authentication.service";
import { LanguageCommandsService } from "../../services/language-commands/language-commands.service";
import { TitleService } from "../../services/title/title.service";

@Component({
	selector: "app-header",
	standalone: true,
	imports: [BsDropdownModule, MatIcon, NgFor, NgIf, RouterLink],
	templateUrl: "./header.component.html",
	styleUrls: ["./header.component.scss"]
})
export class HeaderComponent implements OnInit, OnDestroy {
	@Input()
	public disableMenu: boolean = false;

	@Output()
	public collapseChange = new EventEmitter<boolean>();

	public username: string = "";
	public currentLanguage: string = "";
	public isMicOn: boolean = false;
	public isLoggedIn: boolean = false;

	public pageTitle = "";
	public isMenuCollapsed = innerWidth < 768;
	public spokenLanguages: ILanguage[] = [];

	private subscriptions: Subscription[] = [];

	constructor (
		private readonly titleService: TitleService,
		private readonly authenticationService: AuthenticationService,
		private readonly languageCommandsService: LanguageCommandsService
	) {
		this.subscriptions.push(
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
			})
		);

		this.subscriptions.push(
			this.languageCommandsService.$languageCommands.subscribe(languageCommands => {
				const spokenLanguagesCodes = languageCommands?.languagesToListen || [];
				this.spokenLanguages = languages.filter(language => spokenLanguagesCodes.includes(language.code));

				if (this.spokenLanguages.length && !this.spokenLanguages.find(l => l.code === this.currentLanguage))
					this.currentLanguage = this.spokenLanguages[0].code;
			})
		);

		this.subscriptions.push(
			this.titleService.$title.subscribe(title => {
				this.pageTitle = title;
			})
		);
	}

	public ngOnInit (): void {
		this.collapseChange.emit(this.isMenuCollapsed);
	}

	public ngOnDestroy (): void {
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
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

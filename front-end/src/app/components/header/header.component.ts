import { MatIcon } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { AsyncPipe, NgFor, NgIf } from "@angular/common";
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";

import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { TooltipModule } from "ngx-bootstrap/tooltip";

import { Subscription } from "rxjs";

import { LedComponent } from "../led/led.component";

import { ILanguage, languages } from "../../models/languages";

import { AuthenticationService } from "../../services/authentication/authentication.service";
import { CommandCenterService } from "../../services/command-center/command-center.service";
import { LanguageCommandsService } from "../../services/language-commands/language-commands.service";
import { SpeechRecognitionService } from "../../services/speech-recognition/speech-recognition.service";
import { TitleService } from "../../services/title/title.service";

@Component({
	selector: "app-header",
	standalone: true,
	imports: [
		AsyncPipe,
		BsDropdownModule,
		LedComponent,
		MatIcon,
		NgFor,
		NgIf,
		RouterLink,
		TooltipModule
	],
	templateUrl: "./header.component.html",
	styleUrls: ["./header.component.scss"]
})
export class HeaderComponent implements OnInit, OnDestroy {
	@Input()
	public disableMenu: boolean = false;

	@Output()
	public collapseChange = new EventEmitter<boolean>();

	public username: string = "";
	public isLoggedIn: boolean = false;

	public pageTitle = "";
	public isMenuCollapsed = innerWidth < 768;
	public spokenLanguages: ILanguage[] = [];

	private subscriptions: Subscription[] = [];

	constructor (
		public readonly commandCenterService: CommandCenterService,
		public readonly speechRecognitionService: SpeechRecognitionService,
		private readonly authenticationService: AuthenticationService,
		private readonly languageCommandsService: LanguageCommandsService,
		private readonly titleService: TitleService
	) {
		this.subscriptions.push(
			this.authenticationService.loggedUser$.subscribe(user => {
				this.isLoggedIn = this.authenticationService.isLoggedIn();

				if (this.isLoggedIn && user)
					this.username = this.getShortName(user.name);
				else
					this.username = "";
			}),

			this.languageCommandsService.languageCommands$.subscribe(languageCommands => {
				const spokenLanguagesCodes = languageCommands?.languagesToListen || [];
				this.spokenLanguages = languages.filter(language => spokenLanguagesCodes.includes(language.code));
			}),

			this.titleService.title$.subscribe(title => this.pageTitle = title)
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

	public setLanguage (selected: ILanguage): void {
		this.speechRecognitionService.currentLanguage = selected.code;
		if (this.speechRecognitionService.isMicOn)
			this.speechRecognitionService.listenLanguage();
	}

	private getShortName (name: string): string {
		const names = name.split(" ");
		if (names.length === 1) return names[0];

		const initials = names.slice(1, -1).map(n => `${n[0]}.`).join(" ");
		return `${names[0]} ${initials} ${names.slice(-1)[0]}`;
	}
}

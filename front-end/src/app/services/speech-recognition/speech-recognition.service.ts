import { Injectable, NgZone, OnDestroy } from "@angular/core";

import { ToastrService } from "ngx-toastr";

import { Subscription } from "rxjs";

import { LanguageCode } from "speakmaster-module-builder";

import { getDefaultLanguage, languages } from "../../models/languages";

import { AuthenticationService } from "../authentication/authentication.service";
import { CommandsService } from "../commands/commands.service";
import { LanguageCommandsService } from "../language-commands/language-commands.service";
import { UtilsService } from "../utils/utils.service";

@Injectable({ providedIn: "root" })
export class SpeechRecognitionService implements OnDestroy {
	public currentLanguage: LanguageCode = LanguageCode.EN_US;

	private _isMicOn: boolean = false;
	private keepListening: boolean;
	private speechRecognition?: SpeechRecognition;
	private subscriptions: Subscription[] = [];

	constructor (
		private readonly ngZone: NgZone,
		private readonly authenticationService: AuthenticationService,
		private readonly commandsService: CommandsService,
		private readonly languageCommandsService: LanguageCommandsService,
		private readonly toastr: ToastrService,
		private readonly utilsService: UtilsService
	) {
		this.keepListening = false;

		if (typeof SpeechRecognition !== "undefined") {
			this.speechRecognition = new SpeechRecognition();
		} else if (typeof webkitSpeechRecognition !== "undefined") {
			this.speechRecognition = new webkitSpeechRecognition();
		} else {
			this.speechRecognitionNotAvailable();
			return;
		}

		this.speechRecognition.continuous = true;
		this.speechRecognition.interimResults = false;

		this.speechRecognition.onresult = event => {
			this.ngZone.run(this.speechResult, this, [event]);
		};

		this.speechRecognition.onend = _ => {
			this.ngZone.run(this.speechEnd, this);
		};

		this.speechRecognition.onerror = event => {
			this.ngZone.run(this.speechError, this, [event]);
		};

		this.subscriptions.push(
			this.authenticationService.$loggedUser.subscribe(user => {
				if (this.authenticationService.isLoggedIn() && user) {
					this.currentLanguage = user.interfaceLanguage;

					if (user.micOnByDefault)
						this.listenLanguage();
					else
						this.stopListening();
				} else {
					this.currentLanguage = getDefaultLanguage();
					this.stopListening();
				}
			}),

			this.languageCommandsService.$languageCommands.subscribe(languageCommands => {
				const spokenLanguagesCodes = languageCommands?.languagesToListen || [];
				const spokenLanguages = languages.filter(language => spokenLanguagesCodes.includes(language.code));

				if (spokenLanguages.length && !spokenLanguages.find(l => l.code === this.currentLanguage))
					this.currentLanguage = spokenLanguages[0].code;
			}),

			this.commandsService.$commandToChangeLanguage.subscribe(language => {
				if (language) {
					this.currentLanguage = language;
					this.listenLanguage();
				}
			})
		);
	}

	public get isMicOn (): boolean {
		return this._isMicOn;
	}

	private set isMicOn (value: boolean) {
		this._isMicOn = value;
	}

	public ngOnDestroy (): void {
		this.stopListening();
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
	}

	public toggleMic (): void {
		if (this.isMicOn)
			this.stopListening();
		else
			this.listenLanguage();
	}

	public async listenLanguage (): Promise<void> {
		if (!this.speechRecognition)
			return this.speechRecognitionNotAvailable();

		if (this.isMicOn) {
			this.stopListening();
			await this.utilsService.sleep(200);
		}

		this.keepListening = true;
		this.speechRecognition.lang = this.currentLanguage;

		this.isMicOn = true;
		this.speechRecognition.start();
	}

	public stopListening (): void {
		if (!this.speechRecognition) return;

		this.keepListening = false;
		this.isMicOn = false;
		this.speechRecognition.stop();
	}

	private speechResult (event: SpeechRecognitionEvent): void {
		const result = event.results[event.results.length - 1];
		if (result.isFinal)
			this.commandsService.sendCommand(result[0].transcript);
	}

	private speechEnd (): void {
		if (this.keepListening) {
			this.isMicOn = true;
			this.speechRecognition!.start();
		}
	}

	private speechError (event: SpeechRecognitionErrorEvent): void {
		if (event.error === "network") {
			this.keepListening = false;
			this.speechRecognitionNotAvailable();
		}

		this.isMicOn = false;
		this.speechRecognition!.stop();
	}

	private speechRecognitionNotAvailable (): void {
		if (!this.speechRecognition) {
			this.toastr.error(
				"Para usar os comandos de voz, utilize um browser capaz de transcrever fala em texto, como o Google Chrome e o Microsoft Edge.",
				"O seu browser não suporta reconhecimento de fala.",
				{ disableTimeOut: true }
			);
		} else {
			this.toastr.warning(
				"Para usar os comandos de voz, utilize um browser capaz de transcrever fala em texto, como o Google Chrome e o Microsoft Edge.",
				"O seu browser parece não suportar reconhecimento de fala.",
				{ disableTimeOut: true }
			);
		}
	}
}

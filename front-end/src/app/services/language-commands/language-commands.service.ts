import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";

import { NgBlockUI } from "ng-block-ui";
import { ToastrService } from "ngx-toastr";

import { BehaviorSubject, Subscription } from "rxjs";

import { environment } from "../../../environments/environment";
import { ILanguageCommands } from "../../models/languageCommand";

import { AlertsService } from "../alerts/alerts.service";
import { AuthenticationService } from "../authentication/authentication.service";
import { LocalStorageKey, LocalStorageService } from "../local-storage/local-storage.service";

@Injectable({ providedIn: "root" })
export class LanguageCommandsService implements OnDestroy {
	public $languageCommands = new BehaviorSubject<ILanguageCommands | null>(null);
	public $updateFailed = new BehaviorSubject<boolean>(false);

	private subscription: Subscription;

	constructor (
		private readonly http: HttpClient,
		private readonly toastr: ToastrService,
		private readonly alertsService: AlertsService,
		private readonly authenticationService: AuthenticationService,
		private readonly localStorage: LocalStorageService
	) {
		this.subscription = this.authenticationService.$loggedUser.subscribe(user => {
			if (!user)
				return this.localStorage.delete(LocalStorageKey.LANGUAGE_COMMANDS);

			if (!this.localStorage.hasKey(LocalStorageKey.LANGUAGE_COMMANDS))
				return this.loadFromServer();

			this.$languageCommands.next(
				JSON.parse(this.localStorage.get(LocalStorageKey.LANGUAGE_COMMANDS))
			);
		});
	}

	public get languageCommands (): ILanguageCommands | null {
		return this.$languageCommands.value;
	}

	public ngOnDestroy (): void {
		this.subscription.unsubscribe();
	}

	public loadFromServer (blockUI?: NgBlockUI): void {
		this.http.get<ILanguageCommands>(
			`${environment.API_URL}/v1/users/language-commands`
		).subscribe({
			next: response => {
				blockUI?.stop();
				this.updateLanguageCommands(response);
			},

			error: (error: HttpErrorResponse) => {
				blockUI?.stop();
				this.alertsService.httpErrorAlert(
					"Falha ao Carregar Comandos",
					"Não foi possível obter os comandos de troca de idioma, tente novamente.",
					error
				);
			}
		});
	}

	public update (languageCommands: ILanguageCommands, blockUI?: NgBlockUI): void {
		this.http.patch<{ message: string }>(
			`${environment.API_URL}/v1/users/language-commands`,
			languageCommands
		).subscribe({
			next: _ => {
				blockUI?.stop();
				this.$updateFailed.next(false);
				this.updateLanguageCommands(languageCommands);
				this.toastr.success("Comandos de troca de idioma atualizados.", "Sucesso!");
			},

			error: (error: HttpErrorResponse) => {
				blockUI?.stop();
				this.$updateFailed.next(true);
				this.alertsService.httpErrorAlert(
					"Falha ao Atualizar Comandos",
					"Não foi possível fazer a atualização dos comandos de troca de idioma, tente novamente.",
					error
				);
			}
		});
	}

	private updateLanguageCommands (languageCommands: ILanguageCommands): void {
		this.localStorage.set(LocalStorageKey.LANGUAGE_COMMANDS, JSON.stringify(languageCommands));
		this.$languageCommands.next(languageCommands);
	}
}

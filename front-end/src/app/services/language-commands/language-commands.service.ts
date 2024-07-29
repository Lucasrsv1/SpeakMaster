import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";

import { NgBlockUI } from "ng-block-ui";
import { ToastrService } from "ngx-toastr";

import { BehaviorSubject, Observable, skip, Subscription, tap } from "rxjs";

import { environment } from "../../../environments/environment";
import { ILanguageCommands } from "../../models/language-command";

import { AlertsService } from "../alerts/alerts.service";
import { AuthenticationService } from "../authentication/authentication.service";
import { LocalStorageKey, LocalStorageService } from "../local-storage/local-storage.service";

@Injectable({ providedIn: "root" })
export class LanguageCommandsService implements OnDestroy {
	public languageCommands$ = new BehaviorSubject<ILanguageCommands | null>(null);
	public updateFailed$ = new BehaviorSubject<boolean>(false);

	private subscription: Subscription;

	constructor (
		private readonly http: HttpClient,
		private readonly toastr: ToastrService,
		private readonly alertsService: AlertsService,
		private readonly authenticationService: AuthenticationService,
		private readonly localStorage: LocalStorageService
	) {
		// Handle first time loading
		if (!this.localStorage.hasKey(LocalStorageKey.LANGUAGE_COMMANDS))
			this.loadFromServer();
		else
			this.loadFromStorage();

		// Ignore first value from BehaviorSubject
		this.subscription = this.authenticationService.loggedUser$
			.pipe(skip(1))
			.subscribe(user => {
				if (!user) {
					this.localStorage.delete(LocalStorageKey.LANGUAGE_COMMANDS);
					this.languageCommands$.next(null);
					return;
				}

				// Every change on the logged user means the possibility of changes on the language commands
				this.loadFromServer();
			});
	}

	public get languageCommands (): ILanguageCommands | null {
		return this.languageCommands$.value;
	}

	public ngOnDestroy (): void {
		this.subscription.unsubscribe();
	}

	public loadFromStorage (): void {
		if (!this.localStorage.hasKey(LocalStorageKey.LANGUAGE_COMMANDS))
			return;

		this.languageCommands$.next(
			JSON.parse(this.localStorage.get(LocalStorageKey.LANGUAGE_COMMANDS))
		);
	}

	public loadFromServer (blockUI?: NgBlockUI): void {
		if (!this.authenticationService.loggedUser) {
			blockUI?.stop();
			return;
		}

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

	public update (languageCommands: ILanguageCommands, blockUI?: NgBlockUI): Observable<{ message: string }> {
		return this.http.patch<{ message: string }>(
			`${environment.API_URL}/v1/users/language-commands`,
			languageCommands
		).pipe(tap({
			next: _ => {
				blockUI?.stop();
				this.updateFailed$.next(false);
				this.updateLanguageCommands(languageCommands);
				this.toastr.success("Comandos de troca de idioma atualizados.", "Sucesso!");
			},

			error: (error: HttpErrorResponse) => {
				blockUI?.stop();
				this.updateFailed$.next(true);
				this.alertsService.httpErrorAlert(
					"Falha ao Atualizar Comandos",
					"Não foi possível fazer a atualização dos comandos de troca de idioma, tente novamente.",
					error
				);
			}
		}));
	}

	private updateLanguageCommands (languageCommands: ILanguageCommands): void {
		this.localStorage.set(LocalStorageKey.LANGUAGE_COMMANDS, JSON.stringify(languageCommands));
		this.languageCommands$.next(languageCommands);
	}
}

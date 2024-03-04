import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";

import { NgBlockUI } from "ng-block-ui";
import { ToastrService } from "ngx-toastr";

import { BehaviorSubject, timer } from "rxjs";

import { environment } from "../../../environments/environment";
import { ILanguageCommands } from "../../models/languageCommand";

import { AlertsService } from "../alerts/alerts.service";
import { LocalStorageKey, LocalStorageService } from "../local-storage/local-storage.service";

@Injectable({ providedIn: "root" })
export class LanguageCommandsService {
	public $languageCommands = new BehaviorSubject<ILanguageCommands | null>(null);

	constructor (
		private readonly http: HttpClient,
		private readonly toastr: ToastrService,
		private readonly alertsService: AlertsService,
		private readonly localStorage: LocalStorageService
	) {
		if (this.localStorage.hasKey(LocalStorageKey.LANGUAGE_COMMANDS)) {
			this.$languageCommands.next(
				JSON.parse(this.localStorage.get(LocalStorageKey.LANGUAGE_COMMANDS))
			);
		} else if (this.localStorage.hasKey(LocalStorageKey.USER)) {
			// Use timer to avoid the following circular dependency injection:
			// AuthenticationService -> LanguageCommandsService -> this.http.get -> RequestInterceptor -> AuthenticationService
			timer(0).subscribe({ next: () => this.load() });
		}
	}

	public get languageCommands (): ILanguageCommands | null {
		return this.$languageCommands.value;
	}

	public load (blockUI?: NgBlockUI): void {
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
				this.updateLanguageCommands(languageCommands);
				this.toastr.success("Comandos de troca de idioma atualizados.", "Sucesso!");
			},

			error: (error: HttpErrorResponse) => {
				blockUI?.stop();
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

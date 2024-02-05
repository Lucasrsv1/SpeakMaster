import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";

import { BehaviorSubject } from "rxjs";

import { jwtDecode } from "jwt-decode";
import { NgBlockUI } from "ng-block-ui";
import { sha512 } from "js-sha512";

import { environment } from "../../../environments/environment";
import { IUser } from "../../models/user";

import { AlertsService } from "../alerts/alerts.service";
import { LocalStorageKey, LocalStorageService } from "../local-storage/local-storage.service";

@Injectable({ providedIn: "root" })
export class AuthenticationService {
	public $loggedClient = new BehaviorSubject<IUser | null>(null);

	constructor (
		private readonly http: HttpClient,
		private readonly router: Router,
		private readonly alertsService: AlertsService,
		private readonly localStorage: LocalStorageService
	) {
		// Usa usuário já logado por meio do token armazenado (caso exista)
		const user = this.getLoggedUser();
		this.$loggedClient.next(user);
	}

	public isLoggedIn (): boolean {
		const user = this.getLoggedUser();
		return Boolean(user && user.idUser && user.idUser > 0);
	}

	public getLoggedUser (): IUser | null {
		const token = this.localStorage.get(LocalStorageKey.USER);
		try {
			return (token ? jwtDecode(token) : null) as IUser;
		} catch (error) {
			return null;
		}
	}

	public login (email: string, password: string, blockUI?: NgBlockUI): void {
		// Faz o hash da senha antes de fazer o login
		password = sha512(password);

		this.http.post<{ token: string }>(
			`${environment.API_URL}/v1/login`,
			{ email, password }
		).subscribe({
			next: response => {
				if (blockUI) blockUI.stop();

				this.localStorage.set(LocalStorageKey.USER, response.token);
				this.router.navigate(["about"]);
				this.$loggedClient.next(this.getLoggedUser());
			},

			error: (error: HttpErrorResponse) => {
				if (blockUI) blockUI.stop();

				this.alertsService.httpErrorAlert(
					"Falha ao Entrar",
					"Não foi possível fazer login, tente novamente.",
					error
				);
			}
		});
	}

	public signUp (user: IUser & { password: string }, blockUI?: NgBlockUI): void {
		user.password = sha512(user.password);

		this.http.post<{ token: string }>(
			`${environment.API_URL}/v1/users`,
			user
		).subscribe({
			next: response => {
				if (blockUI) blockUI.stop();

				this.localStorage.set(LocalStorageKey.USER, response.token);
				this.router.navigate(["about"]);
				this.$loggedClient.next(this.getLoggedUser());
			},

			error: (error: HttpErrorResponse) => {
				if (blockUI) blockUI.stop();

				this.alertsService.httpErrorAlert(
					"Falha ao Cadastrar",
					"Não foi possível fazer o cadastro, tente novamente.",
					error
				);
			}
		});
	}

	public updateProfile (user: IUser & { password?: string }, blockUI?: NgBlockUI): void {
		if (user.password)
			user.password = sha512(user.password);

		this.http.put<{ token: string }>(
			`${environment.API_URL}/v1/users`,
			user
		).subscribe({
			next: response => {
				if (blockUI) blockUI.stop();

				this.localStorage.set(LocalStorageKey.USER, response.token);
				this.router.navigate(["about"]);
				this.$loggedClient.next(this.getLoggedUser());
			},

			error: (error: HttpErrorResponse) => {
				if (blockUI) blockUI.stop();

				this.alertsService.httpErrorAlert(
					"Falha ao Atualizar perfil",
					"Não foi possível fazer a atualização, tente novamente.",
					error
				);
			}
		});
	}

	public signOut (): void {
		this.localStorage.delete(LocalStorageKey.USER);
		this.$loggedClient.next(null);
		this.router.navigate(["login"]);
	}
}

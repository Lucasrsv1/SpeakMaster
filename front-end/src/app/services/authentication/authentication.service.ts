import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";

import { BehaviorSubject } from "rxjs";

import { NgBlockUI } from "ng-block-ui";
import { ToastrService } from "ngx-toastr";

import { jwtDecode } from "jwt-decode";
import { sha512 } from "js-sha512";

import { environment } from "../../../environments/environment";
import { ILanguageCommands } from "../../models/languageCommand";
import { IUser } from "../../models/user";

import { AlertsService } from "../alerts/alerts.service";
import { LocalStorageKey, LocalStorageService } from "../local-storage/local-storage.service";

export interface IUserUpdate extends Omit<IUser, "idUser"> {
	password?: string;
	languageCommands: ILanguageCommands;
}

@Injectable({ providedIn: "root" })
export class AuthenticationService {
	public $loggedUser = new BehaviorSubject<IUser | null>(null);

	constructor (
		private readonly http: HttpClient,
		private readonly router: Router,
		private readonly toastr: ToastrService,
		private readonly alertsService: AlertsService,
		private readonly localStorage: LocalStorageService
	) {
		// Usa usuário já logado por meio do token armazenado (caso exista)
		const user = this.getLoggedUser();
		this.$loggedUser.next(user);
	}

	public get loggedUser (): IUser | null {
		return this.$loggedUser.value;
	}

	public isLoggedIn (): boolean {
		const user = this.getLoggedUser();
		return Boolean(user && user.idUser && user.idUser > 0);
	}

	public login (email: string, password: string, blockUI?: NgBlockUI): void {
		// Faz o hash da senha antes de fazer o login
		password = sha512(password);

		this.http.post<{ token: string }>(
			`${environment.API_URL}/v1/login`,
			{ email, password }
		).subscribe({
			next: response => {
				this.updateUserToken(response.token);
				blockUI?.stop();
			},

			error: (error: HttpErrorResponse) => {
				blockUI?.stop();
				this.alertsService.httpErrorAlert(
					"Falha ao Entrar",
					"Não foi possível fazer login, tente novamente.",
					error
				);
			}
		});
	}

	public signUp (user: Partial<IUser> & { password: string }, blockUI?: NgBlockUI): void {
		user.password = sha512(user.password);

		this.http.post<{ token: string }>(
			`${environment.API_URL}/v1/users`,
			user
		).subscribe({
			next: response => {
				this.updateUserToken(response.token);
				blockUI?.stop();
			},

			error: (error: HttpErrorResponse) => {
				blockUI?.stop();
				this.alertsService.httpErrorAlert(
					"Falha ao Cadastrar",
					"Não foi possível fazer o cadastro, tente novamente.",
					error
				);
			}
		});
	}

	public updateProfile (user: IUserUpdate, blockUI?: NgBlockUI): void {
		if (user.password)
			user.password = sha512(user.password);

		this.http.put<{ token: string }>(
			`${environment.API_URL}/v1/users`,
			user
		).subscribe({
			next: response => {
				this.updateUserToken(response.token);
				blockUI?.stop();
				this.toastr.success("Perfil atualizado.", "Sucesso!");
			},

			error: (error: HttpErrorResponse) => {
				blockUI?.stop();
				this.alertsService.httpErrorAlert(
					"Falha ao Atualizar Perfil",
					"Não foi possível fazer a atualização, tente novamente.",
					error
				);
			}
		});
	}

	public signOut (): void {
		this.localStorage.delete(LocalStorageKey.USER);
		this.$loggedUser.next(null);
		this.router.navigate(["login"]);
	}

	private getLoggedUser (): IUser | null {
		const token = this.localStorage.get(LocalStorageKey.USER);
		try {
			return (token ? jwtDecode(token) : null) as IUser;
		} catch (error) {
			return null;
		}
	}

	private updateUserToken (token: string): void {
		this.localStorage.set(LocalStorageKey.USER, token);
		this.$loggedUser.next(this.getLoggedUser());
		this.router.navigate(["profile"]);
	}
}

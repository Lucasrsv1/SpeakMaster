import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";

import { NgBlockUI } from "ng-block-ui";
import { ToastrService } from "ngx-toastr";

import { BehaviorSubject, Observable, Subscription, tap } from "rxjs";

import { environment } from "../../../environments/environment";
import { IUserModule } from "../../models/user-module";
import { IUserModuleCommands } from "../../models/user-module-commands";

import { AlertsService } from "../alerts/alerts.service";
import { AuthenticationService } from "../authentication/authentication.service";
import { LocalStorageKey, LocalStorageService } from "../local-storage/local-storage.service";

@Injectable({ providedIn: "root" })
export class UserModulesService implements OnDestroy {
	public $userModules = new BehaviorSubject<IUserModule[] | null>([]);

	private subscription: Subscription;

	constructor (
		private readonly http: HttpClient,
		private readonly toastr: ToastrService,
		private readonly alertsService: AlertsService,
		private readonly authenticationService: AuthenticationService,
		private readonly localStorage: LocalStorageService
	) {
		this.subscription = this.authenticationService.$loggedUser.subscribe(user => {
			if (!user) {
				this.$userModules.next(null);
				this.localStorage.delete(LocalStorageKey.USER_MODULES);
				return;
			}

			if (!this.localStorage.hasKey(LocalStorageKey.USER_MODULES))
				return this.loadFromServer();

			this.loadFromStorage();
		});
	}

	public get userModules (): IUserModule[] | null {
		return this.$userModules.value;
	}

	public ngOnDestroy (): void {
		this.subscription.unsubscribe();
	}

	public loadFromStorage (): void {
		if (!this.localStorage.hasKey(LocalStorageKey.USER_MODULES))
			return;

		this.$userModules.next(
			JSON.parse(this.localStorage.get(LocalStorageKey.USER_MODULES))
		);
	}

	public loadFromServer (blockUI?: NgBlockUI): void {
		this.http.get<IUserModule[]>(
			`${environment.API_URL}/v1/users/modules`
		).subscribe({
			next: response => {
				blockUI?.stop();
				this.updateUserModules(response);
			},

			error: (error: HttpErrorResponse) => {
				blockUI?.stop();
				this.alertsService.httpErrorAlert(
					"Falha ao Carregar Módulos",
					"Não foi possível obter os módulos do usuário, tente novamente.",
					error
				);
			}
		});
	}

	public toggleActive (userModule: IUserModule, blockUI?: NgBlockUI): void {
		const data = {
			idUserModule: userModule.idUserModule,
			isActive: userModule.isActive
		};

		this.http.patch<{ message: string }>(
			`${environment.API_URL}/v1/users/modules/active`,
			data
		).subscribe({
			next: _ => {
				blockUI?.stop();

				// Atualiza localmente
				const userModules = this.userModules;
				if (userModules) {
					const module = userModules.find(um => um.idUserModule === data.idUserModule);
					if (module)
						module.isActive = data.isActive;

					this.updateUserModules(userModules);
				}

				this.toastr.success(`Módulo ${data.isActive ? "ativado" : "desativado"} com sucesso.`, "Sucesso!");
			},

			error: (error: HttpErrorResponse) => {
				this.loadFromStorage();
				blockUI?.stop();
				this.alertsService.httpErrorAlert(
					"Falha ao Atualizar Módulo",
					"Não foi possível fazer a atualização do módulo do usuário, tente novamente.",
					error
				);
			}
		});
	}

	public savePreferences (userModule: IUserModule, blockUI?: NgBlockUI): void {
		const data = {
			idUserModule: userModule.idUserModule,
			preferences: userModule.preferences
		};

		this.http.patch<{ message: string }>(
			`${environment.API_URL}/v1/users/modules/preferences`,
			data
		).subscribe({
			next: _ => {
				blockUI?.stop();

				// Atualiza localmente
				const userModules = this.userModules;
				if (userModules) {
					const module = userModules.find(um => um.idUserModule === data.idUserModule);
					if (module)
						module.preferences = data.preferences;

					this.updateUserModules(userModules);
				}

				this.toastr.success("As preferências do módulo foram atualizadas.", "Sucesso!");
			},

			error: (error: HttpErrorResponse) => {
				this.loadFromStorage();
				blockUI?.stop();
				this.alertsService.httpErrorAlert(
					"Falha ao Salvar Preferências",
					"Não foi possível salvar as preferências do módulo do usuário, tente novamente.",
					error
				);
			}
		});
	}

	public updatePrefix (userModuleCommands: IUserModuleCommands, blockUI?: NgBlockUI): Observable<IUserModuleCommands> {
		const data: Partial<IUserModuleCommands> = {
			idUserModule: userModuleCommands.idUserModule,
			language: userModuleCommands.language,
			prefix: userModuleCommands.prefix,
			isPrefixMandated: userModuleCommands.isPrefixMandated
		};

		return this.updateUserModuleCommands(data, blockUI);
	}

	public updateCommands (userModuleCommands: IUserModuleCommands, blockUI?: NgBlockUI): Observable<IUserModuleCommands> {
		const data: Partial<IUserModuleCommands> = {
			idUserModule: userModuleCommands.idUserModule,
			language: userModuleCommands.language,
			commands: userModuleCommands.commands
		};

		return this.updateUserModuleCommands(data, blockUI);
	}

	private updateUserModuleCommands (data: Partial<IUserModuleCommands>, blockUI?: NgBlockUI): Observable<IUserModuleCommands> {
		const url = data.commands ? `${environment.API_URL}/v1/users/modules/commands` : `${environment.API_URL}/v1/users/modules/prefix`;

		return this.http.patch<IUserModuleCommands>(url, data).pipe(tap({
			next: updatedUserModuleCommands => {
				blockUI?.stop();

				// Atualiza localmente
				const userModules = this.userModules;
				const module = userModules?.find(um => um.idUserModule === data.idUserModule);
				if (userModules && module) {
					const moduleCommands = module.userModuleCommands.find(umc => umc.language === data.language);
					if (moduleCommands) {
						if (data.commands) {
							moduleCommands.commands = data.commands;
						} else {
							moduleCommands.prefix = data.prefix!;
							moduleCommands.isPrefixMandated = data.isPrefixMandated!;
						}
					} else {
						module.userModuleCommands.push(updatedUserModuleCommands);
					}

					this.updateUserModules(userModules);
				}

				this.toastr.success("Módulo atualizado com sucesso.", "Sucesso!");
			},

			error: (error: HttpErrorResponse) => {
				blockUI?.stop();
				this.alertsService.httpErrorAlert(
					"Falha ao Atualizar Módulo",
					"Não foi possível fazer a atualização do módulo do usuário, tente novamente.",
					error
				);
			}
		}));
	}

	private updateUserModules (userModules: IUserModule[]): void {
		this.localStorage.set(LocalStorageKey.USER_MODULES, JSON.stringify(userModules));
		this.$userModules.next(userModules);
	}
}

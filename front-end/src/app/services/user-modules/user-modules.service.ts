import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";

import { NgBlockUI } from "ng-block-ui";
import { ToastrService } from "ngx-toastr";

import { BehaviorSubject, Subscription } from "rxjs";

import { environment } from "../../../environments/environment";
import { IUserModule } from "../../models/userModule";

import { AlertsService } from "../alerts/alerts.service";
import { AuthenticationService } from "../authentication/authentication.service";
import { LocalStorageKey, LocalStorageService } from "../local-storage/local-storage.service";

@Injectable({ providedIn: "root" })
export class UserModulesService implements OnDestroy {
	public $updateFailed = new BehaviorSubject<boolean>(false);
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
			if (!user)
				return this.localStorage.delete(LocalStorageKey.USER_MODULES);

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

	public updatePrefix (userModule: IUserModule, blockUI?: NgBlockUI): void {
		const data = {
			idUserModule: userModule.idUserModule,
			prefix: userModule.prefix,
			isPrefixMandated: userModule.isPrefixMandated
		};

		this.http.patch<{ message: string }>(
			`${environment.API_URL}/v1/users/modules/prefix`,
			data
		).subscribe({
			next: _ => {
				blockUI?.stop();

				// Atualiza localmente
				const userModules = this.userModules;
				if (userModules) {
					const module = userModules.find(um => um.idUserModule === data.idUserModule);
					if (module) {
						module.prefix = data.prefix;
						module.isPrefixMandated = data.isPrefixMandated;
					}

					this.updateUserModules(userModules);
				}

				this.$updateFailed.next(false);
				this.toastr.success("Módulo atualizado com sucesso.", "Sucesso!");
			},

			error: (error: HttpErrorResponse) => {
				blockUI?.stop();
				this.$updateFailed.next(true);
				this.alertsService.httpErrorAlert(
					"Falha ao Atualizar Módulo",
					"Não foi possível fazer a atualização do módulo do usuário, tente novamente.",
					error
				);
			}
		});
	}

	private updateUserModules (userModules: IUserModule[]): void {
		this.localStorage.set(LocalStorageKey.USER_MODULES, JSON.stringify(userModules));
		this.$userModules.next(userModules);
	}
}

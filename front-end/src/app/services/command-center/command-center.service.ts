import { Injectable, OnDestroy } from "@angular/core";

import { Socket } from "ngx-socket-io";

import { BehaviorSubject, Observable, Subscription } from "rxjs";

import { PreferenceValue } from "speakmaster-module-builder/preferences-builder";

import { ICommandResult } from "../../models/command-result";
import { IFeatureParameters } from "../../models/feature-parameters";
import { IPreferenceDynamicChanges } from "../../models/preference-dynamic-changes";
import { IPreferenceValueUpdate } from "../../models/preference-value-update";

import { UserModulesService } from "../user-modules/user-modules.service";

enum CommandCenterEvents {
	COMMAND = "COMMAND",
	COMMAND_RESULT = "COMMAND_RESULT",
	MODULE_CONNECTION = "MODULE_CONNECTION",
	PREFERENCE_DYNAMIC_CHANGE = "PREFERENCE_DYNAMIC_CHANGE",
	PREFERENCE_VALUE_UPDATE = "PREFERENCE_VALUE_UPDATE",
	PREFERENCE_WATCH = "PREFERENCE_WATCH"
}

@Injectable({ providedIn: "root" })
export class CommandCenterService implements OnDestroy {
	public $isConnected = new BehaviorSubject<boolean>(false);

	private $moduleConnected = new Map<number, BehaviorSubject<boolean>>();
	private subscriptions: Subscription[] = [];

	constructor (
		private readonly socket: Socket,
		private readonly userModulesService: UserModulesService
	) {
		this.subscriptions.push(
			this.socket.fromEvent("connect").subscribe(() => this.$isConnected.next(true)),

			this.socket.fromEvent("disconnect").subscribe(() => {
				this.$isConnected.next(false);
				this.$moduleConnected.forEach(subject => subject.next(false));
			}),

			this.socket.fromEvent<{ idModule: number, isConnected: boolean }>(CommandCenterEvents.MODULE_CONNECTION).subscribe(data => {
				const subject = this.$moduleConnected.get(data.idModule);
				subject?.next(data.isConnected);

				if (data.isConnected) {
					// Envia as preferências salvas para o módulo que foi conectado
					const userModule = this.userModulesService.userModules?.find(m => m.idModule === data.idModule);
					const savedPreferences = userModule?.preferences || {};
					const preferencesUpdate: IPreferenceValueUpdate[] = [];

					for (const [key, value] of Object.entries(savedPreferences))
						preferencesUpdate.push({ identifier: key, value });

					this.sendPreferenceValueUpdateToModule(data.idModule, preferencesUpdate);
				}
			})
		);
	}

	public get $commandResult (): Observable<ICommandResult> {
		return this.socket.fromEvent<ICommandResult>(CommandCenterEvents.COMMAND_RESULT);
	}

	public $getPreferenceDynamicChanges<T extends PreferenceValue> (): Observable<IPreferenceDynamicChanges<T>> {
		return this.socket.fromEvent<IPreferenceDynamicChanges<T>>(CommandCenterEvents.PREFERENCE_DYNAMIC_CHANGE);
	}

	public ngOnDestroy (): void {
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
	}

	public $isModuleConnected (moduleId: number): BehaviorSubject<boolean> {
		if (!this.$moduleConnected.has(moduleId))
			this.$moduleConnected.set(moduleId, new BehaviorSubject<boolean>(false));

		return this.$moduleConnected.get(moduleId)!;
	}

	public sendCommandToModule (idModule: number, featureIdentifier: string, parameters?: IFeatureParameters): number {
		const sentAt = Date.now();
		this.socket.emit(CommandCenterEvents.COMMAND, {
			idModule, featureIdentifier, parameters, sentAt
		});

		return sentAt;
	}

	public sendPreferenceValueUpdateToModule (idModule: number, preferences: IPreferenceValueUpdate[]): void {
		console.log(CommandCenterEvents.PREFERENCE_VALUE_UPDATE, { idModule, preferences });
		this.socket.emit(CommandCenterEvents.PREFERENCE_VALUE_UPDATE, { idModule, preferences });
	}

	public monitorModulePreferences (idModule: number, subscribe: boolean): void {
		console.log("MONITOR MODULE PREFERENCES:", idModule, subscribe);
		this.socket.emit(CommandCenterEvents.PREFERENCE_WATCH, { idModule, subscribe });
	}
}

import { Injectable } from "@angular/core";

import { BehaviorSubject } from "rxjs";

import { ICommandResult } from "../../models/command-result";

import { LocalStorageKey, LocalStorageService } from "../local-storage/local-storage.service";

@Injectable({ providedIn: "root" })
export class AmbiguityService {
	private $modulesAmbiguousCommand = new Map<number, BehaviorSubject<ICommandResult | null>>();
	private $modulesAmbiguityNotification = new Map<number, BehaviorSubject<boolean>>();

	private modulesAmbiguities: ICommandResult[] = [];

	constructor (private readonly localStorageService: LocalStorageService) {
		if (this.localStorageService.hasKey(LocalStorageKey.MODULES_AMBIGUITIES)) {
			this.modulesAmbiguities = this.localStorageService.parse<ICommandResult[]>(LocalStorageKey.MODULES_AMBIGUITIES);
			for (const ambiguity of this.modulesAmbiguities) {
				this.$moduleAmbiguousCommand(ambiguity.idModule).next(ambiguity);

				if (typeof ambiguity.result !== "boolean" && !ambiguity.result.notified)
					this.$moduleAmbiguityNotification(ambiguity.idModule).next(true);
			}
		}
	}

	public $moduleAmbiguousCommand (moduleId: number): BehaviorSubject<ICommandResult | null> {
		if (!this.$modulesAmbiguousCommand.has(moduleId))
			this.$modulesAmbiguousCommand.set(moduleId, new BehaviorSubject<ICommandResult | null>(null));

		return this.$modulesAmbiguousCommand.get(moduleId)!;
	}

	public $moduleAmbiguityNotification (moduleId: number): BehaviorSubject<boolean> {
		if (!this.$modulesAmbiguityNotification.has(moduleId))
			this.$modulesAmbiguityNotification.set(moduleId, new BehaviorSubject<boolean>(false));

		return this.$modulesAmbiguityNotification.get(moduleId)!;
	}

	public notifyAmbiguity (ambiguousCommand: ICommandResult): void {
		// A ordem entre notificação e comando é importante, pois ao emitir o comando ele pode ser imediatamente tratado e remover a notificação
		this.$moduleAmbiguityNotification(ambiguousCommand.idModule).next(true);
		this.$moduleAmbiguousCommand(ambiguousCommand.idModule).next(ambiguousCommand);

		this.removeModuleAmbiguity(ambiguousCommand.idModule);
		this.modulesAmbiguities.push(ambiguousCommand);
		this.saveAmbiguities();
	}

	public clearNotification (moduleId: number): void {
		this.$moduleAmbiguityNotification(moduleId).next(false);

		const ambiguity = this.modulesAmbiguities.find(ambiguity => ambiguity.idModule === moduleId);
		if (ambiguity && typeof ambiguity.result !== "boolean") {
			ambiguity.result.notified = true;
			this.saveAmbiguities();
		}
	}

	public clearAmbiguity (moduleId: number): void {
		this.$moduleAmbiguityNotification(moduleId).next(false);
		this.$moduleAmbiguousCommand(moduleId).next(null);

		this.removeModuleAmbiguity(moduleId);
		this.saveAmbiguities();
	}

	private removeModuleAmbiguity (moduleId: number): void {
		const index = this.modulesAmbiguities.findIndex(ambiguity => ambiguity.idModule === moduleId);
		if (index >= 0)
			this.modulesAmbiguities.splice(index, 1);
	}

	private saveAmbiguities (): void {
		this.localStorageService.set(LocalStorageKey.MODULES_AMBIGUITIES, JSON.stringify(this.modulesAmbiguities));
	}
}

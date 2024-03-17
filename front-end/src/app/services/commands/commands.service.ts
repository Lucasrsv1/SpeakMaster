import { Injectable, OnDestroy } from "@angular/core";

import { BehaviorSubject, Subscription } from "rxjs";

import { CommandExecutionStatus, IExecutedCommand } from "../../models/executedCommand";

import { AuthenticationService } from "../authentication/authentication.service";
import { LocalStorageKey, LocalStorageService } from "../local-storage/local-storage.service";

const MAX_HISTORY_LENGTH = 64;

@Injectable({ providedIn: "root" })
export class CommandsService implements OnDestroy {
	public $lastCommands = new BehaviorSubject<IExecutedCommand[]>([]);

	private idUser?: number;
	private subscription: Subscription;

	constructor (
		private readonly authenticationService: AuthenticationService,
		private readonly localStorage: LocalStorageService
	) {
		this.subscription = this.authenticationService.$loggedUser.subscribe(user => {
			if (!user) {
				this.idUser = undefined;
				return this.$lastCommands.next([]);
			}

			this.idUser = user.idUser;
			if (!this.localStorage.hasKey(LocalStorageKey.LAST_COMMANDS, user.idUser.toString())) {
				this.localStorage.set(LocalStorageKey.LAST_COMMANDS, "[]", user.idUser.toString());
				this.$lastCommands.next([]);
				return;
			}

			const commands = this.localStorage.parse<IExecutedCommand[]>(LocalStorageKey.LAST_COMMANDS, [], user.idUser.toString());
			for (const command of commands) {
				if (command.status === CommandExecutionStatus.PENDING)
					this.setCommandTimeout(command);
			}

			this.$lastCommands.next(commands);
		});
	}

	public get lastCommands (): IExecutedCommand[] {
		return this.$lastCommands.value;
	}

	public ngOnDestroy (): void {
		this.subscription.unsubscribe();
	}

	public sendCommand (command: string): void {
		// TODO: run command matching

		const executedCommand: IExecutedCommand = {
			sentAt: Date.now(),
			status: CommandExecutionStatus.PENDING,
			value: command
		};

		this.lastCommands.unshift(executedCommand);
		this.setCommandTimeout(executedCommand);

		this.updateLastCommands(this.lastCommands);
	}

	private setCommandTimeout (command: IExecutedCommand): void {
		setTimeout(() => {
			if (command.status === CommandExecutionStatus.PENDING) {
				command.status = CommandExecutionStatus.ERROR;
				command.description = "Tempo esgotado";
				this.updateLastCommands(this.lastCommands);
			}
		}, 5000);
	}

	private updateLastCommands (commands: IExecutedCommand[]): void {
		if (!this.idUser)
			return;

		this.$lastCommands.next(commands);
		this.localStorage.set(
			LocalStorageKey.LAST_COMMANDS,
			JSON.stringify(commands.slice(0, MAX_HISTORY_LENGTH)),
			this.idUser.toString()
		);
	}
}

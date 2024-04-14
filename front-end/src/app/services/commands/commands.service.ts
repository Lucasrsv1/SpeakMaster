import { Injectable, OnDestroy } from "@angular/core";

import { BehaviorSubject, Subscription } from "rxjs";

import { ICommandResult } from "../../models/command-result";
import { CommandExecutionStatus, IExecutedCommand } from "../../models/executed-command";

import { AmbiguityService } from "../ambiguity/ambiguity.service";
import { AuthenticationService } from "../authentication/authentication.service";
import { CommandCenterService } from "../command-center/command-center.service";
import { CommandMatchingService } from "../command-matching/command-matching.service";
import { LocalStorageKey, LocalStorageService } from "../local-storage/local-storage.service";

const MAX_HISTORY_LENGTH = 64;

@Injectable({ providedIn: "root" })
export class CommandsService implements OnDestroy {
	public $lastCommands = new BehaviorSubject<IExecutedCommand[]>([]);

	private idUser?: number;
	private subscription: Subscription[] = [];

	constructor (
		private readonly authenticationService: AuthenticationService,
		private readonly ambiguityService: AmbiguityService,
		private readonly commandCenterService: CommandCenterService,
		private readonly commandMatchingService: CommandMatchingService,
		private readonly localStorage: LocalStorageService
	) {
		this.subscription.push(
			this.authenticationService.$loggedUser.subscribe(user => {
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
			}),

			this.commandCenterService.$commandResult.subscribe(this.gotResultForCommand.bind(this))
		);
	}

	public get lastCommands (): IExecutedCommand[] {
		return this.$lastCommands.value;
	}

	public ngOnDestroy (): void {
		this.subscription.forEach(subscription => subscription.unsubscribe());
	}

	public sendCommand (command: string): void {
		const executedCommand = this.commandMatchingService.matchCommand(command);

		this.lastCommands.unshift(executedCommand);
		this.setCommandTimeout(executedCommand);

		this.updateLastCommands(this.lastCommands);
	}

	public gotResultForCommand (data: ICommandResult): void {
		const executedCommand = this.lastCommands.find(
			command => command.idModule === data.idModule && command.featureIdentifier === data.featureIdentifier && command.sentAt === data.sentAt
		);

		if (!executedCommand) return;

		if (typeof data.result == "boolean") {
			executedCommand.status = data.result ? CommandExecutionStatus.SUCCESSFUL : CommandExecutionStatus.ERROR;
			executedCommand.description = data.result ? "Comando executado com sucesso" : "Erro ao executar comando";
			this.ambiguityService.clearAmbiguity(data.idModule);
		} else {
			executedCommand.status = CommandExecutionStatus.AMBIGUOUS;
			executedCommand.description = "O comando resultou em ambiguidade";
			this.ambiguityService.notifyAmbiguity(data);
		}

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

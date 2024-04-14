import { Injectable, OnDestroy } from "@angular/core";

import { debounceTime, skip, Subscription } from "rxjs";

import { Automata } from "speakmaster-crl";
import { Command } from "speakmaster-module-builder/default-commands-builder";

import { ILanguageCommands } from "../../models/language-command";
import { IUserModule } from "../../models/user-module";
import { LanguageCode } from "../../models/languages";
import { CommandExecutionStatus, IExecutedCommand } from "../../models/executed-command";

import { CommandCenterService } from "../command-center/command-center.service";
import { CommandParametersService } from "../command-parameters/command-parameters.service";
import { LanguageCommandsService } from "../language-commands/language-commands.service";
import { UserModulesService } from "../user-modules/user-modules.service";

@Injectable({ providedIn: "root" })
export class CommandMatchingService implements OnDestroy {
	private languageCommands = new Map<Automata, LanguageCode>();
	private moduleCommands = new Map<Automata, { idModule: number, command: Command}>();
	private subscriptions: Subscription[] = [];

	constructor (
		private readonly commandCenterService: CommandCenterService,
		private readonly commandParametersService: CommandParametersService,
		private readonly languageCommandsService: LanguageCommandsService,
		private readonly userModulesService: UserModulesService
	) {
		// Inicializa os comandos
		this.rebuildLanguageCommands(this.languageCommandsService.languageCommands);
		this.rebuildModulesCommands(this.userModulesService.userModules);

		// Observa mudanças nos cadastros para reconstruir os comandos
		this.subscriptions.push(
			this.languageCommandsService.$languageCommands
				.pipe(skip(1))
				.pipe(debounceTime(5000))
				.subscribe(this.rebuildLanguageCommands.bind(this)),

			this.userModulesService.$userModules
				.pipe(skip(1))
				.pipe(debounceTime(5000))
				.subscribe(this.rebuildModulesCommands.bind(this))
		);
	}

	public ngOnDestroy (): void {
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
	}

	public matchCommand (command: string): IExecutedCommand {
		for (const [automata, moduleCommand] of this.moduleCommands) {
			const result = automata.match(command);
			if (!result.match) continue;

			// Gera o objeto de parâmetros com base na funcionalidade associada ao comando
			const parameters = this.commandParametersService.buildParametersObject(
				result, moduleCommand.idModule, moduleCommand.command
			);

			const sentAt = this.commandCenterService.sendCommandToModule(
				moduleCommand.idModule, moduleCommand.command.featureIdentifier, parameters
			);

			return {
				idModule: moduleCommand.idModule,
				featureIdentifier: moduleCommand.command.featureIdentifier,
				value: command,
				status: CommandExecutionStatus.PENDING,
				description: "Executando...",
				sentAt
			};
		}

		for (const [automata, languageCode] of this.languageCommands) {
			const result = automata.match(command);
			if (!result.match) continue;

			// TODO: altera o idioma do microfone para languageCode
			console.log("Altera o idioma do microfone para:", languageCode);

			return {
				sentAt: Date.now(),
				status: CommandExecutionStatus.SUCCESSFUL,
				value: command,
				description: "Comando executado com sucesso"
			};
		}

		return {
			sentAt: Date.now(),
			status: CommandExecutionStatus.NOT_RECOGNIZED,
			value: command,
			description: "Comando não reconhecido"
		};
	}

	private rebuildLanguageCommands (languageCommands: ILanguageCommands | null): void {
		console.log("REBUILD LANGUAGE COMMANDS", languageCommands);

		this.languageCommands = new Map();
		if (!languageCommands)
			return;

		for (const languageCode of languageCommands.languagesToListen) {
			for (const languageCommand of languageCommands[languageCode] || []) {
				if (!languageCommand.isActive)
					continue;

				const automata = new Automata(languageCommand.command);
				this.languageCommands.set(automata, languageCommand.targetLanguageCode);
			}
		}
	}

	private rebuildModulesCommands (userModules: IUserModule[] | null): void {
		console.log("REBUILD MODULES COMMANDS", userModules);

		this.moduleCommands = new Map();
		if (!userModules)
			return;

		for (const userModule of userModules) {
			if (!userModule.isActive)
				continue;

			for (const userModuleCommand of userModule.userModuleCommands || []) {
				let prefix = "";
				if (userModuleCommand.prefix) {
					if (userModuleCommand.isPrefixMandated)
						prefix = userModuleCommand.prefix;
					else
						prefix = `[${userModuleCommand.prefix}]`;
				}

				for (const moduleCommand of userModuleCommand.commands || []) {
					const automata = new Automata(`${prefix} ${moduleCommand.command}`.trim());
					this.moduleCommands.set(automata, { idModule: userModule.idModule, command: moduleCommand });
				}
			}
		}
	}
}

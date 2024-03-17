import { MatIcon } from "@angular/material/icon";
import { NgFor } from "@angular/common";
import { Component, EventEmitter, Output } from "@angular/core";

import { NgScrollbar } from "ngx-scrollbar";

import { CommandExecutionStatus, IExecutedCommand } from "../../../../models/executedCommand";

import { CommandsService } from "../../../../services/commands/commands.service";

@Component({
	selector: "app-module-last-commands",
	standalone: true,
	imports: [MatIcon, NgFor, NgScrollbar],
	templateUrl: "./last-commands.component.html",
	styleUrl: "./last-commands.component.scss"
})
export class LastCommandsComponent {
	@Output()
	public editCommand = new EventEmitter<string>();

	public running = CommandExecutionStatus.PENDING;
	public commands: IExecutedCommand[] = [];

	constructor (private readonly commandsService: CommandsService) {
		this.commandsService.$lastCommands.subscribe(commands => this.commands = commands);
	}

	public replay (command: IExecutedCommand) {
		this.commandsService.sendCommand(command.value);
	}
}

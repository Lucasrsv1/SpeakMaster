import { MatIcon } from "@angular/material/icon";
import { NgFor } from "@angular/common";
import { Component, EventEmitter, OnDestroy, Output } from "@angular/core";

import { NgScrollbar } from "ngx-scrollbar";

import { CommandExecutionStatus, IExecutedCommand } from "../../../../models/executed-command";

import { CommandsService } from "../../../../services/commands/commands.service";
import { Subscription } from "rxjs";

@Component({
	selector: "app-module-last-commands",
	standalone: true,
	imports: [MatIcon, NgFor, NgScrollbar],
	templateUrl: "./last-commands.component.html",
	styleUrl: "./last-commands.component.scss"
})
export class LastCommandsComponent implements OnDestroy {
	@Output()
	public editCommand = new EventEmitter<string>();

	public running = CommandExecutionStatus.PENDING;
	public commands: IExecutedCommand[] = [];

	private subscription: Subscription;

	constructor (private readonly commandsService: CommandsService) {
		this.subscription = this.commandsService.lastCommands$.subscribe(commands => this.commands = commands);
	}

	public ngOnDestroy (): void {
		this.subscription.unsubscribe();
	}

	public replay (command: IExecutedCommand) {
		this.commandsService.sendCommand(command.value);
	}
}

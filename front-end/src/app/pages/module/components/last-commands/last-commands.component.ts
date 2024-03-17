import { Component } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { NgFor } from "@angular/common";

import { NgScrollbar } from "ngx-scrollbar";

import { CommandExecutionStatus, IExecutedCommand } from "../../../../models/executedCommand";

@Component({
	selector: "app-module-last-commands",
	standalone: true,
	imports: [MatIcon, NgFor, NgScrollbar],
	templateUrl: "./last-commands.component.html",
	styleUrl: "./last-commands.component.scss"
})
export class LastCommandsComponent {
	public running = CommandExecutionStatus.PENDING;
	public commands: IExecutedCommand[] = [
		{ value: "aumentar volume", status: CommandExecutionStatus.PENDING },
		{ value: "tocar música porta aberta da luka", status: CommandExecutionStatus.SUCCESSFUL },
		{ value: "tocar porta aberta", status: CommandExecutionStatus.AMBIGUOUS },
		{ value: "teste de microfone", status: CommandExecutionStatus.NOT_RECOGNIZED },
		{ value: "tocar a música algum nome não encontrado", status: CommandExecutionStatus.ERROR },
		{ value: "aumentar volume", status: CommandExecutionStatus.AMBIGUOUS },
		{ value: "tocar música porta aberta da luka", status: CommandExecutionStatus.SUCCESSFUL },
		{ value: "tocar porta aberta", status: CommandExecutionStatus.AMBIGUOUS },
		{ value: "teste de microfone", status: CommandExecutionStatus.NOT_RECOGNIZED },
		{ value: "tocar a música algum nome não encontrado", status: CommandExecutionStatus.ERROR }
	];

	public edit (command: IExecutedCommand) {
		console.log("EDIT", command);
	}

	public replay (command: IExecutedCommand) {
		console.log("REPLAY", command);
	}
}

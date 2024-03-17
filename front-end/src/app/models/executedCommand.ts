export enum CommandExecutionStatus {
	PENDING = "list-group-item-info",
	SUCCESSFUL = "list-group-item-success",
	AMBIGUOUS = "list-group-item-warning",
	ERROR = "list-group-item-danger",
	NOT_RECOGNIZED = "list-group-item-light"
}

export interface IExecutedCommand {
	value: string;
	status: CommandExecutionStatus;
	description?: string;
	sentAt?: number;
}

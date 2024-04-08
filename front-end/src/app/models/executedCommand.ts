export enum CommandExecutionStatus {
	PENDING = "list-group-item-info",
	SUCCESSFUL = "list-group-item-success",
	AMBIGUOUS = "list-group-item-warning",
	ERROR = "list-group-item-danger",
	NOT_RECOGNIZED = "list-group-item-light"
}

export interface IExecutedCommand {
	description: string;
	status: CommandExecutionStatus;
	value: string;
	featureIdentifier?: string;
	idModule?: number;
	sentAt?: number;
}

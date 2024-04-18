import { MatIcon } from "@angular/material/icon";
import { NgFor } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";

import { BsModalRef } from "ngx-bootstrap/modal";
import { CollapseModule } from "ngx-bootstrap/collapse";
import { NgScrollbarModule } from "ngx-scrollbar";
import { CodeEditorComponent, CodeEditorModule, CodeModel } from "@ngstack/code-editor";

import { Automata } from "speakmaster-crl";
import { editor } from "monaco-editor";

import { debounceTime, Subject } from "rxjs";

import { IDataTableRow } from "../commands-table/commands-table.component";

import { MonacoCrlService } from "../../services/monaco-crl/monaco-crl.service";

@Component({
	selector: "app-command-editor-modal",
	standalone: true,
	imports: [CodeEditorModule, CollapseModule, MatIcon, NgFor, NgScrollbarModule],
	templateUrl: "./command-editor-modal.component.html",
	styleUrl: "./command-editor-modal.component.scss"
})
export class CommandEditorModalComponent implements OnInit, OnDestroy {
	// Inputs
	public areInstructionsCollapsed: boolean = true;
	public arePossibleCommandsCollapsed: boolean = false;

	// Output
	public editingCommand!: IDataTableRow<any>;

	protected possibleCommands: string[] = [];
	protected codeModel: CodeModel = {
		language: "crl",
		uri: "editing-command.crl",
		value: ""
	};

	protected options: editor.IEditorConstructionOptions = {
		automaticLayout: true
	};

	private $valueChanged: Subject<void> = new Subject();

	private currentCommand: string = "";
	private editorComponent?: CodeEditorComponent;

	constructor (
		protected readonly bsModalRef: BsModalRef,
		private readonly monacoCrlService: MonacoCrlService
	) {
		this.monacoCrlService.registerCRL();
		this.$valueChanged
			.pipe(debounceTime(500))
			.subscribe(() => this.getPossibleCommands());
	}

	protected get isCommandInvalid (): boolean {
		return !this.currentCommand || this.monacoCrlService.isEditorContentInvalid(this.codeModel.uri);
	}

	public ngOnInit (): void {
		this.codeModel.value = this.editingCommand.command;
		this.currentCommand = this.editingCommand.command;
		this.getPossibleCommands();
	}

	public ngOnDestroy (): void {
		this.editorComponent?.ngOnDestroy();
	}

	protected editorLoaded (editorComponent: CodeEditorComponent): void {
		this.editorComponent = editorComponent;
	}

	protected onValueChanged (value: string): void {
		this.currentCommand = value;
		this.monacoCrlService.validate(this.codeModel.uri);
		this.$valueChanged.next();
	}

	protected save (): void {
		if (this.isCommandInvalid)
			return;

		// Write command to the original object
		this.editingCommand.command = this.currentCommand;
		this.bsModalRef.hide();
	}

	private getPossibleCommands (): void {
		if (this.isCommandInvalid)
			return;

		this.possibleCommands = new Automata(this.currentCommand)
			.getAllPossibilities()
			.sort()
			.map(c => c.replace(/\{/g, "<span class='variable-text'>{").replace(/\}/g, "}</span>"));
	}
}

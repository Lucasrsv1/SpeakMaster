/* eslint-disable no-useless-escape */

import { Injectable } from "@angular/core";

import * as MonacoTypes from "monaco-editor";

import { CodeEditorService } from "@ngstack/code-editor";

import { validateSyntax } from "speakmaster-crl";


@Injectable({ providedIn: "root" })
export class MonacoCrlService {
	constructor (private readonly codeEditorService: CodeEditorService) { }

	private get monaco (): typeof MonacoTypes {
		return this.codeEditorService.monaco;
	}

	public registerCRL (): void {
		if (this.monaco.languages.getLanguages().some(l => l.id === "crl"))
			return;

		this.monaco.languages.register({
			id: "crl",
			extensions: [".crl"],
			aliases: ["CRL", "crl"]
		});

		this.monaco.languages.setMonarchTokensProvider("crl", {
			brackets: [
				{ open: "{", close: "}", token: "delimiter.curly" },
				{ open: "[", close: "]", token: "delimiter.square" },
				{ open: "(", close: ")", token: "delimiter.parenthesis" }
			],

			tokenizer: {
				root: [
					{ include: "@whitespace" },
					[/[\}\]\)\,]/, "invalid"],
					[/\{/, "@brackets", "@variable"],
					[/\(/, "@brackets", "@list"],
					[/\[/, "@brackets", "@optional"]
				],

				variable: [
					{ include: "@whitespace" },
					[/[\{\[\]\)\,]/, "invalid"],
					[/\(/, "@brackets", "@list"],
					[/\}/, "@brackets", "@pop"],
					[/./, "variable.name"]
				],

				list: [
					{ include: "@whitespace" },
					[/[\}\]\,]/, "invalid"],
					[/\)/, "@brackets", "@pop"],
					[/./, "@rematch", "@item"]
				],

				item: [
					{ include: "@whitespace" },
					[/[\}\]]/, "invalid"],
					[/\{/, "@brackets", "@variable"],
					[/\(/, "@brackets", "@list"],
					[/\[/, "@brackets", "@optional"],
					[/\)/, "@rematch", "@pop"],
					[/,/, "list.separator", "@pop"],
					[/./, "list.term"]
				],

				optional: [
					{ include: "@whitespace" },
					[/[\}\)\,]/, "invalid"],
					[/\{/, "@brackets", "@variable"],
					[/\(/, "@brackets", "@list"],
					[/\[/, "@brackets", "@optional"],
					[/\]/, "@brackets", "@pop"],
					[/./, "optional.term"]
				],

				whitespace: [
					[/[ \t\r\n]+/, "white"]
				]
			}
		});

		this.monaco.languages.setLanguageConfiguration("crl", {
			brackets: [
				["{", "}"],
				["[", "]"],
				["(", ")"]
			],
			colorizedBracketPairs: []
		});

		// Define a new theme that contains only rules that match this language
		this.monaco.editor.defineTheme("crlTheme", {
			base: "vs",
			inherit: false,
			rules: [
				{ token: "invalid", foreground: "dc3545" },
				{ token: "variable", foreground: "569cd6" },
				{ token: "list", foreground: "5ea16b" },
				{ token: "optional", foreground: "ed7d31" },
				{ token: "delimiter.curly", foreground: "569cd6" },
				{ token: "delimiter.square", foreground: "ed7d31" },
				{ token: "delimiter.parenthesis", foreground: "5ea16b" }
			],
			colors: {
				"editor.foreground": "#212529"
			}
		});

		this.monaco.languages.registerCompletionItemProvider("crl", {
			provideCompletionItems: (model: any, position: any) => {
				const word = model.getWordUntilPosition(position);
				const range = {
					startLineNumber: position.lineNumber,
					endLineNumber: position.lineNumber,
					startColumn: word.startColumn,
					endColumn: word.endColumn
				};

				const suggestions = [
					{
						label: "optional",
						kind: this.monaco.languages.CompletionItemKind.Text,
						insertText: "[${1:optional words}] ",
						insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						documentation: "Sequence of optional terms",
						range
					},
					{
						label: "list",
						kind: this.monaco.languages.CompletionItemKind.Enum,
						insertText: "(${1:first item}, ${2:second item}) ",
						insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						documentation: "List of valid terms that should be recognized",
						range
					},
					{
						label: "variable",
						kind: this.monaco.languages.CompletionItemKind.Variable,
						insertText: "{${1:VARIABLE NAME}} ",
						insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						documentation: "A variable that will match any terms",
						range
					},
					{
						label: "restricted variable",
						kind: this.monaco.languages.CompletionItemKind.Variable,
						insertText: "{${1:VARIABLE NAME} (${2:first item}, ${3:second item})} ",
						insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						documentation: "A variable that will match only options from a specified list",
						range
					}
				];

				return { suggestions };
			}
		});
	}

	public destroyEditor (uri: string): void {
		const model = this.monaco.editor.getModel(this.monaco.Uri.parse(uri));
		const editor = this.monaco.editor.getEditors().find(e => e.getModel() === model);

		if (model) model.dispose();
		if (editor) editor.dispose();
	}

	public setEditorContent (uri: string, content: string): void {
		const model = this.monaco.editor.getModel(this.monaco.Uri.parse(uri));
		model?.setValue(content);
	}

	public getEditorContent (uri: string): string | undefined {
		const model = this.monaco.editor.getModel(this.monaco.Uri.parse(uri));
		return model?.getValue();
	}

	public isEditorContentInvalid (uri: string): boolean {
		const markers = this.monaco.editor.getModelMarkers({
			resource: this.monaco.Uri.parse(uri)
		});

		return markers.some(m => m.severity === this.monaco.MarkerSeverity.Error);
	}

	public validate (uri: string): void {
		const model = this.monaco.editor.getModel(this.monaco.Uri.parse(uri));
		if (model)
			this.validateModel(model);
	}

	public validateModel (model: MonacoTypes.editor.ITextModel): void {
		// List of markers indicating errors to display
		const markers: MonacoTypes.editor.IMarkerData[] = [];

		const error = validateSyntax(model.getValue());
		if (error) {
			markers.push({
				severity: MonacoTypes.MarkerSeverity.Error,
				startLineNumber: error.line,
				startColumn: error.column,
				endLineNumber: error.line,
				endColumn: error.column + 1,
				message: error.message.split(" at")[0]
			});
		}

		this.monaco.editor.setModelMarkers(model, "crl", markers);
	}

	public validateAllEditors (): void {
		const models = this.monaco.editor.getModels();
		for (const model of models)
			this.validateModel(model);
	}
}

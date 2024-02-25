import { MatIcon } from "@angular/material/icon";
import { NgIf } from "@angular/common";
import { RouterLink } from "@angular/router";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

@Component({
	selector: "app-header",
	standalone: true,
	imports: [NgIf, MatIcon, RouterLink],
	templateUrl: "./header.component.html",
	styleUrls: ["./header.component.scss"]
})
export class HeaderComponent implements OnInit {
	@Input()
	public disableMenu: boolean = false;

	@Output()
	public collapseChange = new EventEmitter<boolean>();

	public isMenuCollapsed = false;

	constructor () { }

	public ngOnInit (): void {
		this.collapseChange.emit(this.isMenuCollapsed);
	}

	public collapse (): void {
		this.isMenuCollapsed = !this.isMenuCollapsed;
		this.collapseChange.emit(this.isMenuCollapsed);
	}
}

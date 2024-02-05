import { MatIcon } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { Component, EventEmitter, OnInit, Output } from "@angular/core";

@Component({
	selector: "app-header",
	standalone: true,
	imports: [MatIcon, RouterLink],
	templateUrl: "./header.component.html",
	styleUrls: ["./header.component.scss"]
})
export class HeaderComponent implements OnInit {
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

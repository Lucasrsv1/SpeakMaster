import { MatIcon } from "@angular/material/icon";
import { NgIf } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
	selector: "app-checkbox",
	standalone: true,
	imports: [MatIcon, NgIf],
	templateUrl: "./checkbox.component.html",
	styleUrl: "./checkbox.component.scss"
})
export class CheckboxComponent {
	@Input()
	public isChecked?: boolean = false;

	@Input()
	public radio?: boolean = false;

	@Output()
	public clicked = new EventEmitter<MouseEvent>();
}

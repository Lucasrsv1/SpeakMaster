import { Component, Input } from "@angular/core";

import mix from "mix-css-color";

interface LedStyle {
	"--color": string;
	"--color-darker": string;
	"--color-darkest": string;
	"--animation-duration": string;
}

@Component({
	selector: "app-led",
	standalone: true,
	imports: [],
	templateUrl: "./led.component.html",
	styleUrl: "./led.component.scss"
})
export class LedComponent {
	@Input()
	public color: string = "#F00";

	@Input()
	public state: "on" | "off" | "blinking" = "blinking";

	@Input()
	public blinkingSpeed: number = 1000;

	public get style (): LedStyle {
		return {
			"--color": this.color,
			"--color-darker": mix("#000", this.color, 32).hex,
			"--color-darkest": mix("#000", this.color, 50).hex,
			"--animation-duration": `${this.blinkingSpeed}ms`
		};
	}
}

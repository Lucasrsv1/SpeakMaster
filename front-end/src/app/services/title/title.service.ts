import { Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";

import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: "root" })
export class TitleService {
	public $title = new BehaviorSubject<string>("");

	constructor (private angularTitleService: Title) {
		this.updateTabTitle();
	}

	public setTitle (title: string): void {
		this.$title.next(title);
		this.updateTabTitle();
	}

	private updateTabTitle (): void {
		this.angularTitleService.setTitle(
			this.$title.value ? this.$title.value + " · SpeakMaster" : "SpeakMaster"
		);
	}
}

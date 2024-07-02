import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class UtilsService {
	public sleep (ms: number): Promise<void> {
		return new Promise<void>(resolve => setTimeout(resolve, ms));
	}
}

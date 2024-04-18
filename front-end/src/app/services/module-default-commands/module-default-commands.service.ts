import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

import { Observable } from "rxjs";

import { environment } from "../../../environments/environment";
import { IModuleDefaultCommands } from "../../models/module-default-commands";

@Injectable({ providedIn: "root" })
export class ModuleDefaultCommandsService {
	constructor (private readonly http: HttpClient) { }

	public getModuleDefaultCommands (idModule: number): Observable<IModuleDefaultCommands[]> {
		return this.http.get<IModuleDefaultCommands[]>(
			`${environment.API_URL}/v1/modules/default-commands/${idModule}`
		);
	}
}

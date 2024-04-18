import { TestBed } from "@angular/core/testing";

import { ModuleDefaultCommandsService } from "./module-default-commands.service";

describe("ModuleDefaultCommandsService", () => {
	let service: ModuleDefaultCommandsService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(ModuleDefaultCommandsService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});

import { TestBed } from "@angular/core/testing";

import { CommandParametersService } from "./command-parameters.service";

describe("CommandParametersService", () => {
	let service: CommandParametersService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(CommandParametersService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});

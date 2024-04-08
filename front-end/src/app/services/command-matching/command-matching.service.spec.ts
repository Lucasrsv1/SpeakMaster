import { TestBed } from "@angular/core/testing";

import { CommandMatchingService } from "./command-matching.service";

describe("CommandMatchingService", () => {
	let service: CommandMatchingService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(CommandMatchingService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});

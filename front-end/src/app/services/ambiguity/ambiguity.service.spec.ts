import { TestBed } from "@angular/core/testing";

import { AmbiguityService } from "./ambiguity.service";

describe("AmbiguityService", () => {
	let service: AmbiguityService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(AmbiguityService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});

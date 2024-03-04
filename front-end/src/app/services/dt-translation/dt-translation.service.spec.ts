import { TestBed } from "@angular/core/testing";

import { DtTranslationService } from "./dt-translation.service";

describe("DtTranslationService", () => {
	let service: DtTranslationService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(DtTranslationService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});

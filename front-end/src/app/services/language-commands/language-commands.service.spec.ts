import { TestBed } from "@angular/core/testing";

import { LanguageCommandsService } from "./language-commands.service";

describe("LanguageCommandsService", () => {
	let service: LanguageCommandsService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(LanguageCommandsService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});

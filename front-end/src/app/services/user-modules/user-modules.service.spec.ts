import { TestBed } from "@angular/core/testing";

import { UserModulesService } from "./user-modules.service";

describe("UserModulesService", () => {
	let service: UserModulesService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(UserModulesService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});

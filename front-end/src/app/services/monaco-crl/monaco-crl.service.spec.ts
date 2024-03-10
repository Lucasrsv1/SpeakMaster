import { TestBed } from "@angular/core/testing";

import { MonacoCrlService } from "./monaco-crl.service";

describe("MonacoCrlService", () => {
	let service: MonacoCrlService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(MonacoCrlService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});

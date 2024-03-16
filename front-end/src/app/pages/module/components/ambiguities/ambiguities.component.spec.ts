import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AmbiguitiesComponent } from "./ambiguities.component";

describe("AmbiguitiesComponent", () => {
	let component: AmbiguitiesComponent;
	let fixture: ComponentFixture<AmbiguitiesComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AmbiguitiesComponent]
		})
			.compileComponents();

		fixture = TestBed.createComponent(AmbiguitiesComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});

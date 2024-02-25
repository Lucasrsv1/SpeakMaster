import { ComponentFixture, TestBed } from "@angular/core/testing";

import { VisualValidatorComponent } from "./visual-validator.component";

describe("VisualValidatorComponent", () => {
	let component: VisualValidatorComponent;
	let fixture: ComponentFixture<VisualValidatorComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [VisualValidatorComponent]
		})
			.compileComponents();

		fixture = TestBed.createComponent(VisualValidatorComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});

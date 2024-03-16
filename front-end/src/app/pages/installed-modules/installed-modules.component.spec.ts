import { ComponentFixture, TestBed } from "@angular/core/testing";

import { InstalledModulesComponent } from "./installed-modules.component";

describe("InstalledModulesComponent", () => {
	let component: InstalledModulesComponent;
	let fixture: ComponentFixture<InstalledModulesComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [InstalledModulesComponent]
		})
			.compileComponents();

		fixture = TestBed.createComponent(InstalledModulesComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});

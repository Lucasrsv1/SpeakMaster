import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportCommandsModalComponent } from "./import-commands-modal.component";

describe("ImportCommandsModalComponent", () => {
	let component: ImportCommandsModalComponent;
	let fixture: ComponentFixture<ImportCommandsModalComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ImportCommandsModalComponent]
		})
			.compileComponents();

		fixture = TestBed.createComponent(ImportCommandsModalComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});

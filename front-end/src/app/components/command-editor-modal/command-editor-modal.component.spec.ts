import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CommandEditorModalComponent } from "./command-editor-modal.component";

describe("CommandEditorModalComponent", () => {
	let component: CommandEditorModalComponent;
	let fixture: ComponentFixture<CommandEditorModalComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [CommandEditorModalComponent]
		})
			.compileComponents();

		fixture = TestBed.createComponent(CommandEditorModalComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});

import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CommandsTableComponent } from "./commands-table.component";

describe("CommandsTableComponent", () => {
	let component: CommandsTableComponent;
	let fixture: ComponentFixture<CommandsTableComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [CommandsTableComponent]
		})
			.compileComponents();

		fixture = TestBed.createComponent(CommandsTableComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});

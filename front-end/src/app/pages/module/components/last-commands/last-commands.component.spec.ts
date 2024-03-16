import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LastCommandsComponent } from "./last-commands.component";

describe("LastCommandsComponent", () => {
	let component: LastCommandsComponent;
	let fixture: ComponentFixture<LastCommandsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [LastCommandsComponent]
		})
			.compileComponents();

		fixture = TestBed.createComponent(LastCommandsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});

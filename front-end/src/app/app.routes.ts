import { Routes } from "@angular/router";

import { AuthenticationGuard } from "./guards/authentication/authentication.guard";
import { LoginGuard } from "./guards/login/login.guard";

import { AboutComponent } from "./pages/about/about.component";

export const routes: Routes = [
	// Public
	{ path: "about", component: AboutComponent },
	// { path: "login", component: LoginComponent, canActivate: [LoginGuard] },
	// { path: "signup", component: SignUpComponent, canActivate: [LoginGuard] },

	// Restricted
	// { path: "profile", component: ProfileComponent, canActivate: [AuthenticationGuard] },

	// No match
	{ path: "", redirectTo: "about", pathMatch: "full" },
	{ path: "**", redirectTo: "about" }
];

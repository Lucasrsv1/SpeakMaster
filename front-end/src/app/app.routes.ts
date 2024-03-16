import { Routes } from "@angular/router";

import { authenticationGuard } from "./guards/authentication/authentication.guard";
import { loginGuard } from "./guards/login/login.guard";

import { AboutComponent } from "./pages/about/about.component";

export const routes: Routes = [
	// Public
	{ path: "about", component: AboutComponent },
	{ path: "login", canActivate: [loginGuard], loadComponent: () => import("./pages/login/login.component").then(c => c.LoginComponent) },
	{ path: "sign-up", canActivate: [loginGuard], loadComponent: () => import("./pages/sign-up/sign-up.component").then(c => c.SignUpComponent) },

	// Restricted
	{ path: "profile", canActivate: [authenticationGuard], loadComponent: () => import("./pages/profile/profile.component").then(c => c.ProfileComponent) },
	{ path: "installed-modules", canActivate: [authenticationGuard], loadComponent: () => import("./pages/installed-modules/installed-modules.component").then(c => c.InstalledModulesComponent) },

	// No match
	{ path: "", redirectTo: "about", pathMatch: "full" },
	{ path: "**", redirectTo: "about" }
];

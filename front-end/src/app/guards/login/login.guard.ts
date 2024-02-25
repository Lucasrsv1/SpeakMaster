import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { AuthenticationService } from "../../services/authentication/authentication.service";

export const loginGuard: CanActivateFn = (route, state) => {
	const router = inject(Router);
	const authenticationService = inject(AuthenticationService);

	if (authenticationService.isLoggedIn()) {
		router.navigate(["profile"]);
		return false;
	}

	return true;
};

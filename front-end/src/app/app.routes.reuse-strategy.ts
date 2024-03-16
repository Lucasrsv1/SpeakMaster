/* eslint-disable dot-notation */

import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from "@angular/router";

export class AppRouteReuseStrategy extends BaseRouteReuseStrategy {
	public override shouldReuseRoute (future: ActivatedRouteSnapshot, current: ActivatedRouteSnapshot): boolean {
		if ("shouldReuse" in future.data)
			return future.data["shouldReuse"];

		return future.routeConfig === current.routeConfig;
	}
}

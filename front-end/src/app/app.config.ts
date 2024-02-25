import localePt from "@angular/common/locales/pt";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideRouter } from "@angular/router";
import { registerLocaleData } from "@angular/common";
import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from "@angular/core";
import { HTTP_INTERCEPTORS, provideHttpClient } from "@angular/common/http";

import { BlockUIModule } from "ng-block-ui";
import { defineLocale, ptBrLocale } from "ngx-bootstrap/chronos";

import { routes } from "./app.routes";

import { RequestInterceptor } from "./services/authentication/request.interceptor";

defineLocale("pt-br", ptBrLocale);
registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
	providers: [
		provideHttpClient(),
		provideRouter(routes),
		provideAnimationsAsync(),
		importProvidersFrom(BlockUIModule.forRoot()),
		{ provide: HTTP_INTERCEPTORS, useClass: RequestInterceptor, multi: true },
		{ provide: LOCALE_ID, useValue: "pt-BR" }
	]
};

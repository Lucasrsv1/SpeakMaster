import localePt from "@angular/common/locales/pt";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { registerLocaleData } from "@angular/common";
import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from "@angular/core";
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { provideRouter, RouteReuseStrategy, withRouterConfig } from "@angular/router";

import { BlockUIModule } from "ng-block-ui";
import { CodeEditorModule } from "@ngstack/code-editor";
import { ModalModule } from "ngx-bootstrap/modal";
import { provideScrollbarOptions } from "ngx-scrollbar";
import { provideToastr } from "ngx-toastr";
import { defineLocale, ptBrLocale } from "ngx-bootstrap/chronos";
import { SocketIoConfig, SocketIoModule } from "ngx-socket-io";

import { AppRouteReuseStrategy } from "./app.routes.reuse-strategy";
import { routes } from "./app.routes";

import { RequestInterceptor } from "./services/authentication/request.interceptor";

defineLocale("pt-br", ptBrLocale);
registerLocaleData(localePt);

const config: SocketIoConfig = { url: "http://localhost:2214" };

export const appConfig: ApplicationConfig = {
	providers: [
		provideHttpClient(
			withInterceptorsFromDi()
		),
		provideRouter(
			routes,
			withRouterConfig({ onSameUrlNavigation: "reload" })
		),
		provideAnimationsAsync(),
		importProvidersFrom(
			BlockUIModule.forRoot(),
			ModalModule.forRoot(),
			CodeEditorModule.forRoot({
				baseUrl: "assets/monaco"
			}),
			SocketIoModule.forRoot(config)
		),
		provideScrollbarOptions({ visibility: "hover" }),
		provideToastr({
			timeOut: 3000,
			progressBar: true,
			preventDuplicates: true,
			countDuplicates: true,
			resetTimeoutOnDuplicate: true
		}),
		{ provide: RouteReuseStrategy, useClass: AppRouteReuseStrategy },
		{ provide: HTTP_INTERCEPTORS, useClass: RequestInterceptor, multi: true },
		{ provide: LOCALE_ID, useValue: "pt-BR" }
	]
};

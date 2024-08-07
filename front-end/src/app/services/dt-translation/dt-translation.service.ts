import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class DtTranslationService {
	public getDataTablesPortugueseTranslation (emptyLabel: string = "Nenhum registro"): DataTables.LanguageSettings {
		return {
			emptyTable: emptyLabel,
			info: "Mostrando _START_ até _END_ de _TOTAL_ registros",
			infoEmpty: "Mostrando 0 até 0 de 0 registros",
			infoFiltered: "(Filtrados de _MAX_ registros)",
			infoPostFix: "",
			thousands: ".",
			lengthMenu: "_MENU_ resultados por página",
			loadingRecords: "Carregando...",
			processing: "Processando...",
			zeroRecords: "Nenhum registro encontrado",
			search: "Pesquisar:",
			paginate: {
				next: "Próximo",
				previous: "Anterior",
				first: "Primeiro",
				last: "Último"
			},
			aria: {
				sortAscending: ": Ordenar colunas de forma ascendente",
				sortDescending: ": Ordenar colunas de forma descendente"
			}
		};
	}
}

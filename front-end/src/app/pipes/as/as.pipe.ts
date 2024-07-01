import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
	name: "as",
	standalone: true
})
export class AsPipe implements PipeTransform {
	public transform<T> (value: unknown, _type: new (...args: any[]) => T): T {
		return value as T;
	}
}

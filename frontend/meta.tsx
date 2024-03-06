import { MenuElement } from "./menuElement";
import { type PropertyGeneric } from "./propertyGrid";

export interface MetaSelection {
	object: any;
	properties: PropertyGeneric[];
}

export interface MetaTab {
	title: string;
	content: React.ReactElement;
	closable?: boolean;
}

export interface MetaContext {
	object: any;
	menuElements: MenuElement[];
	onLoadTab: (tabId: string) => MetaTab | null;
}

export class Meta extends EventTarget {
	public static SELECTION_CHANGED = "sectionChanged";
	public static CONTEXT_CHANGED = "contextChanged";

	public selection: MetaSelection | null = null;
	public context: MetaContext | null = null;

	public static instance = new Meta();

	public setContext(context: MetaContext) {
		if (this.context === context || this.context?.object === context.object) {
			return;
		}
		this.context = context;
		this.dispatchEvent(new Event(Meta.CONTEXT_CHANGED));
	}

	public setSelection(selection: MetaSelection, context: MetaContext) {
		this.setContext(context);

		if (this.selection === selection || this.selection?.object === selection.object) {
			return;
		}
		this.dispatchEvent(new Event(Meta.SELECTION_CHANGED));
	}
}

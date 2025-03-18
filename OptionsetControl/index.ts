import { IInputs, IOutputs } from "./generated/ManifestTypes";
import './CSS/OptionsetControl.css';

export class OptionsetControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement;
    private _notifyOutputChanged: () => void;
    private _context: ComponentFramework.Context<IInputs>;
    private _value: number | null = null;
    private _defaultValue: number | undefined;
    private _colors: Record<number, string> = {};
    private _optionSetArray: ComponentFramework.PropertyHelper.OptionMetadata[] = [];
    private _mainContainer: HTMLDivElement;

    constructor() {
        //
    }

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this._container = container;
        this._context = context;
        this._notifyOutputChanged = notifyOutputChanged;
        context.mode.trackContainerResize(false);

        this._optionSetArray = context.parameters.OptionSetAttribute.attributes?.Options || [];
        this._colors = this.parseColors(context.parameters.colors?.raw ?? undefined);
        this._defaultValue = context.parameters.OptionSetAttribute.attributes?.DefaultValue;
        this._value = context.parameters.OptionSetAttribute.raw || this._defaultValue || null;

        this._mainContainer = document.createElement("div");
        this._mainContainer.className = "optionset-container";

        this.createButtons();
        container.appendChild(this._mainContainer);
        this.updateView(context);
    }

    private parseColors(rawColorData: string | undefined): Record<number, string> {
        if (!rawColorData) return {};
        try {
            const parsedData = JSON.parse(rawColorData);
            return typeof parsedData === "object" && parsedData !== null ? parsedData : {};
        } catch (error) {
            console.error("Error parsing colors JSON:", error);
            return {};
        }
    }

    private createButtons(): void {
        this._mainContainer.innerHTML = "";

        if (this._optionSetArray.length === 0) {
            const placeholderButton = document.createElement("button");
            placeholderButton.innerHTML = "No Options Available";
            placeholderButton.className = "option-button disabled";
            placeholderButton.disabled = true;
            this._mainContainer.appendChild(placeholderButton);
            return;
        }

        this._optionSetArray.forEach(option => {
            const button = document.createElement("button");
            button.innerHTML = option.Label;
            button.id = option.Value.toString();
            button.className = "option-button";
            button.style.background = this._colors[option.Value] || this.getSoftColor(option.Value);
            button.addEventListener("click", this.onButtonClick.bind(this));
            this._mainContainer.appendChild(button);
        });
    }

    private getSoftColor(value: number): string {
        const softColors = ["#ffadad", "#ffcf80", "#a0e3a0", "#80d4ff", "#d0b3ff", "#ffb3d1"];
        return softColors[value % softColors.length] || "#e0e0e0";
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this._colors = this.parseColors(context.parameters.colors?.raw ?? undefined);
        this._value = context.parameters.OptionSetAttribute.raw || this._defaultValue || null;

        Array.from(this._mainContainer.children).forEach((child, index) => {
            const button = child as HTMLButtonElement;
            const buttonValue = parseInt(button.id);

            button.classList.toggle("selected", this._value === buttonValue);
            button.style.background = this._value === buttonValue
                ? this.getSoftColor(index)
                : this._colors[buttonValue] || "#e0e0e0";

            button.disabled = context.mode.isControlDisabled;
        });
    }

    public getOutputs(): IOutputs {
        return {
            OptionSetAttribute: this._value == null ? -1 : this._value,
        };
    }

    private onButtonClick(event: Event): void {
        const selectedElement = event.target as HTMLButtonElement;
        const selectedValue = parseInt(selectedElement.id);
        this._value = this._value === selectedValue ? null : selectedValue;
        this._notifyOutputChanged();
    }

    public destroy(): void {
        this._mainContainer.innerHTML = "";
    }
}

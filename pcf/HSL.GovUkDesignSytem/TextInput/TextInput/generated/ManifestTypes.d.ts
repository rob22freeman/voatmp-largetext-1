/*
*This is auto generated from the ControlManifest.Input.xml file
*/

// Define IInputs and IOutputs Type. They should match with ControlManifest.
export interface IInputs {
    textInput: ComponentFramework.PropertyTypes.StringProperty;
    title: ComponentFramework.PropertyTypes.StringProperty;
    fieldIdentifierErrorMessage: ComponentFramework.PropertyTypes.StringProperty;
    hint: ComponentFramework.PropertyTypes.StringProperty;
    uniqueIdentifier: ComponentFramework.PropertyTypes.StringProperty;
    disablePageHeading: ComponentFramework.PropertyTypes.EnumProperty<"1">;
    fixedAndFluidWidthInputs: ComponentFramework.PropertyTypes.EnumProperty<"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12">;
    inputType: ComponentFramework.PropertyTypes.EnumProperty<"1" | "2">;
    prefix: ComponentFramework.PropertyTypes.StringProperty;
    suffix: ComponentFramework.PropertyTypes.StringProperty;
    maxInputLength: ComponentFramework.PropertyTypes.StringProperty;
    minInputLength: ComponentFramework.PropertyTypes.StringProperty;
    lowest: ComponentFramework.PropertyTypes.StringProperty;
    highest: ComponentFramework.PropertyTypes.StringProperty;
    specialCharacters: ComponentFramework.PropertyTypes.EnumProperty<"1">;
    specifyCharsNotAllowed: ComponentFramework.PropertyTypes.StringProperty;
    disableSpellcheck: ComponentFramework.PropertyTypes.EnumProperty<"1">;
    autocomplete: ComponentFramework.PropertyTypes.StringProperty;
}
export interface IOutputs {
    textInput?: string;
}

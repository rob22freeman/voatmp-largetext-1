/*
*This is auto generated from the ControlManifest.Input.xml file
*/

// Define IInputs and IOutputs Type. They should match with ControlManifest.
export interface IInputs {
    largeTextArea: ComponentFramework.PropertyTypes.StringProperty;
    title: ComponentFramework.PropertyTypes.StringProperty;
    fieldIdentifierErrorMessage: ComponentFramework.PropertyTypes.StringProperty;
    hint: ComponentFramework.PropertyTypes.StringProperty;
    uniqueIdentifier: ComponentFramework.PropertyTypes.StringProperty;
    disablePageHeading: ComponentFramework.PropertyTypes.EnumProperty<"1">;
    textAreaSize: ComponentFramework.PropertyTypes.StringProperty;
    inputType: ComponentFramework.PropertyTypes.EnumProperty<"1" | "2">;
    maxInputLength: ComponentFramework.PropertyTypes.StringProperty;
    minInputLength: ComponentFramework.PropertyTypes.StringProperty;
    specialCharacters: ComponentFramework.PropertyTypes.EnumProperty<"1">;
    specifyCharsNotAllowed: ComponentFramework.PropertyTypes.StringProperty;
}
export interface IOutputs {
    largeTextArea?: string;
}

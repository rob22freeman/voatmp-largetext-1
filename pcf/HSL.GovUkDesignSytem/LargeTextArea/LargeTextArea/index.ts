	import { IInputs, IOutputs } from "./generated/ManifestTypes";

	//Import Nunjucks libraries
	import * as Nunjucks from "nunjucks";
	import { parse } from "path";
	import { Context } from "vm";

	export class LargeTextArea implements ComponentFramework.StandardControl<IInputs, IOutputs> {
	
		// Value of the column is stored and used inside the component
		private _value: string | null;

		// Reference to the control container HTMLDivElement
		// This element contains all elements of our custom control example
		private _container: HTMLDivElement;
	
	  	// reference to Power Apps component framework Context object
	  	private _context: ComponentFramework.Context<IInputs>;

		// PCF framework delegate which will be assigned to this object which would be called whenever any update happens
		private _notifyOutputChanged: () => void;

		// Event Handler 'refreshData' reference
		private _refreshData: EventListenerOrEventListenerObject;
		
		// Configuration for disabling page heading
		private _disablePageHeadingIsTrue: boolean;
		private _disablePageHeading: any;

		// Configuration options for size of input box
		private _textAreaSizeDefined: string | undefined;
		private _textAreaSize: string | undefined;

		// Configuration for max or min character input length
		private _maxInputLength: string | undefined;
		private _minInputLength: string | undefined;

		// Configuration for special characters not allowed
		private _onlyAllowStandardChars: boolean;
		private _specifyCharsNotAllowed: string | undefined;

		// Elements needed for setting up error messages 
		private _formGroupDiv: HTMLDivElement;
		private _titleDiv: HTMLLabelElement;
		private _hintDiv: HTMLDivElement;
		
		// Text input field
		private _textInput: HTMLInputElement;

		// Validation and unique identifier
		private _enableValidation : boolean;		
		private _uniqueIdentifier: string;
		private _textInputId: string;
		private _errorFocusId: string;
		
		// Heading (what is being asked for), Field Identifier (for the error messaging), Hint
		private _title: string;
		private _fieldIdentifier: string;
	  	private _hint: string;
		private _hintId: string;

		// Error message to be displayed
		private _errorMessage: string;
		private _itemId: string;
		private _containerLabel: string;

		/**
		 * Empty constructor.
		 */
		constructor() {
			// no-op: method not leveraged by this example custom control
		}
	
		/**
		 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
		 * Data-set values are not initialized here, use updateView.
		 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
		 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
		 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
		 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
		 */
		public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement): void {
			
			this.registerNunjucks();

			// Add control initialization code
			this._context = context;
			this._notifyOutputChanged = notifyOutputChanged;
			this._refreshData = this.refreshData.bind(this);
			
			// The unique identifier should be configured to the field logical name - required so should never be null
			this._uniqueIdentifier = context.parameters.uniqueIdentifier.raw as string;

			this._title = context.parameters.title.raw as string;
			this._hint = context.parameters.hint.raw as string;
			this._textInputId = this._uniqueIdentifier as string;

			// The unique identifier should be configured to the field logical name
			this._uniqueIdentifier = context.parameters.uniqueIdentifier.raw as string; // Required so should never be null

			// Concatenate the unique identifier with elements of the control to provide IDs
			this._hintId = this._uniqueIdentifier + "-hint";

			// The Portal automatically generates a container for the PCF which is the field logical name suffixed with "_Container"
			this._containerLabel = this._uniqueIdentifier + "_Container";

			// Configuration methods
			this.textAreaSize();
			this.disablePageHeading(this._title);

			//Configure and render Nunjucks templates
			require('govuk-frontend');

			const runOnServer = "http://127.0.0.1:8080/";
			const templatePath = "node_modules/govuk-frontend/govuk/components/";
			const env = Nunjucks.configure(runOnServer + templatePath);
			
			const renderedNunjucksTemplate = env.render('/textarea/template.njk',{params:{
				name: this._uniqueIdentifier,
				id: this._uniqueIdentifier,
				rows: this._textAreaSize,
				label: this._disablePageHeading,
				hint: {
				  text: this._hint
				} }});
			
			this._container = document.createElement("div");
			this._container.innerHTML =

			// Override that PCF Test Environment aligns to centre
			"<style>.control-pane{text-align:unset;}</style>\n"
			+ renderedNunjucksTemplate;

			// Add the entire container to the control's main container
			container.appendChild(this._container);
			
			this._formGroupDiv = document.getElementsByClassName("govuk-form-group")[0] as HTMLDivElement;
			this._titleDiv = document.getElementsByTagName("label")[0] as HTMLLabelElement
			this._hintDiv = document.getElementById(this._hintId) as HTMLDivElement;

			this._textInput = document.getElementById(this._textInputId) as HTMLInputElement;
			this._textInput.addEventListener("change", this._refreshData);
			
			this.removeHintDiv();
			this.registerPCFComponent(this);
			this.pageValidation();
		};

		/**
		 * Remove hint div from control if no hint text is required.
		 */
		public removeHintDiv () {
			if (this._hint === undefined) {
				this._hintDiv.remove();
			}
		};

		/**
		 * Show error on control.
		 * @param errorMessageText Error message to display
		 */
		 public ShowError(errorMessageText : string) {
			
			// Hide error message if one already exists
			this.HideError();

			this._formGroupDiv.classList.add("govuk-form-group--error");

			let errorMessageId = "errorMessage";

			// Create and add error message span
			let errorMessageSpan = document.createElement("span");
			errorMessageSpan.classList.add("govuk-error-message");
			errorMessageSpan.id = errorMessageId;
			errorMessageSpan.innerHTML = "<span class=\"govuk-visually-hidden\">Error:</span> " + errorMessageText;

			// Show the error message in the right place on the control depending on whether a hint is included or not
			if (this._hint === undefined) {
				this._titleDiv.after(errorMessageSpan);
			} else {
				this._hintDiv.after(errorMessageSpan);
			};
			
			// Add error message to field set's aria-describedby attribute,
			// if it doesn't already exist
			let ariaDescribedBy = this._formGroupDiv.getAttribute("aria-describedby");
			let ariaDescribedByList = ariaDescribedBy?.split(" ");
			let hasAriaDescribedByListGotId = ariaDescribedByList?.includes(errorMessageId);
			
			if (!hasAriaDescribedByListGotId) {
				ariaDescribedByList?.push(errorMessageId);
			}

			this._formGroupDiv.setAttribute("aria-describedby", ariaDescribedByList?.join(" ") ?? "");

			// Apply error highlighting styling to text input field
			this._textInput.classList.add("govuk-input--error");

			// Store error message for use in page level validation
			this._errorMessage = errorMessageText;
		}

		/**
		 * Hide error on control.
		 */
		private HideError() {
			
			let errorMessageId = "errorMessage";

			// Remove form group div error styling if it's present
			this._formGroupDiv.classList.remove("govuk-form-group--error");

			// Delete error message div if it exists
			let errorMessageDiv = document.getElementById(errorMessageId);
			errorMessageDiv?.remove();

			// Remove error message from field set's aria-describedby attribute, if it exists
			let ariaDescribedBy = this._formGroupDiv.getAttribute("aria-describedby");
			let ariaDescribedByList = ariaDescribedBy?.split(" ");
			let AriaDescribedByListErrorIdIndex = ariaDescribedByList?.indexOf(errorMessageId) ?? -1;
			
			if (AriaDescribedByListErrorIdIndex !== -1) {
				ariaDescribedByList?.splice(AriaDescribedByListErrorIdIndex, 1);
			}

			this._formGroupDiv.setAttribute("aria-describedby", ariaDescribedByList?.join(" ") ?? "");

			// Remove error styles from input field
			this._textInput.classList.remove("govuk-input--error");
		}

		/**
		 * Updates the values to the internal value variable we are storing and also updats the html label that displays the value
		 * @param context This "Input Properties" containing the parameters, component metadata and interface functions 
		 */
		 public refreshData (evt: Event): void {
			
			let doValidation: boolean = this._enableValidation || ((this._textInput.value) as unknown as boolean);

			if (doValidation) {
				if (!this._enableValidation) {
					this._enableValidation = true;
				}

				let inputIsValid: boolean = this.performInputValidation();

				if (inputIsValid) {
					this._value = this._textInput.value;
					this._notifyOutputChanged();
				}
			}
		}

		/**
		 * Validates contents of input fields and updates UI with appropriate error messages.
		 * @returns {boolean} True if validation passed. Otherwise, false.
		 * @private
		 */
		 private performInputValidation() : boolean {
			
			let fieldIdentifier = this._fieldIdentifier = this._context.parameters.fieldIdentifierErrorMessage.raw as string;
			let isInputValid : boolean = true;

			// Reset error state
			this.HideError();

			isInputValid &&= this.handleIfInputIsEmpty(fieldIdentifier);
			isInputValid &&= this.handleIfInputHasBothMinAndMaxLength(fieldIdentifier);
			isInputValid &&= this.handleIfInputIsTooLong(fieldIdentifier);
			isInputValid &&= this.handleIfInputIsTooShort(fieldIdentifier);
			isInputValid &&= this.handleIfSpecifiedCharactersAreNotAllowed(fieldIdentifier);
			isInputValid &&= this.handleIfOnlyStandardCharactersAreAllowed(fieldIdentifier);

			return isInputValid;
		}

		private pageValidation() {

			let _window = window as any;
			if (typeof (_window.Page_Validators) == "undefined") {
				return;
			}
		
			let newValidator = (document.createElement('span') as any); //any = custom properties for val
			newValidator.style.display = "none";
			newValidator.id = this._uniqueIdentifier + "Validator";
			newValidator.controltovalidate = this._uniqueIdentifier;
			newValidator.evaluationfunction = function () {
		
				let result = _window.HSL.PCFRegistrar[this.controltovalidate].performInputValidation();
				this.isvalid = result;
		
				if (!this.isvalid) {
					let errorMessageText = _window.HSL.PCFRegistrar[this.controltovalidate]._errorMessage;
					this.errormessage = "<a href='#" + _window.HSL.PCFRegistrar[this.controltovalidate]._containerLabel + "' onclick=\"javascript: scrollToAndFocus('" + _window.HSL.PCFRegistrar[this.controltovalidate]._containerLabel + "', '" + _window.HSL.PCFRegistrar[this.controltovalidate]._errorFocusId + "'); return false;\">" + errorMessageText + "</a>";
				} else {
					this.errormessage = null;
				}
			}
		
			_window.Page_Validators.push(newValidator);
		}

		/**
		 * UTILITY METHOD:
		 * Capitalises first letter of error message for showError output
		 * @param string {string} Error message to have first letter capitalised.
		 * @returns {string} Error message with first letter capitalised.
		 */
		private firstCharUpperCase(string: string): string {

			return string.charAt(0).toUpperCase() + string.slice(1);
		}	

		/**
		 * UTILITY METHOD:
		 * Converts first letter of error message for showError output to lowercase (acting as a fail safe so the correct format is always displayed)
		 * @param string {string} Error message to have first letter converted to lowercase.
		 * @returns {string} Error message with first letter converted to lowercase.
		 */
		 private firstCharLowerCase(string: string): string {
			
			return string.charAt(0).toLowerCase() + string.slice(1);
		}

		/**
		 * ERROR VALIDATION: 
		 * Handle if input is empty. Say 'Enter [whatever it is]', for example, 'Enter your first name'.
		 * @param fieldIdentifier {string} Indentify the name of the field to display in the error messages
		 * @returns {boolean} Return true if nothing has been entered, otherwise false;
		 * @private
		 */
		private handleIfInputIsEmpty (fieldIdentifier: string): boolean {

			let inputIsEmpty = !this._textInput.value

			if (inputIsEmpty) {

				this.ShowError('Enter ' + this.firstCharLowerCase(fieldIdentifier));
				this._errorFocusId = this._textInputId;
			}

			return !inputIsEmpty;
		}

		/**
		 * ERROR VALIDATION: 
		 * Handle if the input is too long. Say '[whatever it is] must be [number] characters or fewer', 
		 * for example, 'Address line 1 must be 35 characters or fewer'.
		 * Maximum input length automatically configured in Control Manifest if a fixed width option is selected, otherwise a custom
		 * value (optional) can be selected.
		 * @param fieldIdentifier {string} Indentify the name of the field to display in the error messages
		 * @returns {boolean} Return true if nothing has been entered, otherwise false;
		 * @private
		 */
		private handleIfInputIsTooLong (fieldIdentifier: string): boolean {

			this._maxInputLength = (this._context.parameters.maxInputLength.raw == undefined) ? undefined : this._context.parameters.maxInputLength.raw;
			let maxInputLengthValue: any = this._maxInputLength;

			if (maxInputLengthValue == undefined) {
				return true;
			}

			let inputText = this._textInput.value; 
			let isInputTooLong = (maxInputLengthValue != undefined) ? (inputText.length > maxInputLengthValue ? true : false) : false;
			
			if (isInputTooLong) {

				this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be " + maxInputLengthValue + " characters or fewer");
				this._errorFocusId = this._textInputId;
			}

			return !isInputTooLong;
		}

		/**
		 * ERROR VALIDATION: 
		 * Handle if the input is too short. Say '[whatever it is] must be [number] characters or more', 
		 * for example, 'Full name must be 2 characters or more'.
		 * Minimum input length not set by default, unless a custom value is selected via the Control Manifest.
		 * @param fieldIdentifier {string} Indentify the name of the field to display in the error messages
		 * @returns {boolean} Return true if nothing has been entered, otherwise false;
		 * @private
		 */
		private handleIfInputIsTooShort (fieldIdentifier: string): boolean {

			this._minInputLength = (this._context.parameters.minInputLength.raw == undefined) ? undefined : this._context.parameters.minInputLength.raw;
			let minInputLengthValue: any = this._minInputLength;	

			if (minInputLengthValue == undefined) {
				return true;
			}

			let inputText = this._textInput.value;
			let isInputTooShort = (minInputLengthValue != undefined) ? (inputText.length < minInputLengthValue ? true : false) : false;

			if (isInputTooShort) {

				this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be " + minInputLengthValue + " characters or more");
				this._errorFocusId = this._textInputId;
			}

			return !isInputTooShort;
		}

		/**
		 * ERROR VALIDATION: 
		 * Handle if the input has both a minimum and maximum length. 
		 * Say '[whatever it is] must be between [number] and [number] characters', for example, 'Last name must be between 2 and 35 characters'.
		 * If a value for both minimum and maximum length is selected via the Control Manifest this validation method applies.
		 * @param fieldIdentifier {string} Indentify the name of the field to display in the error messages
		 * @returns {boolean} Return true if nothing has been entered, otherwise false;
		 * @private
		 */
		 private handleIfInputHasBothMinAndMaxLength (fieldIdentifier: string): boolean {

			this._maxInputLength = (this._context.parameters.maxInputLength.raw == undefined) ? undefined : this._context.parameters.maxInputLength.raw;
			this._minInputLength = (this._context.parameters.minInputLength.raw == undefined) ? undefined : this._context.parameters.minInputLength.raw;

			let maxInputLengthValue: any = this._maxInputLength;
			let minInputLengthValue: any = this._minInputLength;
			
			let inputText = this._textInput.value;

			// If both a maximum and minimum length (either automatically or user entered) have been specified, then check
			// that the maximum length (either specified automatically or user entered) is greater than the minimum length.
			// Return false if there is not both a maximum and minimum, or if the maximum is not greater than the minimum, otherwise true.
			let checkMaxGtMin = (maxInputLengthValue != undefined && minInputLengthValue != undefined) ? ((maxInputLengthValue > minInputLengthValue) ? true : false): false;
			let isInputBetween = (checkMaxGtMin) ? (((inputText.length >= maxInputLengthValue) && (inputText.length <= minInputLengthValue)) ? true : false) : false;

			if (isInputBetween) {

				this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be between " + minInputLengthValue + " and " + maxInputLengthValue + " characters");
				this._errorFocusId = this._textInputId;
			}

			return !isInputBetween;
		}

		/**
		 * ERROR VALIDATION: 
		 * Handle if the the input uses characters that are not allowed and you know what the characters are, For example, 
		 * ‘Town or city must not include è and £’. Characters allowed can be determined from selections made via the Control Manifest.
		 * @param fieldIdentifier {string} Indentify the name of the field to display in the error messages
		 * @returns {boolean} Return true if nothing has been entered, otherwise false;
		 * @private
		 */
		 private handleIfSpecifiedCharactersAreNotAllowed (fieldIdentifier: string): boolean {

			this._onlyAllowStandardChars = (!this._context.parameters.specialCharacters.raw) ? false : this._context.parameters.specialCharacters.raw == "1";
			this._specifyCharsNotAllowed = (this._context.parameters.specifyCharsNotAllowed.raw == undefined) ? undefined : this._context.parameters.specifyCharsNotAllowed.raw;

			// Check onlyAllowStandardChars is not selected and specifyCharsNotAllowed is undefined and if neither have been entered,
			// then return false. If this statement returns true, then check whether a value has been entered for specifyCharsNotAllowed.
			// If that is the case, then default to validating the input based on those criteria, otherwise return true and enable this method.
			let charValidationRqrd = (!this._onlyAllowStandardChars && this._specifyCharsNotAllowed == undefined) ? false : (this._specifyCharsNotAllowed != undefined) ? true : false;

			if (!charValidationRqrd) {
				return true;
			}

			let specifyCharsNotAllowedRgx: any = this._specifyCharsNotAllowed?.replace(", ", "");

			const charsNotAllowed = new RegExp(`[${specifyCharsNotAllowedRgx}]`);

			let inputText = this._textInput.value;
			const mustOnlyIncludeCharsAllowed = inputText.match(charsNotAllowed) ? true : false;

			let specifyCharsNotAllowed: any = this._specifyCharsNotAllowed;

			if (mustOnlyIncludeCharsAllowed) {

				let errorMessage = this.firstCharUpperCase(fieldIdentifier) + " must not include ";
				let errorFieldDescriptors: string[] = [];
					errorFieldDescriptors.push(specifyCharsNotAllowed);
				
					errorMessage += errorFieldDescriptors.join(', ')

				let lastIndexOfCommaSpace = errorMessage.lastIndexOf(', ')
				errorMessage = errorMessage.slice(0, lastIndexOfCommaSpace) + errorMessage.slice(lastIndexOfCommaSpace).replace(', ', ' or ');
				
				this.ShowError(errorMessage);
				this._errorFocusId = this._textInputId;
			}
			
			return !mustOnlyIncludeCharsAllowed;
		}

		/**
		 * ERROR VALIDATION: 
		 * Handle if the the input uses characters that are not allowed from a standard selection. For example, 
		 * ‘Full name must only include letters a to z, hyphens, spaces and apostrophes’.
		 * @param fieldIdentifier {string} Indentify the name of the field to display in the error messages
		 * @returns {boolean} Return true if nothing has been entered, otherwise false;
		 * @private
		 */
		 private handleIfOnlyStandardCharactersAreAllowed (fieldIdentifier: string): boolean {

			this._onlyAllowStandardChars = (!this._context.parameters.specialCharacters.raw) ? false : this._context.parameters.specialCharacters.raw == "1";
			this._specifyCharsNotAllowed = (this._context.parameters.specifyCharsNotAllowed.raw == undefined) ? undefined : this._context.parameters.specifyCharsNotAllowed.raw;

			// Check onlyAllowStandardChars is not selected and specifyCharsNotAllowed is undefined and if neither have been entered,
			// then return false. If this statement returns true, then check whether a value has been entered for specifyCharsNotAllowed.
			// If that is the case, then default to validating the input based on those criteria, otherwise return true and enable this method.
			let charValidationRqrd = (!this._onlyAllowStandardChars && this._specifyCharsNotAllowed == undefined) ? false : (this._specifyCharsNotAllowed != undefined) ? false : true;

			if (!charValidationRqrd) {
				return true;
			}

			let inputText = this._textInput.value;
			const charsAllowed = /^[a-zA-Z-' ]+$/;
			const mustOnlyIncludeCharsAllowed = !inputText.match(charsAllowed);

			if (mustOnlyIncludeCharsAllowed) {

				this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must only include letters a to z, hyphens, spaces and apostrophes");
				this._errorFocusId = this._textInputId;
			}

			return !mustOnlyIncludeCharsAllowed;
		 }

		/**
		 * COMPONENT CONFIGURATION:
		 * Following guidance from GOV UK Design System: "if you're asking more than one question on the page, do not set the
		 * contents of <label> as the page heading." https://design-system.service.gov.uk/components/textarea/
		 * @param title {string} What information do you intend to capture?
		 * @returns {any} Returns control title only if true, or title plus page heading config if false.
		 * @private
		 */
		private disablePageHeading (_title: string) {

			this._disablePageHeadingIsTrue = this._context.parameters.disablePageHeading.raw =="1";

			if (!this._disablePageHeadingIsTrue) {

				this._disablePageHeading = {text: this._title, classes: "govuk-label--l", isPageHeading: true};
			} 
			
			else {

				this._disablePageHeading = {text: this._title};
			}	
		};
		
		/**
		 * COMPONENT CONFIGURATION:
		 * Configure the size of the text input box if necessary, following guidance from GOVUK Design System: 
		 * Make the height of a textarea proportional to the amount of text you expect users to enter. 
		 * You can set the height of a textarea by by specifying the rows attribute. 
		 * https://design-system.service.gov.uk/components/textarea/
		 */
		private textAreaSize () {

			this._textAreaSizeDefined = (this._context.parameters.textAreaSize.raw == undefined) ? undefined : this._context.parameters.textAreaSize.raw;

			if (this._textAreaSizeDefined != undefined) {

				return this._textAreaSize = this._textAreaSizeDefined;
			}
		}

		/**
		 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
		 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
		 */
		public updateView(context: ComponentFramework.Context<IInputs>): void {	
			
		// storing the latest context from the control.
		this._value = context.parameters.largeTextArea.raw;
	  	this._context = context;
			
			if (this._value) {

				this._textInput.value = this._value;

				// Field has been set, start validation following any changes
				this._enableValidation = true;
			}
		}
	
		/** 
		 * It is called by the framework prior to a control receiving new data. 
		 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
		 */
		public getOutputs(): IOutputs {

			// Send the currently selected options back to the ComponentFramework
			return {

				largeTextArea: (this._value === null ? undefined : this._value)
			};
		}
	
		/** 
		 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
		 * i.e. cancelling any pending remote calls, removing listeners, etc.
		 */
		public destroy(): void {

			// no-op: method not leveraged by this example custom control
		}

		private registerPCFComponent(currentInstance:LargeTextArea) : void {
			
			let globalScope = (window as any);
			
			if (!globalScope.HSL) {
				globalScope.HSL = {};
			}
			
			if (!globalScope.HSL.PCFRegistrar) {
				globalScope.HSL.PCFRegistrar = {};
			}

			globalScope.HSL.PCFRegistrar[this._uniqueIdentifier] = currentInstance;
		};

		private registerNunjucks() : void
		{
			let globalScope = (window as any);
			globalScope.nunjucks = Nunjucks;
			
			//reconfigure template render to understand relative paths
			globalScope.nunjucks.Environment.prototype.resolveTemplate = function resolveTemplate(loader:any, parentName:any, filename:any) {
				let isRelative = loader.isRelative && parentName ? loader.isRelative(filename) : false;
				return isRelative && loader.resolve ? filename.replace('..', '').replace('./', parentName.substring(0, parentName.lastIndexOf("/")) + '/') : filename;
			};
		}
	}

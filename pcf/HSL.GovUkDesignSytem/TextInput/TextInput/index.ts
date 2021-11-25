	import { IInputs, IOutputs } from "./generated/ManifestTypes";

	//Import Nunjucks libraries
	import * as Nunjucks from "nunjucks";
	import { parse } from "path";
	import { Context } from "vm";

	export class TextInput implements ComponentFramework.StandardControl<IInputs, IOutputs> {
	
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

		// Configuration options for width of input box
		private _fixedAndFluidWidthInputsClass: string;
		private _characterWidth2: boolean;
		private _characterWidth3: boolean;
		private _characterWidth4: boolean;
		private _characterWidth5: boolean;
		private _characterWidth10: boolean;
		private _characterWidth20: boolean;
		private _fullWidth: boolean;
		private _threeQuartersWidth: boolean;
		private _twoThirdsWidth: boolean;
		private _oneHalfWidth: boolean;
		private _oneThirdWidth: boolean;
		private _oneQuarterWidth: boolean;

		// Configuration option for input type
		private _wholeNumber: boolean;
		private _mustBeANumber: boolean;
		private _inputmode: string;
		private _pattern: string;

		// Configuration options for spellcheck (on or off)
		private _spellcheck: boolean;
		private _disableSpellcheck: boolean;

		// Configuration for autocomplete
		private _autocomplete: string | undefined;
		private _autocompleteEnabled: string | undefined;

		// Configuration for prefix and/or suffix
		private _prefix: string | undefined;
		private _suffix: string | undefined;

		// Configuration for max or min character input length
		private _maxInputLength: string | undefined;
		private _minInputLength: string | undefined;

		// Configuration for lowest or highest bounds
		private _lowest: string | undefined;
		private _highest: string | undefined;

		// Configuration for special characters not allowed
		private _onlyAllowStandardChars: boolean;
		private _specifyCharsNotAllowed: string | undefined;

		// Elements needed for setting up error messages 
		private _formGroupDiv: HTMLDivElement;
		private _titleDiv: HTMLLabelElement;
		private _hintDiv: HTMLDivElement;
		private _textInputDiv: HTMLDivElement;
		
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
			this.fixedAndFluidWidthInputs();
			this.disablePageHeading(this._title);
			this.inputType();
			this.prefixSuffix();
			this._spellcheck = this.disableSpellcheck();
			this.autocomplete();

			//Configure and render Nunjucks templates
			require('govuk-frontend');

			const runOnServer = "http://127.0.0.1:8080/";
			const templatePath = "node_modules/govuk-frontend/govuk/components/";
			const env = Nunjucks.configure(runOnServer + templatePath);
			
			const renderedNunjucksTemplate = env.render('/input/template.njk',{params:{
				label: this._disablePageHeading,
				  prefix: {
					text: this._prefix
				  },
				  suffix: {
					text: this._suffix
				  },
				  classes: this._fixedAndFluidWidthInputsClass,
				  hint: {
					text: this._hint
				  },
				  id: this._uniqueIdentifier,
				  name: this._uniqueIdentifier,
				  inputmode: this._inputmode,
				  pattern: this._pattern,
				  spellcheck: this._spellcheck,
				  autocomplete: this._autocomplete
				} });
			
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
			this._textInputDiv = document.getElementsByClassName("govuk-input " + this._fixedAndFluidWidthInputsClass)[0] as HTMLDivElement;

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
			isInputValid &&= this.handleIfInputIsNotAWholeNumber(fieldIdentifier);
			isInputValid &&= this.handleIfInputIsNotANumber(fieldIdentifier);
			isInputValid &&= this.handleIfInputMustBeBetweenTwoNumbers(fieldIdentifier);
			isInputValid &&= this.handleIfInputIsTooLow(fieldIdentifier);
			isInputValid &&= this.handleIfInputIsTooHigh(fieldIdentifier);

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
		 * Capitalises first letter of error message for showError output
		 * @param string {string} Error message to have first letter capitalised.
		 * @returns {string} Error message with first letter capitalised.
		 */
		private firstCharUpperCase(string: string): string {

			return string.charAt(0).toUpperCase() + string.slice(1);
		}	

		/**
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

			this._characterWidth2 = this._context.parameters.fixedAndFluidWidthInputs.raw == "1";
			this._characterWidth3 = this._context.parameters.fixedAndFluidWidthInputs.raw == "2";
			this._characterWidth4 = this._context.parameters.fixedAndFluidWidthInputs.raw == "3";
			this._characterWidth5 = this._context.parameters.fixedAndFluidWidthInputs.raw == "4";
			this._characterWidth10 = this._context.parameters.fixedAndFluidWidthInputs.raw == "5";
			this._characterWidth20 = this._context.parameters.fixedAndFluidWidthInputs.raw == "6";
			this._maxInputLength = (this._context.parameters.maxInputLength.raw == undefined) ? undefined : this._context.parameters.maxInputLength.raw;

			// Set the max character length of the input field to fixed character width if selected, for example:
			// if "2 character width" is chosen, set the max character length to 2, or use the value of the 
			// "Max input length" setting if one has been defined, otherwise return undefined.
			let maxInputLengthValue = 
			(
				(this._characterWidth2) ? 2 : 
				(this._characterWidth3) ? 3 :
				(this._characterWidth4) ? 4 :
				(this._characterWidth5) ? 5 :
				(this._characterWidth10) ? 10 :
				(this._characterWidth20) ? 20 :
				this._maxInputLength
			);

			if (!maxInputLengthValue) {
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
			let minInputLengthValue = this._minInputLength;	

			if (minInputLengthValue == undefined) {
				return true;
			}

			let inputText = this._textInput.value;
			let isInputTooShort = (minInputLengthValue != undefined) ? (inputText.length < parseInt(minInputLengthValue) ? true : false) : false;

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

			this._characterWidth2 = this._context.parameters.fixedAndFluidWidthInputs.raw == "1";
			this._characterWidth3 = this._context.parameters.fixedAndFluidWidthInputs.raw == "2";
			this._characterWidth4 = this._context.parameters.fixedAndFluidWidthInputs.raw == "3";
			this._characterWidth5 = this._context.parameters.fixedAndFluidWidthInputs.raw == "4";
			this._characterWidth10 = this._context.parameters.fixedAndFluidWidthInputs.raw == "5";
			this._characterWidth20 = this._context.parameters.fixedAndFluidWidthInputs.raw == "6";
			this._maxInputLength = (this._context.parameters.maxInputLength.raw == undefined) ? undefined : this._context.parameters.maxInputLength.raw;
			this._minInputLength = (this._context.parameters.minInputLength.raw == undefined) ? undefined : this._context.parameters.minInputLength.raw;

			// Set the max character length of the input field to fixed character width if selected, for example:
			// if "2 character width" is chosen, set the max character length to 2, or use the value of the 
			// "Max input length" setting if one has been defined, otherwise return undefined.
			let maxInputLengthValue: any = 
			(
				(this._characterWidth2) ? 2 : 
				(this._characterWidth3) ? 3 :
				(this._characterWidth4) ? 4 :
				(this._characterWidth5) ? 5 :
				(this._characterWidth10) ? 10 :
				(this._characterWidth20) ? 20 :
				this._maxInputLength
			);

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
		 * ERROR VALIDATION: 
		 * Handle if the input is not a whole number. Say '[whatever it is] must be a whole number', 
		 * for example, 'Hours worked in a week must be a whole number'.
		 * @param fieldIdentifier {string} Indentify the name of the field to display in the error messages
		 * @returns {boolean} Return true if nothing has been entered, otherwise false;
		 * @private
		 */
		private handleIfInputIsNotAWholeNumber (fieldIdentifier: string): boolean {

			this._wholeNumber = (!this._context.parameters.inputType.raw) ? false : this._context.parameters.inputType.raw == "1";
			this._prefix = this._context.parameters.prefix.raw = "£";

			if (!this._wholeNumber) {
				return true;
			}

			let inputText = this._textInput.value;
			const numbers = /^[0-9]+$/;
			const mustBeAWholeNumber = !inputText.match(numbers);

			if (mustBeAWholeNumber) {

				// If a prefix is selected and it's value equals "£", validate input based on guidance from GOVUK Design System:
				// "If the input is amount of money that must not have decimals". https://design-system.service.gov.uk/components/text-input/
				// Otherwise, evaluate as per the guidance at the start of this method.
				if (!this._prefix) {

					this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be a whole number");
					this._errorFocusId = this._textInputId;

				} else {

					this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be a whole number and not include pence, like 123 or 156");
					this._errorFocusId = this._textInputId;
				}
			}

			return !mustBeAWholeNumber;
		}

		/**
		 * ERROR VALIDATION: 
		 * Handle if the input is not a number, including decimals. Say '[whatever it is] must be a number', 
		 * for example, 'Hours worked in a week must be a number'. If the input requires a decimal, use a decimal in the example. 
		 * If the input allows both whole numbers and decimals, use both in the example.
		 * @param fieldIdentifier {string} Indentify the name of the field to display in the error messages
		 * @returns {boolean} Return true if nothing has been entered, otherwise false;
		 * @private
		 */
		 private handleIfInputIsNotANumber (fieldIdentifier: string): boolean {
			
			this._mustBeANumber = (!this._context.parameters.inputType.raw) ? false : this._context.parameters.inputType.raw == "2";
			this._prefix = this._context.parameters.prefix.raw = "£";

			if (!this._mustBeANumber) {
				return true;
			}

			let inputText = this._textInput.value;
			const decimals = /^[.0-9]+$/
			const mustBeANumber = !inputText.match(decimals);

			if (mustBeANumber) {

				// If a prefix is selected and it's value equals "£", validate input based on guidance from GOVUK Design System:
				// "If the input is amount of money that needs decimals". https://design-system.service.gov.uk/components/text-input/
				// Otherwise, evaluate as per the guidance at the start of this method.
				if (!this._prefix) {
				
					this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be a number");
					this._errorFocusId = this._textInputId;	

				} else {

					this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be a number and include pence, like 123.45 or 156.00");
					this._errorFocusId = this._textInputId;
				}
			}

			return !mustBeANumber;
		}

		/**
		 * ERROR VALIDATION: 
		 * Handle if the input must be between 2 numbers. Say ‘[whatever it is] must be between [lowest] and [highest]’.
		 * For example, ‘Hours worked a week must be between 16 and 99’. Set the lower and higher bounds via the Control Manifest.
		 * @param fieldIdentifier {string} Indentify the name of the field to display in the error messages
		 * @returns {boolean} Return true if nothing has been entered, otherwise false;
		 * @private
		 */
		 private handleIfInputMustBeBetweenTwoNumbers (fieldIdentifier: string): boolean {
			
			this._lowest = (this._context.parameters.lowest.raw == undefined) ? undefined : this._context.parameters.lowest.raw;
			this._highest = (this._context.parameters.highest.raw == undefined) ? undefined : this._context.parameters.highest.raw;
			
			let lowest: any = this._lowest;
			let highest: any = this._highest;
			
			let inputText: any = this._textInput.value;
			
			// Check whether a value has been provided for both the lower and higher bounds, return true otherwise false.
			let useMustBeBetween = (lowest != undefined && highest != undefined) ? true : false;

			// If a value has been provided for both the lower and higher bounds, then check that input falls between those values.
			let mustBeBetween = (useMustBeBetween) ? (((parseFloat(inputText) >= parseFloat(lowest)) && (parseFloat(inputText) <= parseFloat(highest))) ? false : true) : false;

			if (mustBeBetween) {

				this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be between " + lowest + " and " + highest);
				this._errorFocusId = this._textInputId;
			}

			return !mustBeBetween;
		 }

		/**
		 * ERROR VALIDATION: 
		 * Handle if the number is too low. Say ‘[whatever it is] must be [lowest] or more’.
		 * For example, ‘Hours worked a week must be 16 or more’. Set the lower bound via the Control Manifest.
		 * @param fieldIdentifier {string} Indentify the name of the field to display in the error messages
		 * @returns {boolean} Return true if nothing has been entered, otherwise false;
		 * @private
		 */
		 private handleIfInputIsTooLow (fieldIdentifier: string): boolean {

			this._lowest = (this._context.parameters.lowest.raw == undefined) ? undefined : this._context.parameters.lowest.raw;
			this._highest = (this._context.parameters.highest.raw == undefined) ? undefined : this._context.parameters.highest.raw;
			
			let lowest: any = this._lowest;
			let highest: any = this._highest;

			// Check whether a value has been provided for both the lower and higher bounds, return true otherwise false.
			let useMustBeBetween = (lowest != undefined && highest != undefined) ? true : false;
			
			if (!useMustBeBetween) {
				return true;
			}

			let inputText = this._textInput.value;
			let inputIsTooLow = (!useMustBeBetween) ? ((lowest != undefined) ? (parseFloat(inputText) <= parseFloat(lowest)) : true) : false;
			
			if (inputIsTooLow) {
				
				this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be " + lowest + " or more");
				this._errorFocusId = this._textInputId;
			}

			return !inputIsTooLow;
		 }

		/**
		 * ERROR VALIDATION: 
		 * Handle if the number is too high. Say ‘[whatever it is] must be [highest] or fewer'.
		 * For example, ‘Hours worked a week must be 99 or fewer'. Set the upper bound via the Control Manifest.
		 * @param fieldIdentifier {string} Indentify the name of the field to display in the error messages
		 * @returns {boolean} Return true if nothing has been entered, otherwise false;
		 * @private
		 */
		 private handleIfInputIsTooHigh (fieldIdentifier: string): boolean {
			
			this._lowest = (this._context.parameters.lowest.raw == undefined) ? undefined : this._context.parameters.lowest.raw;
			this._highest = (this._context.parameters.highest.raw == undefined) ? undefined : this._context.parameters.highest.raw;
			
			let lowest: any = this._lowest;			
			let highest: any = this._highest;

			// Check whether a value has been provided for both the lower and higher bounds, return true otherwise false.
			let useMustBeBetween = (lowest != undefined && highest != undefined) ? true : false;
			
			if (!useMustBeBetween) {
				return true;
			}

			let inputText = this._textInput.value;
			let inputIsTooHigh = (!useMustBeBetween) ? ((highest != undefined) ? (parseFloat(inputText) >= parseFloat(highest)) : true) : false;

			if (inputIsTooHigh) {
				
				this.ShowError(this.firstCharUpperCase(fieldIdentifier) + " must be " + highest + " or fewer");
				this._errorFocusId = this._textInputId;
			}

			return !inputIsTooHigh;
		 }

		/**
		 * COMPONENT CONFIGURATION:
		 * Following guidance from GOV UK Design System: "if you're asking more than one question on the page, do not set the
		 * contents of <label> as the page heading." https://design-system.service.gov.uk/components/text-input/
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
		 * Configure the size of the text input box based on the selected option for "Fixed and fluid width inputs".
		 * If no option is selected, the default configuration is "full width", as dictated by the GOVUK Design System:
		 * "By default, the width of text inputs is fluid and will fit the full width of the container they are placed into." 
		 * https://design-system.service.gov.uk/components/text-input/
		 */
		private fixedAndFluidWidthInputs () {

			// selected options for Control Manifest: "Fixed and fluid width inputs"
			this._characterWidth2 = this._context.parameters.fixedAndFluidWidthInputs.raw == "1";
			this._characterWidth3 = this._context.parameters.fixedAndFluidWidthInputs.raw == "2";
			this._characterWidth4 = this._context.parameters.fixedAndFluidWidthInputs.raw == "3";
			this._characterWidth5 = this._context.parameters.fixedAndFluidWidthInputs.raw == "4";
			this._characterWidth10 = this._context.parameters.fixedAndFluidWidthInputs.raw == "5";
			this._characterWidth20 = this._context.parameters.fixedAndFluidWidthInputs.raw == "6";
			this._fullWidth = this._context.parameters.fixedAndFluidWidthInputs.raw == "7";
			this._threeQuartersWidth = this._context.parameters.fixedAndFluidWidthInputs.raw == "8";
			this._twoThirdsWidth = this._context.parameters.fixedAndFluidWidthInputs.raw == "9";
			this._oneHalfWidth = this._context.parameters.fixedAndFluidWidthInputs.raw == "10";
			this._oneThirdWidth = this._context.parameters.fixedAndFluidWidthInputs.raw == "11";
			this._oneQuarterWidth = this._context.parameters.fixedAndFluidWidthInputs.raw == "12";

			// 2 character width
			if (this._characterWidth2) {
				this._fixedAndFluidWidthInputsClass = "govuk-input--width-2";
			} 

			// 3 character width
			else if (this._characterWidth3) {
				this._fixedAndFluidWidthInputsClass = "govuk-input--width-3";
			}

			// 4 character width
			else if (this._characterWidth4) {
				this._fixedAndFluidWidthInputsClass = "govuk-input--width-4";
			}

			// 5 character width
			else if (this._characterWidth5) {
				this._fixedAndFluidWidthInputsClass = "govuk-input--width-5";
			}

			// 10 character width
			else if (this._characterWidth10) {
				this._fixedAndFluidWidthInputsClass = "govuk-input--width-10";
			}

			// 20 character width
			else if (this._characterWidth20) {
				this._fixedAndFluidWidthInputsClass = "govuk-input--width-20";
			}

			// full width
			else if (this._fullWidth) {
				this._fixedAndFluidWidthInputsClass = "govuk-!-width-full";
			}

			// three quarters width
			else if (this._threeQuartersWidth) {
				this._fixedAndFluidWidthInputsClass = "govuk-!-width-three-quarters";
			}

			// two thirds width
			else if (this._twoThirdsWidth) {
				this._fixedAndFluidWidthInputsClass = "govuk-!-width-two-thirds";
			}

			// one half width
			else if (this._oneHalfWidth) {
				this._fixedAndFluidWidthInputsClass = "govuk-!-width-one-half";
			}

			// one third width
			else if (this._oneThirdWidth) {
				this._fixedAndFluidWidthInputsClass = "govuk-!-width-one-third";
			}

			// one quarter width
			else if (this._oneQuarterWidth) {
				this._fixedAndFluidWidthInputsClass = "govuk-!-width-one-quarter";
			}
			
			// default full width: "By default, the width of text inputs is fluid and will fit the full width 
			// of the container they are placed into." https://design-system.service.gov.uk/components/text-input/
			else {
				this._fixedAndFluidWidthInputsClass = "govuk-!-width-full";
			}
		};

		/**
		 * COMPONENT CONFIGURATION:
		 * If you’re asking the user to enter a whole number and you want to bring up the numeric keypad on a mobile device, 
		 * set the inputmode attribute to numeric and the pattern attribute to [0-9]*.
		 * If you’re asking the user to enter a number that might include decimal places, use input type="text" without inputmode or pattern attributes.
		 * Do not set the inputmode attribute to decimal as it causes some devices to bring up a keypad without a key for the decimal separator.
		 * https://design-system.service.gov.uk/components/text-input/
		 * 
		 */
		private inputType () {

			// selected option for Control Manifest: "Input Type"
			this._wholeNumber = this._context.parameters.inputType.raw == "1";

			if (this._wholeNumber) {

				this._inputmode = "numeric", 
				this._pattern = "[0-9]*"
			}

			// Set the default values to "", unless the whole number option is selected in the configuration			
			else {

				this._inputmode = "";
				this._pattern = "";
			}
		};

		/**
		 * COMPONENT CONFIGURATION:
		 * Following guidance from the GOVUK Design System, there are occasions where spellcheck should be disabled:
		 * "If you are asking users for information which is not appropriate to spellcheck, like a reference number, name, email address 
		 * or National Insurance number, disable the spellcheck."
		 * https://design-system.service.gov.uk/components/text-input/
		 * By default, the component will have spellcheck enabled.
		 */
		private disableSpellcheck () {

			this._disableSpellcheck = this._context.parameters.disableSpellcheck.raw == "1";

			if (this._disableSpellcheck) {

				return false;
			} else {

				return true;
			}
		};

		/**
		 * COMPONENT CONFIGURATION:
		 * Use prefixes and suffixes to help users enter things like currencies and measurements.
		 * https://design-system.service.gov.uk/components/text-input/
		 * @returns {string} Returns the prefix or suffix entered in the form configuration and renders in the control.
		 */
		private prefixSuffix () {
			
			this._prefix = this._context.parameters.prefix.raw as string;
			this._suffix = this._context.parameters.suffix.raw as string;

			// prefix
			if (this._prefix !== undefined) {

				return this._prefix;
			}

			// suffix
			if (this._suffix !== undefined) {

				return this._suffix;
			}
		};

		/**
		 * COMPONENT CONFIGURATION:
		 * Following guidance from GOV UK Design System: "Use the autocomplete attribute on text inputs to help users complete forms more quickly. 
		 * This lets you specify an input’s purpose so browsers can autofill the information on a user’s behalf if they’ve entered it previously.
		 * For example, to enable autofill on a postcode field, set the autocomplete attribute to postal-code. https://design-system.service.gov.uk/components/text-input/
		 * See guidance on input purposes: https://www.w3.org/TR/WCAG21/#input-purposes 
		 * @returns {any} Adds autocomplete attribute to control render true.
		 * @private
		 */
		 private autocomplete () {

			this._autocompleteEnabled = (this._context.parameters.autocomplete.raw == undefined) ? undefined : this._context.parameters.autocomplete.raw;

			if (this._autocompleteEnabled != undefined) {

				return this._autocomplete = this._context.parameters.autocomplete.raw as any;
			} 
		};

		/**
		 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
		 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
		 */
		public updateView(context: ComponentFramework.Context<IInputs>): void {	
			
		// storing the latest context from the control.
		this._value = context.parameters.textInput.raw;
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

				textInput: (this._value === null ? undefined : this._value)
			};
		}
	
		/** 
		 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
		 * i.e. cancelling any pending remote calls, removing listeners, etc.
		 */
		public destroy(): void {

			// no-op: method not leveraged by this example custom control
		}

		private registerPCFComponent(currentInstance:TextInput) : void {
			
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

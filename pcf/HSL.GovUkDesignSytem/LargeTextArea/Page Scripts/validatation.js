 if (window.jQuery) {
    (function ($) {
       $(document).ready(function () {
          if (typeof (Page_Validators) == 'undefined') return;
          // Create new validator
          var newValidator = document.createElement('span');
          newValidator.style.display = "none";
          newValidator.id = "createdonValidator";
          newValidator.controltovalidate = "createdon";
          newValidator.errormessage = "<a href='#createdon_label' onclick=\"javascript:scrollToAndFocus('createdon_label', 'dob-day'); return false;\"> A date error occurred </a>";
          newValidator.validationGroup = "";
          newValidator.initialvalue = "";
          newValidator.evaluationfunction = function () {
         
            var result = HSL.PCFRegistrar.test.performInputValidation();
            var errorMessageText = HSL.PCFRegistrar.test._errorMessage;
            this.errormessage = "<a href='#createdon_label' onclick=\"javascript:scrollToAndFocus('createdon_label', 'dob-day'); return false;\">" + errorMessageText + "</a>";
            return result;

          }
          
          // Add the new validator to the page validators array:
          Page_Validators.push(newValidator);
  
       });  
    }(window.jQuery));
 }
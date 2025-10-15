import { initializeForm } from './formHandler.js';

document.addEventListener('DOMContentLoaded', function () {
    const contactEmail = "{{email}}";
    const contactPhone = "{{phone}}";
    const formSelector = '.contact-form form'; 

    initializeForm(
        formSelector,
        '6Ld86ZEqAAAAAMwBvUsyfUQ3ISKsi2f9_RFAbzcs', // reCAPTCHA Site Key
        'https://o3pe4aw2c8.execute-api.us-east-1.amazonaws.com/FormSubmissionHandler', // API URL
        contactEmail,
        contactPhone
    );
});
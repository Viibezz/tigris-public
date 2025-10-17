import { initializeForm } from './formHandler.js';

document.addEventListener('DOMContentLoaded', function () {
    const formSelector = '.contact-form form'; 

    initializeForm(
        formSelector,
        '6LdzKe0rAAAAAFUuRz7eXzlS65GMXPuIN4MMPsze', // reCAPTCHA Site Key
        'https://o3pe4aw2c8.execute-api.us-east-1.amazonaws.com/FormSubmissionHandler' // API URL
    );
});
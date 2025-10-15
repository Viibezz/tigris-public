import { showAlert } from './alertModal.js';

export function initializeForm(formSelector, recaptchaSiteKey, formApiUrl) {
	const form = document.querySelector(formSelector);
	const loadingSpinner = document.getElementById('loading-spinner');

	if (!form) {
		console.error(`Form with selector "${formSelector}" not found.`);
		return;
	}

	// Ensure a hidden recaptcha token input exists
	let recaptchaTokenInput = form.querySelector('input[name="recaptcha-token"]');
	if (!recaptchaTokenInput) {
		recaptchaTokenInput = document.createElement('input');
		recaptchaTokenInput.type = 'hidden';
		recaptchaTokenInput.name = 'recaptcha-token';
		form.appendChild(recaptchaTokenInput);
	}

	grecaptcha.ready(function() {
		grecaptcha.execute(recaptchaSiteKey, { action: 'submit' }).then(function(token) {
			if (recaptchaTokenInput) {
				recaptchaTokenInput.value = token;
			}
		}).catch(error => {
			console.error('Error executing reCAPTCHA:', error);
			showAlert('Failed to initialize reCAPTCHA. Please try refreshing the page.');
		});
	});

	form.addEventListener('submit', function(event) {
		event.preventDefault();
		if (loadingSpinner) {
			loadingSpinner.style.display = 'block';
		}

		const formData = new FormData(form);
		const data = {};
		formData.forEach((value, key) => {
			data[key] = value;
		});

		// Refresh reCAPTCHA token before submitting
		grecaptcha.execute(recaptchaSiteKey, { action: 'submit' }).then(function(token) {
			if (recaptchaTokenInput) {
				recaptchaTokenInput.value = token;
			}
			data['recaptcha-token'] = token; // Ensure the most recent token is in the data

			fetch(formApiUrl, {
				method: 'POST',
				headers: {
						'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			})
			.then((response) => {
				if (loadingSpinner) {
					loadingSpinner.style.display = 'none';
				}
				if (response.ok) {
					form.reset();
					// If it's the catering form, close the modal
					if (form.closest('#inquireModal')) {
							const modal = bootstrap.Modal.getInstance(document.getElementById('inquireModal'));
							if (modal) {
									modal.hide();
							}
					}
					showAlert('Thank you! Your inquiry has been successfully submitted.');
				} else {
						response.text().then(text => {
							console.error('Error in submission response:', text);
							showAlert(`Something went wrong. Please try again later.<br>Email: <a href="mailto:info@tigrisgrille.com">info@tigrisgrille.com</a><br>Phone: <a href="tel:(858) 576-9999">(858) 576-9999</a>`);
						});
					}
			})
			.catch((error) => {
				if (loadingSpinner) {
					loadingSpinner.style.display = 'none';
				}
				console.error('Fetch Error:', error);
				showAlert(`Submission failed. Please try again.<br>Email: <a href="mailto:info@tigrisgrille.com">info@tigrisgrille.com</a><br>Phone: <a href="tel:(858) 576-9999">(858) 576-9999</a>`);
			});
		})
		.catch(error => {
			if (loadingSpinner) {
				loadingSpinner.style.display = 'none';
			}
			console.error('Error executing reCAPTCHA before submit:', error);
			showAlert('Failed to verify reCAPTCHA before submission. Please try again.');
		});
	});
}
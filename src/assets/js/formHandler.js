import { showAlert } from './alertModal.js';

export function initializeForm(formSelector, recaptchaSiteKey, formApiUrl) {
	const form = document.querySelector(formSelector);

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

		const submitButton = form.querySelector('button[type="submit"]');
		const originalButtonText = submitButton.textContent;

		// Show spinner on the button
		submitButton.disabled = true;
		submitButton.innerHTML = `
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
			Sending...
		`;

		const formData = new FormData(form);
		const data = {};
		formData.forEach((value, key) => {
			data[key] = value;
		});

		// Refresh reCAPTCHA token before submitting
		grecaptcha.execute(recaptchaSiteKey, { action: 'submit' }).then(function(token) {
			recaptchaTokenInput.value = token;
			data['recaptcha-token'] = token;

			fetch(formApiUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			})
			.then((response) => {
				submitButton.disabled = false;
				submitButton.textContent = originalButtonText;

				if (response.ok) {
					form.reset();
					const modal = bootstrap.Modal.getInstance(document.getElementById('inquireModal'));
					if (modal) modal.hide();
					showAlert('Thank you! Your inquiry has been successfully submitted.');
				} else {
					response.text().then(text => {
						console.error('Error in submission response:', text);
						showAlert(`Something went wrong. Please try again later.<br>Email: <a href="mailto:info@tigrisgrille.com">info@tigrisgrille.com</a><br>Phone: <a href="tel:(858) 576-9999">(858) 576-9999</a>`);
					});
				}
			})
			.catch((error) => {
				submitButton.disabled = false;
				submitButton.textContent = originalButtonText;
				console.error('Fetch Error:', error);
				showAlert(`Submission failed. Please try again.<br>Email: <a href="mailto:info@tigrisgrille.com">info@tigrisgrille.com</a><br>Phone: <a href="tel:(858) 576-9999">(858) 576-9999</a>`);
			});
		})
		.catch(error => {
			submitButton.disabled = false;
			submitButton.textContent = originalButtonText;
			console.error('Error executing reCAPTCHA before submit:', error);
			showAlert('Failed to verify reCAPTCHA before submission. Please try again.');
		});
	});

}
export function showAlert(message, success) {
	const alertMessage = document.getElementById('alert-message');
	alertMessage.innerHTML = message;
	const alertModal = new bootstrap.Modal(document.getElementById('custom-alert'));
	alertModal.show();
}
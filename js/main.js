const contactForm = document.querySelector('.contacto-form');
const formStatus = document.querySelector('.form-status');

contactForm?.addEventListener('submit', (event) => {
	event.preventDefault();

	if (formStatus) {
		formStatus.textContent = 'Gracias. Recibimos tu mensaje y te contactaremos pronto.';
	}

	contactForm.reset();
});

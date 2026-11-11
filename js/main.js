const contactForm = document.querySelector('.contacto-form');
const formStatus = document.querySelector('.form-status');

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(contactForm);
  const subject = encodeURIComponent('Consulta desde la web de ALUNOVA');
  const body = encodeURIComponent(
    `Nombre: ${data.get('nombre')}\nCorreo: ${data.get('email')}\n\n${data.get('mensaje')}`
  );
  if (formStatus) {
    formStatus.textContent = 'Revisa el borrador en tu aplicación de correo y envíalo desde allí.';
  }
  window.location.href = `mailto:alunova.ventas@outlook.com?subject=${subject}&body=${body}`;
});

document.addEventListener('DOMContentLoaded', function () {
  const toggleButton = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('account_password');

  if (toggleButton && passwordInput) {
    toggleButton.addEventListener('click', function () {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      toggleButton.textContent = type === 'password' ? 'Show' : 'Hide';
    });
  }
});

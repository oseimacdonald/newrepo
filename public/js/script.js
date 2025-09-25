document.addEventListener('DOMContentLoaded', function () {
  // Password toggle functionality - only on pages that need it
  initializePasswordToggle();
  
  // Form validation - only on pages that need it
  initializeFormValidation();
});

function initializePasswordToggle() {
  const toggleButton = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('account_password');

  if (toggleButton && passwordInput) {
    toggleButton.addEventListener('click', function (event) {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      toggleButton.textContent = type === 'password' ? 'Show' : 'Hide';
      
      event.preventDefault();
      event.stopPropagation();
    });
  }
}

function initializeFormValidation() {
  const form = document.getElementById('registrationForm');
  
  if (form) {
    form.addEventListener('submit', function(event) {
      const password = document.getElementById('account_password').value;
      const errors = validatePassword(password);
      
      if (errors.length > 0) {
        event.preventDefault();
        alert("Please fix the following errors:\n" + errors.join('\n'));
      }
    });
  }
}

function validatePassword(password) {
  const errors = [];
  
  if (password.length < 12) {
      errors.push("Password must be at least 12 characters long");
  }
  if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
  }
  if (!/[@$!%*?&]/.test(password)) {
      errors.push("Password must contain at least one special character (@$!%*?&)");
  }
  
  return errors;
}
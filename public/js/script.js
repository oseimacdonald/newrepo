// Password toggle setup (used by registration form)
function setupPasswordToggle(toggleButton, inputField) {
    if (toggleButton && inputField) {
        toggleButton.addEventListener('click', function () {
            const type = inputField.getAttribute('type') === 'password' ? 'text' : 'password';
            inputField.setAttribute('type', type);
            toggleButton.classList.toggle('visible');
        });
    }
}

// Registration Form Initialization
function initializeRegistrationForm(form) {
    console.log('Initializing registration form');

    const toggleButton = document.getElementById('togglePassword');
    const toggleConfirmButton = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('account_password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const submitBtn = document.getElementById('submit-btn');
    const serverErrorBox = document.getElementById('server-error-box');
    const serverErrorList = document.getElementById('server-error-list');

    setupPasswordToggle(toggleButton, passwordInput);
    setupPasswordToggle(toggleConfirmButton, confirmPasswordInput);

    const hasServerErrors = serverErrorList && serverErrorList.children.length > 0;
    const isNovalidate = form.hasAttribute('novalidate');

    if (hasServerErrors) {
        serverErrorBox.style.display = 'block';
        setTimeout(() => {
            serverErrorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }

    if (isNovalidate) {
        console.log('Server-side validation mode active - CLIENT-SIDE VALIDATION DISABLED');

        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.removeAttribute('title');
            input.removeAttribute('pattern');
            input.removeAttribute('required');
        });

        document.getElementById('account_firstname')?.removeAttribute('minlength');
        document.getElementById('account_lastname')?.removeAttribute('minlength');
        document.getElementById('account_password')?.removeAttribute('minlength');

        form.addEventListener('submit', function (e) {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating Account...';
            }
        });

        return;
    }

    console.log('Client-side validation mode active - REAL-TIME ERROR MESSAGES ENABLED');
}

// Inventory Form Initialization
function initializeInventoryForm(form) {
    console.log('Initializing inventory form');

    const isNovalidate = form.hasAttribute('novalidate');

    if (isNovalidate) {
        console.log('Inventory: Server-side validation mode active');

        const serverErrorsContainer = document.getElementById('server-errors-container');
        if (serverErrorsContainer) {
            serverErrorsContainer.style.display = 'block';
        }

        const fieldErrors = document.querySelectorAll('.field-error');
        fieldErrors.forEach(error => {
            if (error.textContent.trim() !== '') {
                error.style.display = 'block';

                const fieldName = error.getAttribute('data-field');
                const input = form.querySelector(`[name="${fieldName}"]`);
                if (input) {
                    input.classList.add('error');
                }
            }
        });

        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.removeAttribute('title');
            input.removeAttribute('pattern');
        });

        form.addEventListener('submit', function (e) {
            console.log('Inventory: Submitting to server for validation');
        });

    } else {
        console.log('Inventory: Client-side validation mode active - hiding server errors');

        const errorMessages = document.querySelector('.error-messages');
        if (errorMessages) {
            errorMessages.style.display = 'none';
        }

        const fieldErrors = document.querySelectorAll('.field-error');
        fieldErrors.forEach(error => {
            error.style.display = 'none';
        });

        const errorInputs = document.querySelectorAll('input.error, textarea.error');
        errorInputs.forEach(input => {
            input.classList.remove('error');
        });

        form.addEventListener('submit', function (e) {
            console.log('Inventory: Client-side validation active - allowing browser validation');
        });
    }
}

// Auto-initialize on DOM load
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById('registrationForm');

    if (form) {
        if (form.classList.contains('inventory-form')) {
            initializeInventoryForm(form);
        } else {
            initializeRegistrationForm(form);
        }
    }

    const flashMsg = document.querySelector(".flash-message");
    if (flashMsg) {
        setTimeout(() => {
            flashMsg.classList.add("fade-out");
            flashMsg.addEventListener("transitionend", () => {
                flashMsg.remove();
            });
        }, 10000);
    }
});

// Optional: Re-initialize dynamically inserted forms
window.initializeForms = function () {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        if (form.id === 'registrationForm') {
            if (form.classList.contains('inventory-form')) {
                initializeInventoryForm(form);
            } else {
                initializeRegistrationForm(form);
            }
        }
    });
};


function initializeRegistrationForm(form) {
    console.log('Initializing registration form');

    const toggleButton = document.getElementById('togglePassword');
    const toggleConfirmButton = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('account_password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const submitBtn = document.getElementById('submit-btn');
    const serverErrorBox = document.getElementById('server-error-box');
    const serverErrorList = document.getElementById('server-error-list');

    // Password toggle (always works)
    setupPasswordToggle(toggleButton, passwordInput);
    setupPasswordToggle(toggleConfirmButton, confirmPasswordInput);

    // Check if we're in server-side validation mode
    const hasServerErrors = serverErrorList && serverErrorList.children.length > 0;
    const isNovalidate = form.hasAttribute('novalidate');

    // If server-side errors exist, ensure the error box is visible
    if (hasServerErrors) {
        serverErrorBox.style.display = 'block';
        
        // Scroll to error box
        setTimeout(() => {
            serverErrorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }

    // If novalidate is present, we're in SERVER-SIDE ONLY mode
    if (isNovalidate) {
        console.log('Server-side validation mode active - CLIENT-SIDE VALIDATION DISABLED');
        
        // IMPORTANT: DO NOT hide client-side error elements in server-side mode
        // They need to be visible to show server-side validation errors
        
        // Remove any client-side validation attributes that might show browser tooltips
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.removeAttribute('title');
            input.removeAttribute('pattern');
            input.removeAttribute('required'); // Also remove required attribute
        });

        // Remove minlength attributes that might interfere
        document.getElementById('account_firstname')?.removeAttribute('minlength');
        document.getElementById('account_lastname')?.removeAttribute('minlength');
        document.getElementById('account_password')?.removeAttribute('minlength');

        // Simple form submission handler - NO CLIENT-SIDE VALIDATION
        form.addEventListener('submit', function (e) {
            // No validation checks - just show loading state and submit
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating Account...';
            }
            // Allow form to submit to server for validation
            // Don't call e.preventDefault() - let the form submit normally
        });
        
        return; // SKIP ALL CLIENT-SIDE VALIDATION SETUP
    }

    // ---- CLIENT-SIDE VALIDATION (only when novalidate is NOT present) ----
    console.log('Client-side validation mode active - REAL-TIME ERROR MESSAGES ENABLED');

    // Rest of your client-side validation code remains the same...
    const showError = (el, msg) => {
        if (el) {
            el.textContent = msg;
            el.style.display = 'block';
        }
    };

    const clearError = (el) => {
        if (el) {
            el.textContent = '';
            el.style.display = 'none';
        }
    };

    // ... rest of your client-side validation functions
}
'use strict'

// ==================== CART FUNCTIONALITY ====================

// Global cart functions
const cartFunctions = {
    // Add item to cart via AJAX
    addToCart: function(upgradeId, vehicleId, quantity = 1) {
        fetch('/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                upgrade_id: upgradeId,
                vehicle_id: vehicleId,
                quantity: quantity
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showCartNotification(data.message);
                this.updateCartCount(data.cartCount);
            } else {
                this.showCartError(data.errors || data.message);
            }
        })
        .catch(error => {
            console.error('Error adding to cart:', error);
            this.showCartError('Failed to add item to cart. Please try again.');
        });
    },

    // Update cart item quantity
    updateCartQuantity: function(cartItemId, quantity) {
        fetch('/cart/update-quantity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cart_item_id: cartItemId,
                quantity: quantity
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.updateCartDisplay();
            } else {
                this.showCartError(data.errors || data.message);
            }
        })
        .catch(error => {
            console.error('Error updating cart:', error);
            this.showCartError('Failed to update cart. Please try again.');
        });
    },

    // Remove item from cart
    removeFromCart: function(cartItemId) {
        fetch(`/cart/remove/${cartItemId}`, {
            method: 'POST'
        })
        .then(response => {
            if (response.ok) {
                this.updateCartDisplay();
                this.showCartNotification('Item removed from cart');
            } else {
                this.showCartError('Failed to remove item from cart');
            }
        })
        .catch(error => {
            console.error('Error removing from cart:', error);
            this.showCartError('Failed to remove item from cart');
        });
    },

    // Update cart count in header
    updateCartCount: function(count) {
        const cartCountElements = document.querySelectorAll('.cart-count, #header-cart-count, #cart-count, #upgrades-cart-count');
        cartCountElements.forEach(element => {
            element.textContent = count;
        });
    },

    // Show cart notification
    showCartNotification: function(message) {
        this.showFlashMessage(message, 'success');
    },

    // Show cart error
    showCartError: function(message) {
        this.showFlashMessage(message, 'error');
    },

    // Generic flash message display
    showFlashMessage: function(message, type = 'notice') {
        const flashDiv = document.createElement('div');
        flashDiv.className = `flash-message ${type}`;
        flashDiv.innerHTML = `<p>${message}</p>`;
        
        document.body.insertBefore(flashDiv, document.body.firstChild);
        
        setTimeout(() => {
            flashDiv.classList.add('fade-out');
            setTimeout(() => flashDiv.remove(), 300);
        }, 3000);
    },

    // Update cart display (for cart page)
    updateCartDisplay: function() {
        // Reload the page to reflect changes
        window.location.reload();
    }
};

// ==================== UPGRADE INTERACTIONS ====================

// Initialize upgrade functionality
function initializeUpgradeInteractions() {
    // Add to cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn, .quick-add-btn, .add-upgrade-btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const upgradeId = this.getAttribute('data-upgrade-id');
            const vehicleId = this.getAttribute('data-vehicle-id');
            const quantity = this.closest('.upgrade-option') ? 
                this.closest('.upgrade-option').querySelector('.upgrade-quantity')?.value || 1 : 1;
            
            if (upgradeId && vehicleId) {
                // Show loading state
                const originalText = this.textContent;
                this.textContent = 'Adding...';
                this.disabled = true;
                
                cartFunctions.addToCart(upgradeId, vehicleId, parseInt(quantity));
                
                // Restore button after a delay
                setTimeout(() => {
                    this.textContent = originalText;
                    this.disabled = false;
                }, 1500);
            }
        });
    });

    // Quantity controls in cart
    const quantityButtons = document.querySelectorAll('.quantity-btn');
    quantityButtons.forEach(button => {
        button.addEventListener('click', function() {
            const cartItemId = this.getAttribute('data-cart-item-id');
            const quantityElement = this.closest('.quantity-controls').querySelector('.quantity');
            let quantity = parseInt(quantityElement.textContent);
            
            if (this.classList.contains('plus')) {
                quantity++;
            } else if (this.classList.contains('minus')) {
                quantity = Math.max(1, quantity - 1);
            }
            
            quantityElement.textContent = quantity;
            cartFunctions.updateCartQuantity(cartItemId, quantity);
        });
    });

    // Remove buttons in cart
    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const cartItemId = this.getAttribute('data-cart-item-id');
            if (confirm('Are you sure you want to remove this item from your cart?')) {
                cartFunctions.removeFromCart(cartItemId);
            }
        });
    });

    // Quantity selectors in upgrades page
    const quantitySelects = document.querySelectorAll('.upgrade-quantity');
    quantitySelects.forEach(select => {
        select.addEventListener('change', function() {
            // Update any related display if needed
            console.log('Quantity changed to:', this.value);
        });
    });
}

// ==================== EXISTING FUNCTIONALITY ====================

// Get a list of items in inventory based on the classification_id 
let classificationList = document.querySelector("#classificationList")
classificationList?.addEventListener("change", function () { 
 let classification_id = classificationList.value 
 console.log(`classification_id is: ${classification_id}`) 
 let classIdURL = "/inv/getInventory/"+classification_id 
 fetch(classIdURL) 
 .then(function (response) { 
  if (response.ok) { 
   return response.json(); 
  } 
  throw Error("Network response was not OK"); 
 }) 
 .then(function (data) { 
  console.log(data); 
  buildInventoryList(data); 
 }) 
 .catch(function (error) { 
  console.log('There was a problem: ', error.message) 
 }) 
})

// Build inventory items into HTML table components and inject into DOM 
function buildInventoryList(data) { 
 let inventoryDisplay = document.getElementById("inventoryDisplay"); 
 // Set up the table labels 
 let dataTable = '<thead>'; 
 dataTable += '<tr><th>Vehicle Name</th><td>&nbsp;</td><td>&nbsp;</td></tr>'; 
 dataTable += '</thead>'; 
 // Set up the table body 
 dataTable += '<tbody>'; 
 // Iterate over all vehicles in the array and put each in a row 
 data.forEach(function (element) { 
  console.log(element.inv_id + ", " + element.inv_model); 
  dataTable += `<tr><td>${element.inv_make} ${element.inv_model}</td>`; 
  dataTable += `<td><a href='/inv/edit/${element.inv_id}' title='Click to update'>Modify</a></td>`; 
  dataTable += `<td><a href='/inv/delete/${element.inv_id}' title='Click to delete'>Delete</a></td></tr>`; 
 }) 
 dataTable += '</tbody>'; 
 // Display the contents in the Inventory Management view 
 inventoryDisplay.innerHTML = dataTable; 
}

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

// ==================== INITIALIZATION ====================

// Auto-initialize on DOM load
document.addEventListener("DOMContentLoaded", function () {
    // Initialize forms
    const form = document.getElementById('registrationForm');
    if (form) {
        if (form.classList.contains('inventory-form')) {
            initializeInventoryForm(form);
        } else {
            initializeRegistrationForm(form);
        }
    }

    // Initialize cart and upgrade interactions
    initializeUpgradeInteractions();

    // Flash message handling
    const flashMsg = document.querySelector(".flash-message");
    if (flashMsg) {
        setTimeout(() => {
            flashMsg.classList.add("fade-out");
            flashMsg.addEventListener("transitionend", () => {
                flashMsg.remove();
            });
        }, 10000);
    }

    // Load initial cart count
    cartFunctions.updateCartCount(0); // Will be updated by server data
});

// Make cart functions available globally
window.cartFunctions = cartFunctions;
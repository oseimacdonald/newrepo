'use strict'

// ==================== INVENTORY-SPECIFIC UPGRADE FUNCTIONALITY ====================

const inventoryUpgrades = {
    // Initialize vehicle detail page upgrade interactions
    initVehicleDetailUpgrades: function() {
        // Quick add buttons in vehicle details
        const quickAddButtons = document.querySelectorAll('.quick-add-btn');
        quickAddButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const upgradeId = this.getAttribute('data-upgrade-id');
                const vehicleId = this.getAttribute('data-vehicle-id');
                
                if (upgradeId && vehicleId) {
                    // Show loading state
                    const originalText = this.textContent;
                    this.textContent = 'Adding...';
                    this.disabled = true;
                    
                    // Use global cart function
                    if (window.cartFunctions) {
                        window.cartFunctions.addToCart(upgradeId, vehicleId, 1);
                    }
                    
                    // Restore button after a delay
                    setTimeout(() => {
                        this.textContent = originalText;
                        this.disabled = false;
                    }, 1500);
                }
            });
        });

        // View all upgrades button
        const viewUpgradesBtn = document.querySelector('.view-all-upgrades-btn');
        viewUpgradesBtn?.addEventListener('click', function(e) {
            // Smooth scroll to upgrades section if on same page
            const upgradesSection = document.querySelector('.upgrade-options');
            if (upgradesSection) {
                e.preventDefault();
                upgradesSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    },

    // Initialize upgrades page functionality
    initUpgradesPage: function() {
        // Quantity selector changes
        const quantitySelects = document.querySelectorAll('.upgrade-quantity');
        quantitySelects.forEach(select => {
            select.addEventListener('change', function() {
                const upgradeOption = this.closest('.upgrade-option');
                const upgradeId = upgradeOption.getAttribute('data-upgrade-id');
                console.log(`Quantity for upgrade ${upgradeId} changed to: ${this.value}`);
                
                // You could update a running total here if needed
                inventoryUpgrades.updateUpgradeTotal();
            });
        });

        // Add upgrade buttons in upgrades page
        const addUpgradeButtons = document.querySelectorAll('.add-upgrade-btn');
        addUpgradeButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const upgradeId = this.getAttribute('data-upgrade-id');
                const vehicleId = this.getAttribute('data-vehicle-id');
                const quantity = this.closest('.upgrade-option').querySelector('.upgrade-quantity').value;
                
                if (upgradeId && vehicleId) {
                    // Show loading state
                    const originalText = this.textContent;
                    this.textContent = 'Adding...';
                    this.disabled = true;
                    
                    // Use global cart function
                    if (window.cartFunctions) {
                        window.cartFunctions.addToCart(upgradeId, vehicleId, parseInt(quantity));
                    }
                    
                    // Restore button after a delay
                    setTimeout(() => {
                        this.textContent = originalText;
                        this.disabled = false;
                    }, 1500);
                }
            });
        });

        // Initialize upgrade total display
        inventoryUpgrades.updateUpgradeTotal();
    },

    // Calculate and display running total of selected upgrades
    updateUpgradeTotal: function() {
        const upgradeOptions = document.querySelectorAll('.upgrade-option');
        let total = 0;
        
        upgradeOptions.forEach(option => {
            const quantity = option.querySelector('.upgrade-quantity')?.value || 0;
            const priceText = option.querySelector('.upgrade-price')?.textContent;
            
            if (priceText) {
                const price = parseFloat(priceText.replace(/[^\d.-]/g, ''));
                total += price * parseInt(quantity);
            }
        });
        
        // Update total display if it exists
        const totalDisplay = document.getElementById('upgrades-total');
        if (totalDisplay) {
            totalDisplay.textContent = `Total: $${total.toFixed(2)}`;
        }
        
        return total;
    },

    // Enhanced vehicle image interactions
    initVehicleImageInteractions: function() {
        const vehicleImages = document.querySelectorAll('.vehicle-image img');
        
        vehicleImages.forEach(img => {
            // Add hover effect
            img.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.02)';
                this.style.transition = 'transform 0.3s ease';
            });
            
            img.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
            
            // Click to view larger
            img.addEventListener('click', function() {
                const src = this.getAttribute('src');
                const alt = this.getAttribute('alt');
                inventoryUpgrades.showFullSizeImage(src, alt);
            });
        });
    },

    // Show full-size image modal
    showFullSizeImage: function(src, alt) {
        // Remove existing modal if any
        const existingModal = document.getElementById('image-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'image-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            cursor: pointer;
        `;
        
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 8px;
        `;
        
        modal.appendChild(img);
        document.body.appendChild(modal);
        
        // Close modal on click
        modal.addEventListener('click', function() {
            modal.remove();
        });
        
        // Close modal on ESC key
        document.addEventListener('keydown', function closeModal(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeModal);
            }
        });
    },

    // Initialize comparison functionality
    initVehicleComparison: function() {
        const compareCheckboxes = document.querySelectorAll('.compare-checkbox');
        let selectedVehicles = [];
        
        compareCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const vehicleId = this.getAttribute('data-vehicle-id');
                const vehicleName = this.getAttribute('data-vehicle-name');
                
                if (this.checked) {
                    if (selectedVehicles.length < 3) { // Limit to 3 vehicles
                        selectedVehicles.push({ id: vehicleId, name: vehicleName });
                    } else {
                        this.checked = false;
                        alert('You can compare up to 3 vehicles at a time.');
                    }
                } else {
                    selectedVehicles = selectedVehicles.filter(v => v.id !== vehicleId);
                }
                
                inventoryUpgrades.updateCompareButton(selectedVehicles);
            });
        });
    },

    // Update compare button state
    updateCompareButton: function(selectedVehicles) {
        const compareBtn = document.getElementById('compare-vehicles-btn');
        if (compareBtn) {
            if (selectedVehicles.length >= 2) {
                compareBtn.disabled = false;
                compareBtn.textContent = `Compare (${selectedVehicles.length})`;
            } else {
                compareBtn.disabled = true;
                compareBtn.textContent = 'Compare';
            }
        }
    }
};

// ==================== INITIALIZATION ====================

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    // Check which page we're on and initialize appropriate functionality
    if (document.querySelector('.vehicle-detail-container')) {
        inventoryUpgrades.initVehicleDetailUpgrades();
        inventoryUpgrades.initVehicleImageInteractions();
    }
    
    if (document.querySelector('.upgrades-container')) {
        inventoryUpgrades.initUpgradesPage();
    }
    
    if (document.querySelector('.compare-checkbox')) {
        inventoryUpgrades.initVehicleComparison();
    }
});

// Make inventory upgrades available globally
window.inventoryUpgrades = inventoryUpgrades;
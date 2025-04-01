/**
 * Simple script to use Django's admin autocomplete widget for User selection
 */
document.addEventListener('DOMContentLoaded', function() {
    // Find the user select field
    const userField = document.querySelector('select[name="user"]');
    
    if (!userField) {
        console.error('User field not found in the form');
        return;
    }

    // Add the Django admin select2 class to enhance it
    userField.classList.add('admin-autocomplete');

    // Define the handleUserSelection function for when a user is selected
    window.handleUserSelection = function(userSelect) {
        // This is intentionally simple - we're not duplicating user fields anymore
        console.log("User selected:", userSelect.value);
    };
}); 
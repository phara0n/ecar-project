/**
 * Auto-populate user fields in Customer admin form
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get the user select field
    const userField = document.getElementById('id_user');
    
    if (!userField) {
        console.error('User field not found in the form');
        return;
    }
    
    // Function to populate user fields
    function populateUserFields(userId) {
        if (!userId) return;
        
        console.log('Fetching user data for ID:', userId);
        
        // Make a direct API call to our endpoint
        fetch(`/api/get-user-data/${userId}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API call failed with status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('User data received:', data);
                
                // Set form field values
                const firstNameField = document.getElementById('id_first_name');
                const lastNameField = document.getElementById('id_last_name');
                const emailField = document.getElementById('id_email');
                
                if (firstNameField) firstNameField.value = data.first_name || '';
                if (lastNameField) lastNameField.value = data.last_name || '';
                if (emailField) emailField.value = data.email || '';
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
            });
    }

    // Add change event handler to the user field
    userField.addEventListener('change', function() {
        populateUserFields(this.value);
    });
    
    // If a user is already selected on page load, populate the fields
    if (userField.value) {
        populateUserFields(userField.value);
    }
}); 
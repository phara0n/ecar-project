// Test script for JWT authentication
import axios from 'axios';

// Configuration
const API_URL = 'http://localhost:8000/api';
const credentials = {
  username: 'admin',
  password: 'Phara0n$'
};

// Function to test the login endpoint
async function testLogin() {
  console.log('Testing JWT authentication endpoint...');
  console.log(`API URL: ${API_URL}`);
  console.log(`Credentials: ${credentials.username} / ${credentials.password}`);
  
  try {
    const response = await axios.post(`${API_URL}/auth/token/`, credentials, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Authentication successful!');
    console.log('Response status:', response.status);
    console.log('Access token:', response.data.access ? 'Received' : 'Missing');
    console.log('Refresh token:', response.data.refresh ? 'Received' : 'Missing');
    
    return response.data;
  } catch (error) {
    console.error('Authentication failed!');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    console.error('Error config:', error.config);
  }
}

// Execute the test
testLogin(); 
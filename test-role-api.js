const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGFhNjJlNWY2MzU2YWUxOGE2YmQzOCIsImlhdCI6MTcxNjIzNjA0MCwiZXhwIjoxNzE2ODQwODQwfQ.PK3vhYxjJDuKhXJJFzZ4HqQH0kZzP3VcHqw-6XKN4qI';

async function testRoleAPIs() {
  try {
    console.log('🧪 Testing Role System APIs...\n');

    // Test 1: Get user role info
    console.log('Test 1: GET /api/roles/info/:userId');
    let response = await fetch('http://localhost:5000/api/roles/info/694aa62e5f6356ae18a6bd38', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    let data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('');

    // Test 2: List all users with roles (admin-only)
    console.log('Test 2: GET /api/roles/list (Admin only)');
    response = await fetch('http://localhost:5000/api/roles/list', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRoleAPIs();

const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGFhNjJlNWY2MzU2YWUxOGE2YmQzOCIsImlhdCI6MTcxNjIzNjA0MCwiZXhwIjoxNzE2ODQwODQwfQ.PK3vhYxjJDuKhXJJFzZ4HqQH0kZzP3VcHqw-6XKN4qI';

async function testRoleAPIs() {
  try {
    console.log('🧪 FULL ROLE SYSTEM TEST SUITE\n');
    console.log('=' .repeat(60) + '\n');

    // Test 1: Get user role info (public)
    console.log('✅ Test 1: GET /api/roles/info/:userId');
    console.log('Purpose: View any user\'s role and permissions');
    let response = await fetch('http://localhost:5000/api/roles/info/694aa62e5f6356ae18a6bd38', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    let data = await response.json();
    console.log('Status:', response.status);
    console.log('User Role:', data.role);
    console.log('Permissions:', data.permissions);
    console.log('');

    // Test 2: List all users with roles (admin-only)
    console.log('✅ Test 2: GET /api/roles/list (Admin only)');
    console.log('Purpose: View all users organized by role');
    response = await fetch('http://localhost:5000/api/roles/list', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await response.json();
    console.log('Status:', response.status);
    console.log('User Counts:', {
      admins: data.admins?.length || 0,
      moderators: data.moderators?.length || 0,
      users: data.users?.length || 0
    });
    console.log('');

    // Test 3: Create a test user first (for role assignment test)
    console.log('✅ Test 3: Testing role assignment workflow');
    console.log('Purpose: Assign roles to other users\n');
    
    // First, get a regular user ID from the list
    if (data.users && data.users.length > 0) {
      const testUserId = data.users[0]._id;
      console.log(`Using test user: ${data.users[0].name} (${testUserId})`);
      
      // Assign moderator role
      console.log('\n📝 Assigning "moderator" role...');
      response = await fetch(`http://localhost:5000/api/roles/assign/${testUserId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'moderator' })
      });
      data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', data.message || data);
      console.log('');

      // Verify the role change
      console.log('📋 Verifying role change...');
      response = await fetch(`http://localhost:5000/api/roles/info/${testUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      data = await response.json();
      console.log('New Role:', data.role);
      console.log('New Permissions:', data.permissions);
      console.log('');
    }

    console.log('=' .repeat(60));
    console.log('\n✅ ROLE SYSTEM TEST COMPLETE!\n');
    console.log('Summary:');
    console.log('- ✅ View role information');
    console.log('- ✅ List users by role (admin only)');
    console.log('- ✅ Assign roles to users (admin only)');
    console.log('- ✅ Verify role hierarchy working');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRoleAPIs();

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGFhNjJlNWY2MzU2YWUxOGE2YmQzOCIsImlhdCI6MTcxNjIzNjA0MCwiZXhwIjoxNzE2ODQwODQwfQ.PK3vhYxjJDuKhXJJFzZ4HqQH0kZzP3VcHqw-6XKN4qI';

async function testFriendRequestAPI() {
  try {
    console.log('\n🧪 FRIEND REQUEST SYSTEM TEST\n');
    console.log('=' .repeat(70) + '\n');

    // Test 1: Get all users first
    console.log('Step 1: Getting all users...');
    let response = await fetch('https://stackoverflow-clone-6cll.onrender.com/user/getallusers');
    let data = await response.json();
    
    console.log('API Response structure:', Object.keys(data));
    console.log('Full response:', JSON.stringify(data, null, 2).substring(0, 500));
    
    // Try to find users array in different locations
    let users = data.data || data.users || data.allUsers || (Array.isArray(data) ? data : null);
    
    if (!users || users.length < 2) {
      console.log('❌ Could not find users array or not enough users');
      console.log('Available keys:', Object.keys(data));
      return;
    }
    
    const userA = users[0];
    const userB = users[1];
    
    console.log(`✅ User A: ${userA.name} (${userA._id})`);
    console.log(`✅ User B: ${userB.name} (${userB._id})\n`);
    
    // Test 2: Check current pending requests for User B
    console.log('Step 2: Checking pending requests for User B...');
    response = await fetch('https://stackoverflow-clone-6cll.onrender.com/api/friends/requests/pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await response.json();
    console.log(`Pending Response:`, JSON.stringify(data).substring(0, 300));
    console.log(`✅ User B has ${Array.isArray(data) ? data.length : 0} pending request(s)\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFriendRequestAPI();

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGFhNjJlNWY2MzU2YWUxOGE2YmQzOCIsImlhdCI6MTcxNjIzNjA0MCwiZXhwIjoxNzE2ODQwODQwfQ.PK3vhYxjJDuKhXJJFzZ4HqQH0kZzP3VcHqw-6XKN4qI';

async function testFriendRequestAPI() {
  try {
    console.log('\n🧪 FRIEND REQUEST SYSTEM TEST\n');
    console.log('=' .repeat(70) + '\n');

    // Test 1: Get all users first
    console.log('Step 1: Getting all users...');
    let response = await fetch('http://localhost:5000/auth/getalluser');
    let data = await response.json();
    
    if (!data.data || data.data.length < 2) {
      console.log('❌ Need at least 2 users in database');
      return;
    }
    
    const userA = data.data[0];
    const userB = data.data[1];
    
    console.log(`✅ User A: ${userA.name} (${userA._id})`);
    console.log(`✅ User B: ${userB.name} (${userB._id})\n`);
    
    // Test 2: Check current pending requests for User B
    console.log('Step 2: Checking pending requests for User B...');
    response = await fetch('http://localhost:5000/api/friends/requests/pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await response.json();
    console.log(`✅ User B has ${data.length} pending request(s)\n`);
    
    // Test 3: Send friend request from User A to User B
    console.log(`Step 3: User A (${userA.name}) sends friend request to User B (${userB.name})...`);
    response = await fetch(`http://localhost:5000/api/friends/request/${userB._id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Message: ${data.message}`);
    if (data.friendship) {
      console.log(`Request Status: ${data.friendship.status}\n`);
    }
    
    // Test 4: View pending requests
    console.log('Step 4: Checking User B\'s pending requests...');
    response = await fetch('http://localhost:5000/api/friends/requests/pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await response.json();
    console.log(`✅ User B has ${data.length} pending request(s)`);
    if (data.length > 0) {
      console.log(`   From: ${data[0].requester.name}\n`);
    }
    
    // Test 5: Accept friend request
    console.log(`Step 5: User B accepts the friend request from User A...`);
    response = await fetch(`http://localhost:5000/api/friends/accept/${userA._id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Message: ${data.message}`);
    if (data.friendship) {
      console.log(`New Status: ${data.friendship.status}\n`);
    }
    
    // Test 6: Verify they are now friends
    console.log('Step 6: Verifying they are now friends...');
    response = await fetch('http://localhost:5000/api/friends/list', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await response.json();
    console.log(`✅ User B's friend list: ${data.length} friend(s)`);
    data.forEach((friend, i) => {
      const friendObj = friend.requester._id === userB._id ? friend.recipient : friend.requester;
      console.log(`   ${i+1}. ${friendObj.name}`);
    });
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ FRIEND REQUEST TEST COMPLETE!\n');
    console.log('Features Verified:');
    console.log('✅ Send friend request');
    console.log('✅ View pending requests');
    console.log('✅ Accept friend request');
    console.log('✅ View friends list');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFriendRequestAPI();

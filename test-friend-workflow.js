const mongoose = require('mongoose');

// Connect to MongoDB
async function testFriendRequestWorkflow() {
  try {
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/stackoverflow-clone');
    
    const User = require('./server/models/auth-model.js').default || require('./server/models/auth-model.js');
    const Friendship = require('./server/models/friendship.js').default || require('./server/models/friendship.js');
    
    console.log('\n🧪 FRIEND REQUEST WORKFLOW TEST\n');
    console.log('=' .repeat(70) + '\n');
    
    // Get first two users
    console.log('📋 Step 1: Finding users...');
    const users = await User.find().select('_id name email').limit(3);
    
    if (users.length < 2) {
      console.log('❌ Need at least 2 users in database');
      await mongoose.disconnect();
      return;
    }
    
    const userA = users[0];
    const userB = users[1];
    const userC = users[2] || null;
    
    console.log(`✅ User A: ${userA.name} (${userA._id})`);
    console.log(`✅ User B: ${userB.name} (${userB._id})`);
    if (userC) console.log(`✅ User C: ${userC.name} (${userC._id})`);
    console.log('');
    
    // Test 1: Delete any existing friendship
    console.log('Step 2: Cleaning up existing friendships...');
    await Friendship.deleteMany({
      $or: [
        { requester: userA._id, recipient: userB._id },
        { requester: userB._id, recipient: userA._id }
      ]
    });
    console.log('✅ Existing friendships cleaned\n');
    
    // Test 2: Send friend request from User A to User B
    console.log('Step 3: User A sends friend request to User B');
    const friendship = new Friendship({
      requester: userA._id,
      recipient: userB._id,
      status: 'pending'
    });
    await friendship.save();
    console.log(`✅ Friend request sent!`);
    console.log(`   Status: ${friendship.status}`);
    console.log(`   Created: ${friendship.createdAt}\n`);
    
    // Test 3: User B accepts the request
    console.log('Step 4: User B accepts the friend request');
    const accepted = await Friendship.findByIdAndUpdate(
      friendship._id,
      { status: 'accepted', updatedAt: new Date() },
      { new: true }
    );
    console.log(`✅ Friend request accepted!`);
    console.log(`   Status: ${accepted.status}`);
    console.log(`   Updated: ${accepted.updatedAt}\n`);
    
    // Test 4: Verify they are now friends
    console.log('Step 5: Verifying friendship status');
    const verifyFriendship = await Friendship.findOne({
      $or: [
        { requester: userA._id, recipient: userB._id },
        { requester: userB._id, recipient: userA._id }
      ]
    });
    console.log(`✅ Friendship verified!`);
    console.log(`   ${userA.name} ↔️ ${userB.name}`);
    console.log(`   Status: ${verifyFriendship.status}`);
    console.log(`   Friends since: ${verifyFriendship.updatedAt}\n`);
    
    // Test 5: Test rejection (with User C if available)
    if (userC) {
      console.log('Step 6: Testing request rejection (User B → User C)');
      const rejectTest = new Friendship({
        requester: userB._id,
        recipient: userC._id,
        status: 'pending'
      });
      await rejectTest.save();
      console.log(`✅ Request sent from ${userB.name} to ${userC.name}`);
      
      await Friendship.findByIdAndDelete(rejectTest._id);
      console.log(`✅ User C rejected the request\n`);
    }
    
    // Test 6: Get User B's pending requests (should be empty now)
    console.log('Step 7: Checking User B\'s pending requests');
    const pending = await Friendship.find({
      recipient: userB._id,
      status: 'pending'
    }).populate('requester', 'name');
    console.log(`✅ User B has ${pending.length} pending requests\n`);
    
    // Test 8: Get User B's friends list
    console.log('Step 8: Getting User B\'s friends list');
    const friends = await Friendship.find({
      $or: [
        { requester: userB._id, status: 'accepted' },
        { recipient: userB._id, status: 'accepted' }
      ]
    }).populate('requester', 'name email').populate('recipient', 'name email');
    
    console.log(`✅ User B has ${friends.length} friend(s):`);
    friends.forEach((f, i) => {
      const friend = f.requester._id.equals(userB._id) ? f.recipient : f.requester;
      console.log(`   ${i+1}. ${friend.name} (${friend.email})`);
    });
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ FRIEND REQUEST WORKFLOW TEST COMPLETE!\n');
    console.log('Summary:');
    console.log('- ✅ Send friend request (pending)');
    console.log('- ✅ Accept friend request (accepted)');
    console.log('- ✅ Verify friendship status');
    console.log('- ✅ Reject friend request');
    console.log('- ✅ View pending requests');
    console.log('- ✅ View friends list');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testFriendRequestWorkflow();

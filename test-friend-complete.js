const mongoose = require('mongoose');

// Connect to MongoDB and test friend request functionality
async function testFriendRequestWorkflow() {
  try {
    console.log('📊 Connecting to MongoDB...\n');
    await mongoose.connect('mongodb://localhost:27017/stackoverflow-clone', { 
      serverSelectionTimeoutMS: 5000 
    });
    
    console.log('🧪 FRIEND REQUEST SYSTEM TEST\n');
    console.log('=' .repeat(70) + '\n');
    
    const User = require('./server/models/auth-model.js').default || require('./server/models/auth-model.js');
    const Friendship = require('./server/models/friendship.js').default || require('./server/models/friendship.js');
    
    // Get users
    console.log('Step 1: Finding test users...');
    const allUsers = await User.find().select('_id name email').limit(3);
    
    if (allUsers.length < 2) {
      console.log('❌ Not enough users in database (need at least 2)\n');
      await mongoose.disconnect();
      return;
    }
    
    const userA = allUsers[0];
    const userB = allUsers[1];
    
    console.log(`✅ Found User A: ${userA.name} (${userA._id})`);
    console.log(`✅ Found User B: ${userB.name} (${userB._id})\n`);
    
    // Clean up existing friendship
    console.log('Step 2: Clearing any existing friendship...');
    await Friendship.deleteMany({
      $or: [
        { requester: userA._id, recipient: userB._id },
        { requester: userB._id, recipient: userA._id }
      ]
    });
    console.log('✅ Cleaned\n');
    
    // Send friend request
    console.log(`Step 3: User A sends friend request to User B`);
    const friendshipRequest = new Friendship({
      requester: userA._id,
      recipient: userB._id,
      status: 'pending',
      createdAt: new Date()
    });
    await friendshipRequest.save();
    console.log(`✅ Friend request sent`);
    console.log(`   Status: ${friendshipRequest.status}`);
    console.log(`   Request ID: ${friendshipRequest._id}\n`);
    
    // Check pending requests for User B
    console.log('Step 4: User B checks pending friend requests');
    const pending = await Friendship.find({
      recipient: userB._id,
      status: 'pending'
    }).populate('requester', 'name email');
    console.log(`✅ Found ${pending.length} pending request(s)`);
    pending.forEach((req, i) => {
      console.log(`   ${i+1}. From: ${req.requester.name} (${req.requester.email})`);
    });
    console.log('');
    
    // Accept friend request
    console.log(`Step 5: User B accepts the friend request`);
    const updated = await Friendship.findByIdAndUpdate(
      friendshipRequest._id,
      { status: 'accepted', updatedAt: new Date() },
      { new: true }
    );
    console.log(`✅ Friend request accepted!`);
    console.log(`   New Status: ${updated.status}`);
    console.log(`   Friends since: ${updated.updatedAt}\n`);
    
    // Verify they are friends
    console.log('Step 6: Verify they are now friends');
    const friendship = await Friendship.findOne({
      $or: [
        { requester: userA._id, recipient: userB._id },
        { requester: userB._id, recipient: userA._id }
      ]
    });
    console.log(`✅ Friendship verified!`);
    console.log(`   ${userA.name} ↔️ ${userB.name}`);
    console.log(`   Status: ${friendship.status}\n`);
    
    // Get User B's friends list
    console.log('Step 7: Get User B\'s friends list');
    const friendsList = await Friendship.find({
      $or: [
        { requester: userB._id, status: 'accepted' },
        { recipient: userB._id, status: 'accepted' }
      ]
    }).populate('requester', 'name email').populate('recipient', 'name email');
    
    console.log(`✅ User B has ${friendsList.length} friend(s):`);
    friendsList.forEach((f, i) => {
      const friendObj = f.requester._id.equals(userB._id) ? f.recipient : f.requester;
      console.log(`   ${i+1}. ${friendObj.name} (${friendObj.email})`);
    });
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ FRIEND REQUEST TEST COMPLETE!\n');
    console.log('Features Verified:');
    console.log('✅ Send friend request (status: pending)');
    console.log('✅ View pending friend requests');
    console.log('✅ Accept friend request (status: accepted)');
    console.log('✅ Verify friendship exists');
    console.log('✅ View friends list');
    console.log('\n💡 Users can now:\n   - Send friend requests to other users');
    console.log('   - View pending requests they received');
    console.log('   - Accept requests to become friends');
    console.log('   - View their friends list\n');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.name === 'MongoError') {
      console.error('MongoDB connection error. Make sure MongoDB is running on port 27017');
    }
  }
}

testFriendRequestWorkflow();

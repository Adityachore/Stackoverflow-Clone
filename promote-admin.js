const mongoose = require('mongoose');
require('dotenv').config();

async function promoteToAdmin() {
  try {
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL);
    
    const User = require('./server/models/auth-model.js').default || require('./server/models/auth-model.js');
    
    // Find and promote user
    const userId = '694aa62e5f6356ae18a6bd38';
    console.log(`\n🔄 Promoting user ${userId} to admin...`);
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: 'admin' },
      { new: true }
    );
    
    if (updatedUser) {
      console.log('✅ User promoted to admin!');
      console.log('Updated user:', {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      });
    } else {
      console.log('❌ User not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

promoteToAdmin();

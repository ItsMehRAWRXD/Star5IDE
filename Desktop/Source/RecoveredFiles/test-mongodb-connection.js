const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Atlas connection string
const MONGODB_URI = "mongodb+srv://garrettaosborne_db_user:bibbles11@cluster0.sjccoyd.mongodb.net/";

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    
    // Connect to MongoDB Atlas
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('Connection details:');
    console.log('- Host: cluster0.sjccoyd.mongodb.net');
    console.log('- Database: Connected');
    console.log('- Status: Ready');
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📚 Collections found: ${collections.length}`);
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:');
    console.error(error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('1. Your username: garrettaosborne_db_user');
      console.log('2. Your password (make sure special characters are URL encoded)');
      console.log('3. Network access settings in MongoDB Atlas');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Network error. Please check:');
      console.log('1. Your internet connection');
      console.log('2. Firewall settings');
      console.log('3. MongoDB Atlas network access settings');
    }
  } finally {
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Connection closed.');
    }
    process.exit(0);
  }
}

// Run the test
testConnection();

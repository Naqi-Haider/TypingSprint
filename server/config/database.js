import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Check for MONGO_URI or MONGODB_URI (support both)
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/typing-sprint';

    console.log('🔄 Attempting MongoDB connection...');
    console.log(`   URI: ${mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@')}`);

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connected Successfully');
    console.log(`   Database: ${mongoose.connection.name}`);
    
    // Add connection event listeners for debugging
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

export default connectDB;

import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.log('ℹ️ No MONGO_URI provided. Skipping MongoDB connection (Supabase active).');
      return;
    }

    console.log('🔄 Attempting MongoDB connection...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connected Successfully');
    console.log(`   Database: ${mongoose.connection.name}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

  } catch (error) {
    console.warn('⚠️ MongoDB Connection Error:', error.message);
    console.warn('⚠️ Continuing execution (Supabase Postgres will be used).');
  }
};

export default connectDB;

import mongoose from 'mongoose';

export async function connectMongo(uri) {
  await mongoose.connect(uri, { autoIndex: false });
  console.log('mongo connected');
}

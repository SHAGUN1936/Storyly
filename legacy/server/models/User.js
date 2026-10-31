import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  name: { type: String, required: true },
  avatar: { type: String },
  googleId: { type: String },
  /* Roles:
     - user    → regular customers (default). Customize admin/builder templates.
     - admin   → publish official templates that appear in Browse Templates.
     - builder → power-users who publish their own templates which also
                 appear in Browse Templates alongside the admin ones. */
  role: { type: String, enum: ['user', 'admin', 'builder'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.index({ role: 1 });

userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ['Patient', 'Doctor', 'Admin'],
            default: 'Patient'
        }
    },
    { timestamps: true }
);

// Hash password before saving to the database
userSchema.pre('save', async function () {
    // If password is not modified, just return out of the function
    if (!this.isModified('password')) return; 
    
    // Otherwise, hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
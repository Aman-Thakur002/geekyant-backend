const mongoose = require("mongoose");
const { hashPassword } = require("../utils/password-hashing");

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    phoneNumber: { type: String },
    isVerified: { type: Boolean, default: false },
    type: { type: String, enum: ['Manager', 'Engineer'], default: 'Engineer' },
    picture: { type: String },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Roles" },
    status: { type: String, default: "Active" },
    otp: { type: String },
    magicLinkToken: { type: String },
    otpExpire: { type: Date },
    magicLinkTokenExpire: { type: Date },
    accessToken: { type: String },
    dob: { type: Date },
    lastLogin: { type: Date },
    // Engineer specific fields
    skills: [{ type: String }], // ['React', 'Node.js', 'Python']
    seniority: { type: String, enum: ['junior', 'mid', 'senior','intern'] },
    maxCapacity: { type: Number, default: 100 }, // 100 for full-time, 50 for part-time
    department: { type: String },
    employmentType: { type: String, enum: ['full-time', 'part-time'], default: 'full-time' },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    this.password = await hashPassword(this.password);
  }
  next();
});

module.exports = mongoose.model("Users", userSchema);

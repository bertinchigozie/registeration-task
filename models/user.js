const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // to encrypt password
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "User name is required"],
    unique: true,
    lowercase: true
  },
  email: {
    type: String,
    required: [true, "Please enter a valid email"],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, "Please provide your password"]
  },
  resetPasswordToken: String,
  passwordTokenExpire: Date
});

userSchema.pre("save", async function (next) {
  this.password = await bcrypt.hashSync(this.password, 12);
  next();
});
userSchema.methods.comparePassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordTokenExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
const User = mongoose.model("User", userSchema);

module.exports = User;

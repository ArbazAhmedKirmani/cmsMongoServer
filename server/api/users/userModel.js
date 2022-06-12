const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 8,
    },
    phone: {
      type: String,
      required: true,
      min: 11,
      max: 11,
    },
    isVerified: {
      type: Boolean,
    },
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      required: true,
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      required: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: {
      type: String,
    },
    role: {
      type: String,
      trim: true,
      enum: {
        values: ["Super Admin", "Admin", "User", "SalesPerson", "Customer"],
        default: "Customer",
      },
      required: true,
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  this.password = this.encryptPassword(this.password);
  next();
});

UserSchema.methods = {
  // Check the password on user signin
  authenticate: async function (plainTextPassword) {
    const comparedPassword = await bcrypt.compare(
      plainTextPassword,
      this.password
    );
    return comparedPassword;
  },
  // Hash the password
  encryptPassword: function (plainTextPassword) {
    if (!plainTextPassword) {
      return "";
    } else {
      return bcrypt.hashSync(plainTextPassword, 8);
    }
  },
  toJson: function () {
    var obj = this.toObject();
    delete obj.password;
    return obj;
  },
};

module.exports = mongoose.model("User", UserSchema);

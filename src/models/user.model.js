const { Schema, default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function (email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: (props) => `${props.value} is not a valid email address`,
      },
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      min: [8, "Must be at least 8 value"],
      validate: {
        validator: function (v) {
          return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|\\:;\"'<>,.?/~`])[A-Za-z\d!@#$%^&*()_\-+={}[\]|\\:;\"'<>,.?/~`]+$/.test(
            v
          );
        },
        message: (value) =>
          `${value.value} Password  must contain at least one uppercase letter, one digit, and one special character.`,
      },
    },
    refreshToken: {
      type: String,
    },
    avatar: {
      type: Object,
      required: true,
    },
    list: {
      type: Schema.Types.ObjectId,
      ref: "List",
    },
    todoSection: {
      type: Array,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // this will only invoke when any one already  save the password bcz it add on the save. if any on try to update the user details it will invoke but password is not change
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, userName: this.username },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

const User = mongoose.model("User", userSchema);

module.exports = User;

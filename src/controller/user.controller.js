const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { cloudinaryUpload, cloudinaryRemove } = require("../utils/cloudinary");
const User = require("../models/user.model");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const generateRefreshToken = async (user) => {
  try {
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Server internal error");
  }
};

const options = {
  httpsOnly: true,
  secure: true,
};

const register = asyncHandler(async (req, res) => {
  const { fullName, email, username, password: pass, phoneNumber } = req.body;
  const files = req.file;

  if (!files) throw new ApiError(400, "Avatar image is required");

  if (
    [fullName, email, username, pass, phoneNumber].some(
      (items) => items?.trim() === "" || !items
    )
  ) {
    files && fs.unlinkSync(files?.path);
    throw new ApiError(400, "All fields are require");
  }

  const isUserExists = await User.findOne({
    $or: [{ email }, { username }],
  }).lean();

  if (isUserExists) {
    files && fs.unlinkSync(files?.path);
    throw new ApiError(400, "User with email or username is already exits");
  }

  const uploadAvatar = await cloudinaryUpload(files?.path);
  if (!uploadAvatar)
    throw new ApiError(500, "Server error while uploading the avatar");
  const user = await User.create({
    fullName,
    email,
    username,
    password: pass,
    avatar: uploadAvatar,
    phoneNumber,
  });

  const jsObj = user.toObject();

  const { password, refreshToken, ...newObj } = jsObj;

  return res
    .status(201)
    .json(new ApiResponse(201, newObj, "User created successfully"));
});

const logIn = async (req, res, next) => {
  try {
    const { username = "", email = "", password: pass = "" } = req.body;

    if (!(username?.trim() || email?.trim()) || !pass?.trim()) {
      throw new ApiError(
        400,
        "User with username or email and password is required"
      );
    }

    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (!user)
      throw new ApiError(401, "User with email or username is not exits");

    const isPasswordCorrect = await user.isPasswordCorrect(pass);

    if (!isPasswordCorrect) throw new ApiError(400, "Invalid user credential");

    const { accessToken, refreshToken: refToken } =
      await generateRefreshToken(user);

    const jsObj = user.toObject();

    const { password, refreshToken, ...newObj } = jsObj;

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refToken, options)
      .json(new ApiResponse(200, newObj, "User loggedIn successfully"));
  } catch (error) {
    next(error);
  }
};

const logOut = asyncHandler(async (req, res) => {
  const user = req?.user._id;

  await User.findByIdAndUpdate(user, {
    $unset: { refreshToken: 1 },
  });

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "", "User loggedOut successfully"));
});

const getCurrentUser = async (req, res, next) => {
  try {
    const user = req?.user;

    if (!user) throw new ApiError(401, "Unauthorized user");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Current user fetched successfully"));
  } catch (error) {
    next(error);
  }
};

const updateUserDetails = async (req, res, next) => {
  try {
    const path = req?.file?.path;
    const { fullName = "", bio = "", username = "" } = req.body;

    if (!(fullName?.trim() || bio?.trim() || username?.trim() || path)) {
      throw new ApiError(
        400,
        "At least one field (fullName, bio, username, or avatar) is required"
      );
    }

    let avatarUploadOnCloudinary;
    if (path) {
      avatarUploadOnCloudinary = await cloudinaryUpload(path);
      if (req?.user?.avatar?.public_id) {
        avatarUploadOnCloudinary &&
          (await cloudinaryRemove(req?.user?.avatar?.public_id, "image"));
      }
    }

    let updateUser = {};
    if (fullName?.trim()) updateUser.fullName = fullName;
    if (bio?.trim()) updateUser.bio = bio;
    if (username.trim()) updateUser.username = username;
    if (avatarUploadOnCloudinary) updateUser.avatar = avatarUploadOnCloudinary;

    const updatedUser = await User.findByIdAndUpdate(
      req?.user._id,
      updateUser,
      { new: true }
    ).select("-password -refreshToken");

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "User updated successfully"));
  } catch (error) {
    next(error);
  }
};

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword = "", newPassword = "" } = req.body;
  const userId = req?.user._id;
  if (!(oldPassword.trim() && newPassword.trim()))
    throw new ApiError(400, "OldPassword and newPassword is required");

  const user = await User.findById(userId);

  if (!(await user.isPasswordCorrect(oldPassword)))
    throw new ApiError(400, "OldPassword is incorrect enter correct password");

  user.password = newPassword;

  await user.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User password is changed successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized User");

  const decodedToken = await jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedToken?._id);

  if (!user) throw new ApiError(400, "Invalid refresh token");

  if (user?.refreshToken !== incomingRefreshToken)
    throw new ApiError(401, "Refresh Token is used or Expired");

  const { accessToken, refreshToken } = await generateRefreshToken(user);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {}, "Access Token is Refreshed"));
});

module.exports = {
  register,
  logIn,
  logOut,
  getCurrentUser,
  updateUserDetails,
  changePassword,
  refreshAccessToken,
};

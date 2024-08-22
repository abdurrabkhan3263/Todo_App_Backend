const { Router } = require("express");
const upload = require("../middleware/file_handling.middleware");
const verifyJWT = require("../middleware/auth.middleware");
const {
  register,
  logIn,
  logOut,
  getCurrentUser,
  updateUserDetails,
  changePassword,
  refreshAccessToken,
} = require("../controller/user.controller");

const router = Router();

router.route("/register").post(upload.single("avatar"), register);
router.route("/login").post(logIn);
router.route("/logout").post(verifyJWT, logOut);
router.route("/user-details").get(verifyJWT, getCurrentUser);
router
  .route("/update")
  .patch(verifyJWT, upload.single("avatar"), updateUserDetails);
router.route("/change-password").patch(verifyJWT, changePassword);
router.route("/refresh-token").patch(refreshAccessToken);

module.exports = router;

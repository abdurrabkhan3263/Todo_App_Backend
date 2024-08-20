const { Router } = require("express");
const {
  createGroup,
  deleteGroup,
  updateGroup,
  getGroup,
  removeList,
  getGroupList,
  getGroupById,
} = require("../controller/group.controller");
const verifyJwt = require("../middleware/auth.middleware");

const router = Router();

router.use(verifyJwt);

router.route("/create").post(createGroup);
router.route("/delete/:group_id").delete(deleteGroup);
router.route("/update/:group_id").patch(updateGroup);
router.route("").get(getGroup);
router.route("/remove-list/:group_id/:list_id").delete(removeList);
router.route("/list/:group_id").get(getGroupList);
router.route("/:group_id").get(getGroupById);

module.exports = router;

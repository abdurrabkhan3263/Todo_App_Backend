const verifyJWT = require("../middleware/auth.middleware");
const { Router } = require("express");
const {
  create,
  updateList,
  getAllLists,
  getListTodo,
  deleteList,
} = require("../controller/list.controller");

const router = Router();

router.use(verifyJWT);

router.route("/create").post(create);
router.route("/update/:list_id").patch(updateList);
router.route("").get(getAllLists);
router.route("/:list_id").get(getListTodo);
router.route("/delete/:list_id").delete(deleteList);

module.exports = router;

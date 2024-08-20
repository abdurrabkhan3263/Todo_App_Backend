const { Router } = require("express");
const verifyJWT = require("../middleware/auth.middleware");
const {
  createTodo,
  createTodoForList,
  deleteTodo,
  updateTodo,
  completeTodo,
  getDirectAllTodo,
  isImportant,
  getImportant,
  getTodoById,
} = require("../controller/todo.controller");

const router = Router();

router.use(verifyJWT);
router.route("/create").post(createTodo);
router.route("/create/:list_id").post(createTodoForList);
router.route("/delete/:todo_id").delete(deleteTodo);
router.route("/update/:todo_id").patch(updateTodo);
router.route("/complete").patch(completeTodo);
router.route("/get").get(getDirectAllTodo);
router.route("/setimportant").patch(isImportant);
router.route("/get-important").get(getImportant);
router.route("/:todo_id").get(getTodoById);

module.exports = router;

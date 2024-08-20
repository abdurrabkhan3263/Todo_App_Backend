const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const Todo = require("../models/todo.model");
const User = require("../models/user.model");
const { isValidObjectId, default: mongoose } = require("mongoose");
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const createTodoForList = asyncHandler(async (req, res) => {
  const { list_id } = req.params;
  const userId = req?.user._id;
  const { todoName = "", content = "", remindMe = "" } = req.body;
  if (!isValidObjectId(list_id)) throw new ApiError(400, "Invalid list id");

  if (!content.trim()) throw new ApiError(400, "Todo content is required");

  let todoValue = {};
  todoValue.isInList = true;
  todoValue.content = content;

  if (todoName.trim()) todoValue.todoName = todoName;
  if (remindMe) todoValue.remindMe = remindMe;
  if (isValidObjectId(userId)) todoValue.creator = userId;

  const createdTodo = await Todo.create({
    ...todoValue,
    "belongsTo.list_id": list_id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, createdTodo, "Todo is created successfully"));
});

const createTodo = asyncHandler(async (req, res) => {
  const user_id = req?.user._id;
  const user = req.user;

  const { todoName = "", content = "", remindMe = "" } = req.body;
  if (!isValidObjectId(user_id)) throw new ApiError(400, "Invalid list id");

  if (!content.trim()) throw new ApiError(400, "Todo content is required");

  let todoValue = {};

  todoValue.isInList = false;
  todoValue.content = content;

  if (todoName.trim()) todoValue.todoName = todoName;
  if (remindMe) todoValue.remindMe = remindMe;
  if (isValidObjectId(user_id)) todoValue.creator = user_id;

  const createdTodo = await Todo.create({
    ...todoValue,
    phoneNumber: user?.phoneNumber,
    "belongsTo.user_id": user_id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, createdTodo, "Todo is created successfully"));
});

const deleteTodo = asyncHandler(async (req, res) => {
  const { todo_id } = req.params;

  if (!isValidObjectId(todo_id))
    throw new ApiError(400, "Todo id is not valid");

  const deleteTodo = await Todo.findByIdAndDelete(todo_id);
  if (!deleteTodo) throw new ApiError(400, "Invalid todo id");

  return res
    .status(200)
    .json(new ApiResponse(200, "", "Todo is deleted successfully"));
});

const updateTodo = asyncHandler(async (req, res) => {
  const { todo_id } = req.params;
  const { todoName = "", content = "", remindMe = "" } = req.body;

  if (!isValidObjectId(todo_id)) throw new ApiError(400, "Invalid todo id");

  if (!(todoName.trim() || content.trim() || dueDate || remindMe))
    throw new ApiError(
      400,
      "Atleast one field ( todoName , content , dueDate , remainMe , isImportant )"
    );

  const updateValue = {};

  if (todoName.trim()) updateValue.todoName = todoName;
  if (content.trim()) updateValue.content = content;
  if (remindMe) {
    updateValue.remindMe = remindMe;
    updateValue.isReminded = false;
  }

  const updated = await Todo.findByIdAndUpdate(todo_id, updateValue, {
    new: true,
  });

  if (!updated) throw new ApiError(400, "Todo is not found");
  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Todo is updated successfully"));
});

const isImportant = asyncHandler(async (req, res) => {
  const { todo_id = "" } = req.body;
  if (!isValidObjectId(todo_id)) throw new ApiError(400, "Invalid todo id");

  const findTodo = await Todo.findById(todo_id).lean();
  if (!findTodo) throw new ApiError(404, "Todo is not found");

  const updateTodo = await Todo.findByIdAndUpdate(
    todo_id,
    {
      $set: { isImportant: !findTodo.isImportant },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updateTodo, "Todo is updated successfully"));
});

const getImportant = asyncHandler(async (req, res) => {
  const userId = req?.user._id;

  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user id");

  const getImportantTodo = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "todos",
        localField: "_id",
        foreignField: "creator",
        as: "todos",
      },
    },
    {
      $addFields: {
        todos: {
          $filter: {
            input: "$todos",
            as: "todo",
            cond: {
              $eq: ["$$todo.isImportant", true],
            },
          },
        },
      },
    },
    {
      $project: {
        todos: 1,
        _id: false,
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        getImportantTodo[0].todos,
        "Important todo fetched successfully"
      )
    );
});

const completeTodo = asyncHandler(async (req, res) => {
  const { todo_id, status } = req.body;

  if (!isValidObjectId(todo_id)) throw new ApiError(400, "Invalid todo id");

  const updatedTodo = await Todo.findByIdAndUpdate(
    todo_id,
    {
      isCompleted: status,
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedTodo,
        `${updatedTodo?.isCompleted ? "Mark completed" : "Mark uncompleted"}`
      )
    );
});

const getDirectAllTodo = asyncHandler(async (req, res) => {
  const id = req?.user._id;

  const allLists = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "todos",
        localField: "_id",
        foreignField: "belongsTo.user_id",
        as: "Todos",
      },
    },
    {
      $project: {
        fullName: 1,
        avatar: 1,
        Todos: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, allLists[0], "All todos is fetched successfully")
    );
});

const getTodoById = asyncHandler(async (req, res) => {
  const { todo_id } = req.params;

  if (!isValidObjectId(todo_id)) throw new ApiError(400, "Invalid todo id");

  const todoData = await Todo.findById(todo_id);
  if (!todoData) throw new ApiError(404, "Todo is not found");

  return res
    .status(200)
    .json(new ApiResponse(200, todoData, "Data is fetched successfully"));
});

function sendNotification(phoneNumber, todoName, message) {
  if (!phoneNumber) return;

  const remMsg = `🔔 Reminder Alert! 🔔\nIs _*${todoName.trim()}*_ done yet? Remember: _*${message.trim()}*_.\nYou're on fire! 🔥`;

  const userNumber = `whatsapp:+91${phoneNumber}`;
  const twilioNumber = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;

  client.messages
    .create({
      body: remMsg,
      from: twilioNumber,
      to: userNumber,
    })
    .catch((error) => {
      console.error("Error sending message", error);
    });
}

(function () {
  setInterval(async () => {
    try {
      const currentDate = Date.now();
      const twoMinutesFromNow = currentDate + 10.5 * 60 * 1000;
      const data = await Todo.find({
        remindMe: {
          $gt: currentDate,
          $lt: twoMinutesFromNow,
        },
        isReminded: false,
      });
      data.length > 0 &&
        data.forEach((todo) => {
          Todo.findByIdAndUpdate(todo._id, { isReminded: true }).then(() => {
            sendNotification(todo.phoneNumber, todo.todoName, todo.content);
          });
        });
    } catch (error) {
      console.error("Something went wrong");
    }
  }, 600000);
})();

module.exports = {
  createTodoForList,
  createTodo,
  deleteTodo,
  updateTodo,
  completeTodo,
  getDirectAllTodo,
  isImportant,
  getImportant,
  getTodoById,
};

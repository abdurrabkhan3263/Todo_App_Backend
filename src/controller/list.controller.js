const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const List = require("../models/list.model");
const User = require("../models/user.model");
const Todo = require("../models/todo.model");
const { isValidObjectId, default: mongoose } = require("mongoose");

const create = asyncHandler(async (req, res) => {
  const user = req?.user;
  const { listName = "", description = "", theme = {} } = req.body;

  const listValue = {};

  if (!listName) {
    throw new ApiError(400, "List name is required");
  } else {
    listValue.listName = listName;
  }
  if (description.trim()) listValue.description = description;
  if (Object.keys(theme || "").length > 0) listValue.theme = theme;

  const createList = await List.create(listValue);
  const updateUser = await User.findByIdAndUpdate(
    user?._id,
    {
      $push: { todoSection: createList?._id },
    },
    { new: true }
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { createList, updateUser },
        "List created successfully"
      )
    );
});

const deleteList = asyncHandler(async (req, res) => {
  const { list_id } = req.params;
  const userId = req?.user._id;

  if (!isValidObjectId(list_id)) throw new ApiError(400, "Invalid list id");

  const deletedList = await List.findByIdAndDelete(list_id);

  if (deletedList) {
    await User.findByIdAndUpdate(
      { _id: userId },
      {
        $pull: { todoSection: new mongoose.Types.ObjectId(list_id) },
      }
    );
    await Todo.deleteMany({ "belongsTo.list_id": list_id });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "",
        `${deletedList ? "List is deleted successfully" : "List is not found"}`
      )
    );
});

const updateList = asyncHandler(async (req, res) => {
  const { list_id } = req.params;
  const { listName = "", description = "", theme = {} } = req.body;

  if (!isValidObjectId(list_id)) throw new ApiError(400, "Invalid list id");
  if (!(listName.trim() || description.trim() || Object.keys(theme).length > 0))
    throw new ApiError(
      400,
      "Atleast one field ( listName , description , theme ) is required"
    );

  let updateValue = {};

  if (listName.trim()) updateValue.listName = listName;
  if (description.trim()) updateValue.description = description;
  if (Object.keys(theme).length > 0) updateValue.theme = theme;

  const updatedList = await List.findByIdAndUpdate(list_id, updateValue, {
    new: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedList, "List is updated successfully"));
});

const getAllLists = asyncHandler(async (req, res) => {
  const userId = req?.user._id;

  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user id");

  const allList = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "lists",
        foreignField: "_id",
        localField: "todoSection",
        as: "lists",
      },
    },
    {
      $project: {
        fullName: 1,
        avatar: 1,
        lists: 1,
      },
    },
  ]);

  const lists = allList[0]?.lists.filter((items) => !items.isInGroup);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...allList[0], lists },
        "list fetched successfully"
      )
    );
});

const getListTodo = asyncHandler(async (req, res) => {
  const { list_id } = req.params;

  if (!isValidObjectId(list_id)) throw new ApiError(400, "Invalid list id");

  const todos = await List.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(list_id),
      },
    },
    {
      $lookup: {
        from: "todos",
        localField: "_id",
        foreignField: "belongsTo.list_id",
        as: "todos",
      },
    },
    {
      $project: {
        listName: 1,
        description: 1,
        theme: 1,
        todos: 1,
      },
    },
  ]);

  if (todos.length <= 0) throw new ApiError(404, "List is not found");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        todos[0],
        `${todos[0]?.todos.length <= 0 ? "No todo found" : "Todos fetched successfully"}`
      )
    );
});

module.exports = { create, updateList, getAllLists, getListTodo, deleteList };

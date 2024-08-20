const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const Group = require("../models/group.model");
const List = require("../models/list.model");
const { isValidObjectId } = require("mongoose");
const mongoose = require("mongoose");

const createGroup = asyncHandler(async (req, res) => {
  const user = req?.user;
  const { name = "", listIds = "" } = req.body;

  if (Array.isArray(listIds) && listIds.length <= 0)
    throw new ApiError(400, "List must be in the array and not empty");

  const findList = await List.find({ _id: { $in: listIds } });
  if (findList.length !== listIds.length)
    throw new ApiError(400, "Lists is not found");

  if (findList.some((lists) => lists?.isInGroup))
    throw new ApiError(400, "List already exits in group");

  if (!name?.trim()) throw new ApiError(400, "Group name is required");

  let updatedListIds = [];
  if (listIds.length > 0) {
    const updateResult = await List.updateMany(
      {
        _id: { $in: listIds },
      },
      { isInGroup: true }
    );
    updatedListIds = updateResult.modifiedCount > 0 ? listIds : [];
  }

  const createdGroup = await Group.create({
    name,
    listIds: updatedListIds,
    belongsTo: user?._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, createdGroup, "Group is created successfully"));
});

const deleteGroup = asyncHandler(async (req, res) => {
  const { group_id } = req.params;

  if (!isValidObjectId(group_id)) throw new ApiError(400, "Invalid group id");

  const group = await Group.findById(group_id);
  if (!group) throw new ApiError(404, "Group is not found");

  if (group?.listIds && group.listIds.length > 0) {
    await List.updateMany(
      { _id: { $in: group?.listIds } },
      { $set: { isInGroup: false } }
    );
  }

  await Group.findByIdAndDelete(group_id);

  return res
    .status(200)
    .json(new ApiResponse(200, "", "Group is deleted successfully"));
});

const updateGroup = asyncHandler(async (req, res) => {
  const { group_id } = req.params;
  const { name = "", listIds = [], deletedIds = [] } = req.body;

  // validation
  if (!(name.trim() || (Array.isArray(listIds) && listIds.length > 0)))
    throw new ApiError(400, "Atleast one field ( name , list ) is required");

  if (!isValidObjectId(group_id)) throw new ApiError(400, "Invalid group id");

  // real code
  const findList = await List.find({ _id: { $in: listIds } });

  if (findList.some((lists) => lists?.isInGroup))
    throw new ApiError(400, "List already exits in group");

  await Group.findByIdAndUpdate(group_id, {
    $pull: { listIds: { $in: deletedIds } },
  });

  const updatedGroup = await Group.findByIdAndUpdate(
    group_id,
    {
      $set: { name: name ? name.trim() : undefined },
      $push: { listIds: { $each: listIds } },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedGroup)
    throw new ApiError(500, "Server error while updating the group");

  await List.updateMany({ _id: { $in: listIds } }, { isInGroup: true });

  if (deletedIds.length > 0) {
    await List.updateMany({ _id: { $in: deletedIds } }, { isInGroup: false });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedGroup, "Group is updated successfully"));
});

const getGroup = asyncHandler(async (req, res) => {
  const user_id = req?.user._id;
  if (!isValidObjectId(user_id)) throw new ApiError(400, "Invalid user id");

  const groupData = await Group.aggregate([
    {
      $match: {
        belongsTo: new mongoose.Types.ObjectId(user_id),
      },
    },
    {
      $lookup: {
        from: "lists",
        localField: "listIds",
        foreignField: "_id",
        as: "lists",
        pipeline: [
          {
            $project: {
              listName: 1,
              description: 1,
              theme: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        name: 1,
        lists: 1,
        belongsTo: 1,
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, groupData, "Group is getted successfully"));
});

const removeList = asyncHandler(async (req, res) => {
  const { group_id, list_id } = req.params;

  if (!(isValidObjectId(group_id) && isValidObjectId(list_id)))
    throw new ApiError(400, "Invalid group id or list id");

  const updatedGroup = await Group.findByIdAndUpdate(
    group_id,
    {
      $pull: { listIds: list_id },
    },
    { new: true }
  );

  await List.updateMany(
    { _id: list_id },
    {
      $set: { isInGroup: false },
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedGroup, "List is deleted from the group"));
});

const getGroupById = asyncHandler(async (req, res) => {
  const { group_id } = req.params;
  if (!isValidObjectId(group_id)) throw new ApiError(400, "Invalid Group Id");

  const groupData = await Group.findById(group_id);

  if (!groupData) throw new ApiError(404, "Group is not found");

  return res
    .status(200)
    .json(new ApiResponse(200, groupData, "Group is getted successfully"));
});

const getGroupList = asyncHandler(async (req, res) => {
  const { group_id } = req.params;
  if (!isValidObjectId(group_id)) throw new ApiError(400, "Invalid group id");

  const groupData = await Group.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(group_id),
      },
    },
    {
      $lookup: {
        from: "lists",
        localField: "listIds",
        foreignField: "_id",
        as: "lists",
        pipeline: [
          {
            $project: {
              listName: 1,
              description: 1,
              theme: 1,
              createdAt: 1,
              isInGroup: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        name: 1,
        lists: 1,
        belongsTo: 1,
        createdAt: 1,
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(200, groupData[0], "Group list is getted successfully")
    );
});

module.exports = {
  createGroup,
  deleteGroup,
  updateGroup,
  getGroup,
  removeList,
  getGroupList,
  getGroupById,
};

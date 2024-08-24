const { Schema, default: mongoose } = require("mongoose");
const aggregation = require("mongoose-aggregate-paginate-v2");

const todoSchema = Schema({
  todoName: {
    type: String,
    required: [true, "TodoName is required"],
    index: true,
    trim: true,
    default: "Untitled Todo",
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  remindMe: {
    type: Date,
  },
  dueDate: {
    type: Date,
  },
  isImportant: {
    type: Boolean,
    default: false,
  },
  isReminded: {
    type: Boolean,
    default: false,
  },
  belongsTo: {
    type: {
      user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      list_id: {
        type: Schema.Types.ObjectId,
        ref: "List",
      },
    },
  },
  isInList: {
    type: Boolean,
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

todoSchema.plugin(aggregation);

module.exports = mongoose.model("Todo", todoSchema);

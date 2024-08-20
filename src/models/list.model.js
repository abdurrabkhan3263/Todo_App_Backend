const { Schema, default: mongoose } = require("mongoose");
const aggregate = require("mongoose-aggregate-paginate-v2");

const listSchema = Schema(
  {
    listName: {
      type: String,
      required: [true, "List-name is required"],
      index: true,
      trim: true,
    },
    description: {
      type: String,
      index: true,
      trim: true,
    },
    theme: {
      type: Object,
    },
    isInGroup: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

listSchema.plugin(aggregate);

module.exports = mongoose.model("List", listSchema);

const { Schema, default: mongoose } = require("mongoose");
const aggregate = require("mongoose-aggregate-paginate-v2");

const groupSchema = Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    listIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "List",
      },
    ],
    belongsTo: {
      type: Schema.Types.ObjectId,
      ref: "List",
    },
  },
  { timestamps: true }
);

groupSchema.plugin(aggregate);

module.exports = mongoose.model("Group", groupSchema);

const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    pending: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "data",
  }
);

module.exports = mongoose.model("data", dataSchema);

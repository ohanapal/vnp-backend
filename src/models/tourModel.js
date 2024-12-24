const mongoose = require("mongoose");

const tourSchema = mongoose.Schema({
  place_name: {
    type: String,
    required: [true, "place name must needed"],
  },
  place_description: {
    type: String,
  },
});
const tourModel = mongoose.model("Tour", tourSchema);
module.exports = tourModel;

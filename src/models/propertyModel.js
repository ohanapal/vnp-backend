const mongoose = require("mongoose");

const propertySchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "property name must needed"],
  },
});
const propertyModel = mongoose.model("Property", propertySchema);
module.exports = propertyModel;

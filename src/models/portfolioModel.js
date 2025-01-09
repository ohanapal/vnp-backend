const mongoose = require("mongoose");

const portfolioSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "portfolio name must needed"],
  },
});
const portfolioModel = mongoose.model("Portfolio", portfolioSchema);
module.exports = portfolioModel;

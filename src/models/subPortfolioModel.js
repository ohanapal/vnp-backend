const mongoose = require("mongoose");

const subPortfolioSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "sub portfolio name must needed"],
  },
});
const subPortfolioModel = mongoose.model("SubPortfolio", subPortfolioSchema);
module.exports = subPortfolioModel;

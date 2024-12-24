const { default: mongoose } = require('mongoose');
const tourModel = require('../models/tourModel');
const AppError = require('../utils/appError');

exports.createService = async (place_name, place_description) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const newTour = new tourModel({ place_name, place_description });
      console.log('Before saving:', newTour);
      await newTour.save({ session });
      console.log('After saving:', newTour);
  
      if (!newTour) {
        throw new AppError('Tour not created', 400);
      }
  
      await session.commitTransaction();
      return newTour;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  };

exports.getAllTourService = async () => {
  try {
    const allTour = await tourModel.find();
    console.log(allTour);
    if (!allTour) {
      throw new AppError('Tour not created', 400);
    }
    return allTour;
  } catch (error) {
    throw error;
  }
};

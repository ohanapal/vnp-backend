const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const { createService, getAllTourService } = require('../services/tourService');

exports.createTour = catchAsync(async (req, res, next) => {
  const { place_name, place_description } = req.body;

  const newTour = await createService(place_name, place_description);

  console.log(newTour);
  return res.status(200).json({
    data: {
      tour: newTour,
    },
  });
});

exports.getAllTour = catchAsync(async (req, res, next) => {
  const allTour = await getAllTourService();

  return res.status(200).json({
    data: allTour,
  });
});

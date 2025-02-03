const mongoose = require('mongoose');

const sheetDataSchema = new mongoose.Schema(
  {
    unique_id: { type: String, required: true, unique: true },
    posting_type: { type: String, required: true }, // Posting Type
    portfolio_name: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true }, // Portfolio Name
    sub_portfolio: { type: mongoose.Schema.Types.ObjectId, ref: 'SubPortfolio' }, // Sub Portfolio
    property_name: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true }, // Property Name
    audit_uploaded_file: {
      type: String, // Audit Uploaded File Path
    },
    from: {
      type: Date,
    }, // From Date
    to: { type: Date }, // To Date
    next_audit_date: { type: Date},
    expedia: {
      expedia_id: { type: String, required: true }, // Expedia ID
      review_status: { type: String }, // Expedia Review Status
      billing_type: { type: String }, // Billing Type
      remaining_or_direct_billed: { type: String }, // Remaining/Direct Billed
      amount_collectable: { type: String }, // Expedia Amount Reported to Property
      additional_revenue: { type: String }, // Additional Revenue
      amount_confirmed: { type: String }, // Expedia Amount Confirmed by Property
    },

    booking: {
      booking_id: { type: String, required: true }, // Booking ID
      review_status: { type: String }, // Booking.com Review Status
      amount_collectable: { type: String }, // Booking.com Amount to be Claimed
      amount_confirmed: { type: String }, // Booking.com Amount Confirmed by Property
    },

    agoda: {
      agoda_id: { type: String, required: true }, // Agoda ID
      review_status: { type: String }, // Agoda Review Status
      amount_collectable: { type: String }, // Amount to be Claimed From Agoda
      amount_confirmed: { type: String }, // Amount Confirmed by Property
    },
  },
  {
    timestamps: true, // Automatically adds created_at and updated_at fields
  },
);

sheetDataSchema.index({ 'expedia.amount_collectable': 1 }); // Index on expedia.amount_collectable
sheetDataSchema.index({ 'expedia.amount_confirmed': 1 }); // Index on expedia.amount_confirmed
sheetDataSchema.index({ 'booking.amount_collectable': 1 }); // Index on booking.amount_collectable
sheetDataSchema.index({ 'booking.amount_confirmed': 1 }); // Index on booking.amount_confirmed
sheetDataSchema.index({ 'agoda.amount_collectable': 1 }); // Index on agoda.amount_collectable
sheetDataSchema.index({ 'agoda.amount_confirmed': 1 });

const sheetData = mongoose.model('sheetData', sheetDataSchema);

module.exports = sheetData;

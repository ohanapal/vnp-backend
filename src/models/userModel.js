const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'portfolio', 'sub-portfolio', 'property'], // Match these with your roles in roles.json
      required: true,
    },
    image: {
      type: String,
    },
    phone_number: {
      type: String,
    },
    connected_entity_id: {
      type: [String],
      required: function () {
        return this.role !== 'admin'; // If the role is not admin, connected_entity_id is required
      },
    },
    invited_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // required: true,
    },

    // access:{
    //   type: String,
    //   enum: ['portfolio', 'sub-portfolio', 'property', 'admin'], // Match these with your roles in roles.json
    //   required: true,
    // },
    is_verified: {
      type: Boolean,
      default: false,
    },
    can_download: {
      type: Boolean,
      default: false,
    },
    // Other user-specific fields
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  },
);

module.exports = mongoose.model('User', userSchema);

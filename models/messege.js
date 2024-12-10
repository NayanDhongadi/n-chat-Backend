// const mongoose = require("mongoose")

// const messageSchema = new mongoose.Schema({
//     senderId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Uesr"
//     },
//     recepientID: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Uesr"
//     },
//     messageType:{
//         type:String,
//         enum:['text,','image']
//     },
//     messsageText:String,
//     imageURL:String,
//     timestamp:{
//         type:Date,
//         default:Date.now,
//     },

// })

// const Message = mongoose.model('Message',messageSchema);

// module.exports = Message


















const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  recepientId: { // Fixed typo from "recepientID" to "recepientId"
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  messageType: {
    type: String,
    enum: ["text", "image"], // Removed extra comma in "text,"
    required: true, // Optional: Ensure this field is always provided
  },
  messageText: String, // Fixed typo from "messsageText"
  imageUrl: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;

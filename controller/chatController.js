const express = require("express");
const app = express();
const mongoose = require("mongoose")

const Conversation = require("../models/conversation");
const User = require("../models/user");
const Message = require("../models/message");

const { ObjectId } = require("mongodb");
const conversation = require("../models/conversation");

const hasActiveSubscription = (user) => {
  if (!user || !user.isPaid) return false;
  if (!user.membershipExpiry) return true;
  return new Date(user.membershipExpiry) > new Date();
};

const chatController = {
  // Create or get a conversation
  async createConversation(req, res, next) {
    const { senderId, receiverId, roomId } = req.body;

    try {
      let conversation = await Conversation.findOne({ roomId });

      if (!conversation) {
        conversation = new Conversation({
          roomId,
          members: [senderId, receiverId],
          createdAt: new Date(),
        });
        await conversation.save();
      }

      // Fetch the chatted user details
      const chattedUserId = conversation.members.find(
        (member) => member !== senderId
      );
      const chattedUser = await User.findOne({ _id: chattedUserId });

      const conversationResponse = {
        ...conversation.toObject(),
        chattedUser,
      };

      return res.status(200).json({ success: true, conversation: conversationResponse });
    } catch (error) {
      console.error("Error creating conversation:", error);
      return res.status(500).json({ error: error.message });
    }
  },

  async getAllConversations(req, res, next) {
    try {
      // Step 1: Validate logged-in user
      if (!req.user || !req.user._id) {
        return res.status(400).json({ error: "User ID is required" });
      }
      if (!hasActiveSubscription(req.user)) {
        return res.status(200).json({
          success: true,
          chats: [],
          subscriptionRequired: true,
          message:
            "You have messages waiting. Please subscribe to view your chats.",
        });
      }

      const loggedInUserId = req.user._id.toString();

      // Step 2: Ensure it's a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(loggedInUserId)) {
        return res.status(400).json({ error: "Invalid User ID" });
      }

      // Step 3: Query conversations where user is a member
      const query = { members: loggedInUserId };
      const conversations = await Conversation.find(query).exec();

      if (!conversations || conversations.length === 0) {
        return res.status(404).json({ error: "No conversations found" });
      }

      // Step 4: Fetch chatted user details safely
      const chattedUserPromises = conversations.map(async (conversation) => {
        const chattedUserId = conversation.members.find(
          (member) => member.toString() !== loggedInUserId
        );

        // Log if chattedUserId is undefined
        if (!chattedUserId) {
          console.warn(`Undefined chattedUserId in conversation: ${conversation._id}`);
          return null; // Avoid querying with undefined ID
        }

        // Ensure it's a valid ObjectId before querying
        if (!mongoose.Types.ObjectId.isValid(chattedUserId)) {
          console.warn(`Invalid ObjectId: ${chattedUserId}`);
          return null;
        }

        return User.findById(chattedUserId).exec();
      });

      const chattedUsers = await Promise.all(chattedUserPromises);

      // Step 5: Merge conversations with chatted user data
      const conversationsWithChattedUser = conversations.map((conversation, index) => ({
        ...conversation.toObject(),
        chattedUser: chattedUsers[index] || null, // Handle null cases
      }))?.reverse();

      return res.status(200).json({
        success: true,
        chats: conversationsWithChattedUser,
      });

    } catch (error) {
      console.error("Error fetching conversations:", error);
      return res.status(500).json({ error: error.message });
    }
  },

  // async getAllConversations(req, res, next) {
  //   const loggedInUserId = req.user._id;
  //   const normalId = new ObjectId(loggedInUserId).toString();

  //   const query = { members: { $elemMatch: { $in: [loggedInUserId] } } };

  //   Conversation.find(query).exec((err, conversations) => {
  //     if (err) {
  //       console.error("Error executing query:", err);
  //       return;
  //     }

  //     const chattedUserPromises = conversations.map((conversation) => {
  //       const chattedUserId = conversation.members.find(
  //         (member) => member !== normalId
  //       );
  //       return User.findOne({ _id: chattedUserId });
  //     });

  //     Promise.all(chattedUserPromises)
  //       .then((chattedUsers) => {
  //         const conversationsWithChattedUser = conversations.map(
  //           (conversation, index) => {
  //             return {
  //               ...conversation,
  //               chattedUser: chattedUsers[index],
  //             };
  //           }
  //         );
  //         // console.log(
  //         //   "Conversations with Chatted User:",
  //         //   conversationsWithChattedUser
  //         // );

  //         if (!conversationsWithChattedUser) {
  //           return res.status(404).json({ error: "Conversation not found" });
  //         }
  //         // res.json({ success: true, chats: conversationsWithChattedUser });
  //         return res.status(200).json({
  //           success: true,
  //           chats: conversationsWithChattedUser,
  //         });
  //       })
  //       .catch((error) => {
  //         console.error("Error fetching chatted user details:", error);
  //         return res.status(404).json({ error: error.message });
  //       });
  //   });
  // },

  async getMessages(req, res, next) {
    const roomId = req.query.roomId;

    try {
      if (!hasActiveSubscription(req.user)) {
        return res.status(200).json({
          success: true,
          messages: [],
          subscriptionRequired: true,
          message:
            "You have messages waiting. Please subscribe to view message content.",
        });
      }

      const messages = await Message.find({ roomId }).exec();
      console.log("Fetched messages:", messages);

      let responseArray = [];
      // messages.map((message) => {
      //   responseArray.push({
      //     user: message.message[0].user,
      //     _id: message.message[0]._id,
      //     text: message.message[0].text,
      //     createdAt: message.message[0].createdAt,
      //   });
      // });
      // console.log("message....", responseArray);

      return res.status(200).json({
        success: true,
        messages,
      });

      // return conversations;
    } catch (error) {
      console.error("Error fetching conversations:", error.message);
      return res.status(404).json({ error: error.message });
    }
  },
};

module.exports = chatController;

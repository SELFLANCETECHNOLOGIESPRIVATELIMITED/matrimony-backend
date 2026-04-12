const admin = require("firebase-admin");
const { chatTemplatePlaceholder } = require("../utils/metaDataReplacer");
const {
  chatnotificationsCategories,
  getFcmTokenForChat,
} = require("./chatNotificationCategories");

// Check if the app is already initialized
if (!admin.apps.length) {
  const serviceAccount = require("../../vaishakhi-matrimony-firebase-adminsdk-mjr6h-33d857fb90.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://vaishakhi-matrimony.appspot.com",
    // If you're using other Firebase services, include their configs here
  });
}

async function sendchatNotification(userId, messageData, senderId) {
  try {
    console.log("[PUSH] Attempting to send notification", {
      userId: String(userId),
      senderId: senderId ? String(senderId) : null,
      title: messageData?.title || "Matrimonial",
    });
    const userToken = await getFcmTokenForChat(userId);

    if (!userToken || !String(userToken).trim()) {
      console.log("[PUSH] Skipped - no valid FCM token", {
        userId: String(userId),
      });
      return;
    }

    const token = String(userToken).trim();
    const message = {
      token,
      notification: {
        title: messageData.title || "Matrimonial",
        body: messageData?.message,
      },
      data: {
        senderId: senderId ? String(senderId) : "",
        screen: messageData.screen || "ChatScreen",
        color: messageData.color || "#FFFFFF",
      },
    };
    const response = await admin.messaging().send(message);
    console.log("[PUSH] Success", {
      userId: String(userId),
      senderId: senderId ? String(senderId) : null,
      messageId: response,
    });
  } catch (err) {
    console.error("[PUSH] Failure", {
      userId: String(userId),
      senderId: senderId ? String(senderId) : null,
      code: err?.code,
      message: err?.message,
    });
    if (err.code === "messaging/mismatched-credential") {
      console.error(
        "SenderId mismatch. Please check your Firebase configuration and FCM token.",
      );
      console.error("Error details:", JSON.stringify(err, null, 2));
    }
  }
}

module.exports = { sendchatNotification };

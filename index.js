const express = require("express");
const app = express();
require("dotenv").config();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const dbConnect = require("./database/index");
const ErrorHandler = require("./middlewares/errorHandler");
const { PORT } = require("./config/index");
const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");
const paymentRouter = require("./routes/payment");
const { checkRoom, saveMessage, saveNotification } = require("./services/chatRoom");
const { sendchatNotification } = require("./firebase/service");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const User = require("./models/user");

app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));

// Allowed origins list
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3002",
  "https://vaishakhimatrimony.com",
  "https://www.vaishakhimatrimony.com",
  "https://api.vaishakhimatrimony.com",
  "https://admin.vaishakhimatrimony.com",
  'https://vaishakhi-matrimony.vercel.app',
];

// CORS Middleware
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(cookieParser());

// Handle OPTIONS preflight requests globally
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    return res.status(200).end();
  }
  next();
});

const server = http.createServer(app);

// Socket.io CORS Fix
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on("send_message", async (data) => {
    console.log("data....", data);
    try {
      const receiver = await User.findById(data.receiverId)
        .select("isPaid membershipExpiry")
        .lean();
      const receiverCanViewMessages =
        !!receiver?.isPaid &&
        (!receiver?.membershipExpiry ||
          new Date(receiver.membershipExpiry) > new Date());

      const pushBody = receiverCanViewMessages
        ? data.text
        : "You have a new message. Please subscribe to view it.";

      await sendchatNotification(
        data.receiverId,
        {
          message: pushBody,
          title: data?.user?.name || "Matrimonial",
        },
        data.user._id
      );

      await checkRoom(data);
      await saveMessage(data);
      await saveNotification(data);

      if (receiverCanViewMessages) {
        io.to(data.roomId).emit("receive_message", data);
      } else {
        socket.emit("message_saved_for_receiver", {
          roomId: data.roomId,
          receiverId: data.receiverId,
          message:
            "Message saved. Receiver needs an active subscription to view it.",
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);
      socket.emit("message_error", { message: "Failed to send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

// Apply Routes
app.use(userRouter);
app.use(adminRouter);
app.use(paymentRouter);
dbConnect();

// Global Error Handler
app.use(ErrorHandler);

server.listen(PORT, () => {
  console.log("SERVER RUNNING", PORT);
});

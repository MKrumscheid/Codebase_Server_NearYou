const express = require("express");
const cors = require("cors");
const couponRoutes = require("./api/couponRoutes");
const messageRoutes = require("./api/messageRoutes");
const { setupDatabase } = require("./models/index");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// Routes that do not handle file uploads
app.use(express.json());
app.use("/api/messages", messageRoutes);

// Routes that handle file uploads (Multer will handle the body)
app.use("/api/coupons", couponRoutes);

// Setup database and start server
setupDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("Fehler beim starten des Servers:", error);
  });

// Global error handler, for when something really unexpected happens
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    message:
      "GÜNTHER!! Desch App Ding funktschioniert scho widder net. Wasch müsch ma da mache?!",
  });
});

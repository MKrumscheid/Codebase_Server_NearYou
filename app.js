const express = require("express");
const cors = require("cors");
const couponRoutes = require("./api/couponRoutes");
const messageRoutes = require("./api/messageRoutes");
const { setupDatabase } = require("./models/index");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
//For testing purposes, we allow all origins
app.use(cors());
//since we do not save images in the DB for performance reasons, we set up a static route for the images
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/coupons", couponRoutes);
app.use("/api/messages", messageRoutes);

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

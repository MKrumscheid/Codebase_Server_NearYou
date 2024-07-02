const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { check, validationResult } = require("express-validator");

// Middleware zur Validierung der Nachrichtendaten
const validateMessage = [
  check("content").isString().withMessage("Content must be a valid string"),
  check("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),
  check("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

router.get("/nearby", messageController.findNearbyMessages);
router.post("/", validateMessage, messageController.createMessage);
router.delete("/old", messageController.deleteOldMessages);

module.exports = router;

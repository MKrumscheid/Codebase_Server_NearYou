const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const messageController = require("../controllers/messageController");

// Middleware to validate message data
const validateMessage = [
  check("content").not().isEmpty().withMessage("Inhalt darf nicht leer sein"),
  check("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Breitengrad muss zwischen -90 und 90 liegen"),
  check("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Längengrad muss zwischen -180 und 180 liegen"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const validateMessageId = [
  check("id").isInt().withMessage("ID muss eine gültige Ganzzahl sein"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

router.get("/nearby", validateMessage, messageController.findNearbyMessages);
router.post("/", validateMessage, messageController.createMessage);

//router.delete("/:id", validateMessageId, messageController.deleteMessage); since we dont have a user authentification, we dont allow users to delete messages

module.exports = router;

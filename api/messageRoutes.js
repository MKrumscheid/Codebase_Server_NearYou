const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const messageController = require('../controllers/messageController');

const validateMessage = [
    check('content').not().isEmpty().withMessage('Inhalt darf nicht leer sein'),
    check('latitude').isFloat({ min: -90, max: 90 }).withMessage('Breitengrad muss zwischen -90 und 90 liegen'),
    check('longitude').isFloat({ min: -180, max: 180 }).withMessage('Längengrad muss zwischen -180 und 180 liegen'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];



const validateMessageId = [
    check('id').isInt().withMessage('ID muss eine gültige Ganzzahl sein'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// Route to create a new message
router.post('/message', validateMessage, messageController.createMessage);

// Route to fetch nearby messages
router.get('/messages/nearby', validateMessage, messageController.findNearbyMessages);

// Route to delete a message by ID
router.delete('/message/:id', validateMessageId, messageController.deleteMessage);

module.exports = router;

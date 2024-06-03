const express = require("express");
const multer = require("multer");
const couponController = require("../controllers/couponController");
const { check, validationResult } = require("express-validator");

// Create a new router instance for coupon routes
const router = express.Router();

// Configure storage and file filter for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  // Rename the file to include the fieldname and the current date so we have unique filenames
  filename: (req, file, cb) => {
    const extension = file.originalname.split(".").pop();
    cb(null, `${file.fieldname}-${Date.now()}.${extension}`);
  },
});
// File filter to only allow JPEG and PNG files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG and PNG files are allowed!"), false);
  }
};

// Setting limits: 2MB file size
const limits = {
  fileSize: 2 * 1024 * 1024,
};
// Multer middleware for file upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
}).fields([
  { name: "productPhoto", maxCount: 1 },
  { name: "companyLogo", maxCount: 1 },
]);

// Middleware to validate ID
const validateId = [
  check("id").isInt().withMessage("ID must be an integer"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Middleware to validate coupon data for POST and PUT requests
const validateCoupon = [
  check("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a valid number greater than or equal to 0"),
  check("product").isString().withMessage("Product must be a valid string"),
  check("productCategory")
    .isString()
    .withMessage("Product category must be a valid string"),
  check("productInfo")
    .isString()
    .withMessage("Product info must be a valid string"),
  check("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a valid integer greater than or equal to 1"),
  check("discount")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be a valid number greater than or equal to 0"),
  check("validity")
    .isInt({ min: 30 })
    .withMessage(
      "Validity must be a valid positive integer greater than 30 minutes"
    ),
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

const validateNearbyCoupon = [
  check("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and +90 degrees"),
  check("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and +180 degrees"),
  check("distance")
    .isInt({ min: 50, max: 5000 })
    .withMessage("Distance must be between 50 and 5000 meters"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Routes for coupon operations using the validation and Multer middleware for file upload
router.post(
  "/",
  [upload, validateCoupon, couponController.createCoupon],
  function (err, req, res, next) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({
        message: "Multer error: " + err.message,
      });
    } else if (err) {
      return res.status(500).json({ message: "Error: " + err.message });
    }
  }
);

router.put(
  "/:id",
  [upload, ...validateId, ...validateCoupon],
  couponController.updateCoupon
);

//Routes for coupon operations without file upload
router.get("/nearby", validateNearbyCoupon, couponController.findNearbyCoupons);
router.get("/:id", validateId, couponController.getCouponByID);
//router.delete("/:id", validateId, couponController.deleteCoupon); delete is handeled by the server when the coupon expires, users are not allowed to delete coupons since we dont have a user system

router.patch("/:id", validateId, couponController.patchCoupon);

module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");
const couponController = require("../controllers/couponController");
const { check, validationResult } = require("express-validator");

// AWS-Konfiguration für S3-Bucket mit Multer
aws.config.update({
  accessKeyId: process.env.BUCKETEER_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.BUCKETEER_AWS_SECRET_ACCESS_KEY,
  region: process.env.BUCKETEER_AWS_REGION,
});

// Erstelle eine S3-Instanz
const s3 = new aws.S3();

// Konfiguriere S3-Speicher für Multer
const bucketName =
  process.env.BUCKETEER_BUCKET_NAME ||
  "bucketeer-43e68ed6-bbb1-4155-8fca-55e871a0588d";

const storage = multerS3({
  s3: s3,
  bucket: bucketName,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const extension = file.originalname.split(".").pop();
    cb(null, `${file.fieldname}-${Date.now()}.${extension}`);
  },
});

// Datei-Filter, um nur JPEG- und PNG-Dateien zuzulassen
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG and PNG files are allowed!"), false);
  }
};

// Begrenzungen setzen: 2MB Dateigröße
const limits = {
  fileSize: 2 * 1024 * 1024,
};

// Multer-Middleware für den Datei-Upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
}).fields([
  { name: "productPhoto", maxCount: 1 },
  { name: "companyLogo", maxCount: 1 },
]);

// Middleware zur Validierung der ID
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

// Middleware zur Validierung der Gutschein-Daten für POST- und PUT-Anfragen
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
    .isInt({ min: 10 })
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

// Routen für Gutscheinoperationen unter Verwendung der Validierungs- und Multer-Middleware für den Datei-Upload
router.post(
  "/",
  upload,
  validateCoupon,
  function (req, res, next) {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        console.error("Multer error:", err);
        return res.status(500).json({
          message: "Multer error: " + err.message,
        });
      } else if (err) {
        console.error("Error:", err);
        return res.status(500).json({ message: "Error: " + err.message });
      }
      next();
    });
  },
  couponController.createCoupon
);

router.put(
  "/:id",
  upload,
  validateId,
  validateCoupon,
  function (req, res, next) {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        console.error("Multer error:", err);
        return res.status(500).json({
          message: "Multer error: " + err.message,
        });
      } else if (err) {
        console.error("Error:", err);
        return res.status(500).json({ message: "Error: " + err.message });
      }
      next();
    });
  },
  couponController.updateCoupon
);

router.get("/nearby", validateNearbyCoupon, couponController.findNearbyCoupons);
router.get("/:id", validateId, couponController.getCouponByID);
//router.delete("/:id", validateId, couponController.deleteCoupon); delete is handled by the server when the coupon expires, users are not allowed to delete coupons since we don't have a user system
router.patch("/:id", validateId, couponController.patchCoupon);

module.exports = router;

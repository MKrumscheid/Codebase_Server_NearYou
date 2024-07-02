const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multerS3 = require("multer-s3");
const couponController = require("../controllers/couponController");
const { check, validationResult } = require("express-validator");

// AWS-Konfiguration für S3-Bucket mit Multer
const s3 = new S3Client({
  region: process.env.BUCKETEER_AWS_REGION,
  credentials: {
    accessKeyId: process.env.BUCKETEER_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.BUCKETEER_AWS_SECRET_ACCESS_KEY,
  },
});

console.log("AWS S3 Client initialized");

// Konfiguriere S3-Speicher für Multer
const bucketName = "bucketeer-43e68ed6-bbb1-4155-8fca-55e871a0588d";
console.log("Bucket Name:", bucketName);

const storage = multer.memoryStorage();

console.log("Multer memory storage configured");

// Datei-Filter, um nur JPEG- und PNG-Dateien zuzulassen
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG and PNG files are allowed!"), false);
  }
};

console.log("File filter configured");

// Begrenzungen setzen: 2MB Dateigröße
const limits = {
  fileSize: 2 * 1024 * 1024,
};

console.log("File size limit set");

// Multer-Middleware für den Datei-Upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
}).fields([
  { name: "productPhoto", maxCount: 1 },
  { name: "companyLogo", maxCount: 1 },
]);

console.log("Multer middleware configured");

async function uploadToS3(file) {
  const filename = `${file.fieldname}-${Date.now()}.${file.originalname
    .split(".")
    .pop()}`;
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);
  return filename;
}

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
  (req, res, next) => {
    console.log("POST /api/coupons called");
    next();
  },
  upload,
  validateCoupon,
  async function (req, res, next) {
    console.log("Request Files:", req.files);
    console.log("Request Body:", req.body);
    try {
      const productPhoto = req.files.productPhoto
        ? await uploadToS3(req.files.productPhoto[0])
        : null;
      const companyLogo = req.files.companyLogo
        ? await uploadToS3(req.files.companyLogo[0])
        : null;
      req.body.productPhoto = productPhoto;
      req.body.companyLogo = companyLogo;
      next();
    } catch (err) {
      console.error("Error uploading to S3:", err);
      return res.status(500).json({
        message: "Error uploading to S3: " + err.message,
      });
    }
  },
  couponController.createCoupon
);

router.put(
  "/:id",
  (req, res, next) => {
    console.log(`PUT /api/coupons/${req.params.id} called`);
    next();
  },
  upload,
  validateId,
  validateCoupon,
  async function (req, res, next) {
    console.log("Request Files:", req.files);
    console.log("Request Body:", req.body);
    try {
      const productPhoto = req.files.productPhoto
        ? await uploadToS3(req.files.productPhoto[0])
        : null;
      const companyLogo = req.files.companyLogo
        ? await uploadToS3(req.files.companyLogo[0])
        : null;
      req.body.productPhoto = productPhoto;
      req.body.companyLogo = companyLogo;
      next();
    } catch (err) {
      console.error("Error uploading to S3:", err);
      return res.status(500).json({
        message: "Error uploading to S3: " + err.message,
      });
    }
  },
  couponController.updateCoupon
);

router.get("/file/:key", async (req, res) => {
  const { key } = req.params;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 * 24 }); // URL gilt für 24 Stunden
    res.json({ url });
  } catch (err) {
    console.error("Error getting signed URL", err);
    res.status(500).json({ message: "Error getting signed URL" });
  }
});

router.get("/nearby", validateNearbyCoupon, couponController.findNearbyCoupons);
router.get("/:id", validateId, couponController.getCouponByID);
//router.delete("/:id", validateId, couponController.deleteCoupon); delete is handled by the server when the coupon expires, users are not allowed to delete coupons since we don't have a user system
router.patch("/:id", validateId, couponController.patchCoupon);

console.log("Routes configured");

module.exports = router;

const express = require("express");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const {
  addFavorite,
  getFavorites,
  removeFavorite,
} = require("../controllers/favorite.controller");
const router = express.Router();
router.post(
  "/:projectId",
  verifyToken,
  authorizeRoles("freelancer"),
  addFavorite
);
router.get("/", verifyToken, authorizeRoles("freelancer"), getFavorites);
router.delete(
  "/:projectId",
  verifyToken,
  authorizeRoles("freelancer"),
  removeFavorite
);

module.exports = router;

const express = require("express");

//@ Create a new Express router
const router = express.Router();

//@ Simple test route to check if this route file is working
router.get("/test", (req, res) => {
  res.send("Route working");
});

//@ Export the router so it can be used in the main app
module.exports = router;

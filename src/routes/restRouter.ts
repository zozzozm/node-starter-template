import bodyParser = require("body-parser");
import * as express from "express";
const router = express.Router();

router.get("/items", (req, res) => {
    res.status(200).json("hi");
});

router.get("/", (req, res) => {
  res.status(200).json({ route: "api" });
});

module.exports = router;

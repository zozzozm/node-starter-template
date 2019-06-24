import * as express from "express";

const router = express.Router();

router.use("/notfound", (req, res) => {
  res.render("notfound", { title: "404 | NotFound" });
});

router.use("/", (req, res) => {
  res.render("index", { title: "Main page" });
});

// Export the router
module.exports = router;

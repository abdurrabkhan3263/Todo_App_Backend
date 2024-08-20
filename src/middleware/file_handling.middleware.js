const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (_, _, cb) {
    cb(null, "./public");
  },
  filename: function (_, file, cb) {
    const date = Date.now();
    const fileName = file.originalname || file.name;
    cb(null, `${date}_${fileName}`);
  },
});

const upload = multer({
  storage,
});

module.exports = upload;

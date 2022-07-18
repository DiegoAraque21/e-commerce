const fs = require("fs");

// delete a file from the filePath that comes as an argument
const deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      throw err;
    }
  });
};

exports.deleteFile = deleteFile;

const { v2: cloudinary } = require("cloudinary");
const ApiError = require("./ApiError");
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const cloudinaryUpload = async (filePath) => {
  try {
    if (!filePath) return undefined;
    const upload = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(filePath);
    return { url: upload?.url, public_id: upload?.public_id };
  } catch (error) {
    fs.unlink(filePath, () => {
      throw new ApiError(
        500,
        `Error Occur when we upload on the cloudinary :: ${error}`
      );
    });
  }
};

// const cloudinaryRemove = (public_id) => {
//   try {
//     cloudinary.uploader.destroy(
//       public_id,
//       {
//         resource_type: "auto",
//       },
//       (err, result) => {
//         if (err)
//           throw new ApiError(
//             500,
//             `Something went wrong while destroying the file ${err}`
//           );
//         return result;
//       }
//     );
//   } catch (error) {
//     throw new ApiError(
//       500,
//       `Error occur when delete the file from the cloudinary :: ${error}`
//     );
//   }
// };

const cloudinaryRemove = (public_id, resource_type) => {
  if (!public_id) return "";
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      public_id,
      {
        resource_type: resource_type,
      },
      (err, result) => {
        if (err) {
          reject(`Something went wrong while destroying the file ${err}`);
        } else {
          resolve(result);
        }
      }
    );
  });
};

module.exports = { cloudinaryUpload, cloudinaryRemove };

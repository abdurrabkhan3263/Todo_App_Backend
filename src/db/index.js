const mongoose = require("mongoose");

const connectToDb = async () => {
  try {
    const dbInstance = await mongoose.connect(
      `${process.env.DB_URL}/${process.env.DB_NAME}`
    );
    console.log(`Database Connected Successfully`);
  } catch (error) {
    throw new Error(`Error occur when connect to the database ${error}`);
  }
};

module.exports = connectToDb;

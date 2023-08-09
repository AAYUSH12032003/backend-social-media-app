const { MongoClient, ServerApiVersion } = require("mongodb");
const mongoose = require("mongoose");

module.exports = async () => {
  const mongoUri =
    "mongodb+srv://aayushvermaa087:mJqLfICrzAzoJjX2@cluster0.m65d74e.mongodb.net/?retryWrites=true&w=majority";

  try {
    const connect = await mongoose.connect(mongoUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    console.log(`MongoDb connected : ${connect.connection.host}`);
  } catch (e) {
    console.log("error occured boss", e);
    process.exit(1);
  }
};

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { error } = require("../utils/responseWrapper");

// this function verifies whether access token is sent and if it is sent then verifies if it is correct or not.
module.exports = async (req, res, next) => {
  if (
    !req.headers ||
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  ) {
    //  return res.status(401).send("Authorization header is required");
    return res.send(error(401, "Authorization header is required"));
  }
  // if command comes till here it means we have got headers in request and authorizatio in header and the authorization starts with "Bearer".
  const accessToken = req.headers.authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(
      // here we are verifying the access token with the access token private key .
      accessToken,
      process.env.ACCESS_TOKEN_PRIVATE_KEY
    );
    req._id = decoded._id;

    const user = await User.findById(req._id); // finding the user from the database with the id for which access token was sent.
    if (!user) {
      console.log("this error is coming in try at requireUser.js");
      return res.send(error(404, "User not found!!"));
    }
    // if command comes here then we have got the user.
    // console.log("inside require user");
    next();
  } catch (e) {
    console.log("the access key is invalid here (require user ) ::", e);
    // return res.status(401).send("Invalid access key");
    return res.send(error(401, "Invalid access key it is!"));
  }
};

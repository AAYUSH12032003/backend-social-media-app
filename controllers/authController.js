const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { error, success } = require("../utils/responseWrapper");

const signupController = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      // res.status(400).send("all fields required");
      return res.send(error(400, "All fields are required"));
    }

    const oldUser = await User.findOne({ email: email });

    if (oldUser) {
      //   res.status(409).send("user already exists");
      return res.send(error(409, "User already exists"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return res.send(success(201, "user created successfully"));
  } catch (e) {
    console.log("error it is , signup", error);
    return res.send(error(500, e.message));
  }
};

// a very different function for login function
const loginController = async (req, res) => {
  // console.log("this is in try section of loginController");
  try {
    const { email, password } = req.body; // extracting email and password from the request body which is given by the us in insomnia.

    if (!email || !password) {
      //   res.status(400).send("all fields required");
      return res.send(error(400, "All fields are required"));
    }
    const user = await User.findOne({ email: email }).select("+password"); // finding the user with the same email as in the db(atlas) and here pw is also stored in user.

    if (!user) {
      // return res.status(404).send("user is not registered");
      return res.send(error(404, "User is not registered"));
    }
    // if command comes here it means we have got the right user who is trying to login and we are now checking the password below.
    const matched = await bcrypt.compare(password, user.password); //comparing the pw given in insomnia and the pw of that particular user present in database(user.password)
    if (!matched) {
      // return res.status(403).send("incorrect password");
      return res.send(error(403, "Incorrect password"));
    }
    // if command comes till here it means pw is also matched along with the email.

    const accessToken = generateAccessToken({
      //storing the function of generating the access token by the back end to send it to the front end for fetching info with this token.
      _id: user._id,
    });

    const refreshToken = generateRefreshToken({
      // storing the function of generating the refresh token by back end again for updating the access token when it is expired
      _id: user._id,
    });

    res.cookie("jwt", refreshToken, {
      // storing the refresh token in a variable('jwt') and sending it in cookie as it is safe to send via cookies.
      httpOnly: true,
      secure: true,
    });

    return res.send(success(200, { accessToken })); // sending the access token as it is made on line 63.

    //  return res.json({ accessToken });
  } catch (e) {
    console.log("error it is , login", error);
    return res.send(error(500, e.message));
  }
};

//this api will check the refresh token validity and generate a new access token after the old one has been expired
const refreshAccessTokenController = async (req, res) => {
  const cookies = req.cookies; //extract cookies from request as request has data in various forms like body ,headers,cookies.

  if (!cookies.jwt) {
    // if refresh token (which is present in variable named 'jwt') is not present in cookies then :-
    //  return res.status(401).send("refresh token in cookie is required");
    return res.send(error(401, "Refresh token in cookie is required"));
  }

  // if command comes here it means refresh token is present in cookie in 'jwt'
  const refreshToken = cookies.jwt;
  console.log("refresh token is::", refreshToken); // prints in terminal

  try {
    const decoded = jwt.verify(
      // veryfing the refresh token with the key present in env files.
      refreshToken,
      process.env.REFRESH_TOKEN_PRIVATE_KEY
    );

    const _id = decoded._id; // _id is a paramater for generating token (refresh and access both token)
    const accessToken = generateAccessToken({ _id }); //here access token is being generated with  the help of _id and stored it in a variable named 'accessToken'.
    // return res.status(201).json({ accessToken });

    return res.send(success(201, { accessToken }));
  } catch (err) {
    // the refresh token is not valid as the token doesn't MATCHED with the REFRESH_TOKEN_PRIVATE_KEY.
    // here at this point we can direct user to login page and ask him to login again.
    console.log("refresh token is invalid ::", err);

    return res.status(401).send("Invalid refresh token it is");
    // return res.send(error(401, "Invalid refresh token"));
  }
};

const logoutController = async (req, res) => {
  // deleting the refresh token as this is the way followed when a user logs out
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
    });
    return res.send(success(200, "User logged out"));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//internal function i.e it won't be exported
const generateAccessToken = (data) => {
  // function to generate access token which takes a parameter('data') as a plain object of a particular user present in db.
  try {
    const token = jwt.sign(data, process.env.ACCESS_TOKEN_PRIVATE_KEY, {
      expiresIn: "20d",
    });

    console.log("access token is ::", token);
    return token;
  } catch (error) {
    console.log("error in the function which generates the access token !");
  }
};
// intrnal function i.e won't be exported
const generateRefreshToken = (data) => {
  // function to generate refresh token which takes a parameter('data') as a plain object of a particular user present in db.
  console.log("inside generateRefreshToken function");
  try {
    const token = jwt.sign(data, process.env.REFRESH_TOKEN_PRIVATE_KEY, {
      expiresIn: "2y",
    });

    console.log(" refresh token is ::", token);
    return token;
  } catch (e) {
    console.log("error in the function which generates the refresh token !");
  }
};

// note: when access token expires i.e in 40 minutes(line 128) it calls for the api of refresh token where the refresh token of the front end is checked
// and if it valid then a new access token is generated which replaces the old invalid access token with in the LOCAL STORAGE.

// NOTE : when refresh token expires (line 142) it simply takes the user to the login page of front end and ask him to login again.

module.exports = {
  signupController,
  loginController,
  refreshAccessTokenController,
  logoutController,
};

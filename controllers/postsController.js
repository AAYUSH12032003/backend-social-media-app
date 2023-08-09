const Post = require("../models/Post.js");
const User = require("../models/User");
const { success, error } = require("../utils/responseWrapper");
const cloudinary = require("cloudinary").v2;
const { mapPostOutput } = require("../utils/Utils");

const createPostController = async (req, res) => {
  try {
    const { caption, postImg } = req.body;

    if (!caption || !postImg) {
      return res.send(error(400, "caption and postImg are required!!"));
    }

    const cloudImg = await cloudinary.uploader.upload(postImg, {
      folder: "postImg",
    });

    const owner = req._id; //this owner is coming from middleware(requireUser)
    const user = await User.findById(req._id); //finding the user with that id in the db.
    const post = await Post.create({
      // creating a post object (which a table that has various columns like owner, id ,caption) in mongodb db which contains owner and caption as column names
      owner,
      caption,
      image: {
        publicId: cloudImg.public_id,
        url: cloudImg.url,
      },
    });

    // note : the above object post is made of the template 'Post' which comes from 'Post.js'.
    user.posts.push(post._id); // adding the ids of posts (post._id) to the column 'posts' inside the table(user) in mongodb.

    await user.save(); // saving the table named user.

    return res.json(success(200, { post })); // returning the entire post in response.

    //return res.send(success(201, post));
  } catch (e) {
    console.log(
      "this is my error occuring in createPostController in post controller ::",
      e
    );
    return res.send(error(500, e.message));
  }
};
const likeAndUnlikePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const curUserId = req._id;

    const post = await Post.findById(postId).populate("owner");
    if (!post) {
      return res.send(error(404, "Post not found"));
    }

    if (post.likes.includes(curUserId)) {
      const index = post.likes.indexOf(curUserId);
      post.likes.splice(index, 1);
    } else {
      post.likes.push(curUserId);
    }
    await post.save();
    return res.send(success(200, { post: mapPostOutput(post, req._id) }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const updatePostController = async (req, res) => {
  try {
    const { postId, caption } = req.body;
    const curUserId = req._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.send(error(404, "Post not found"));
    }

    if (post.owner.toString() !== curUserId) {
      return res.send(error(403, "Only owners can update their post"));
    }
    // if command comes here it means the owner is trying to update their post.
    if (caption) {
      post.caption = caption; // updating the caption
    }

    await post.save();
    return res.send(success(200, { post }));
  } catch (e) {
    console.log(
      "error occuring in update post controller at postsController.js",
      e
    );
    return res.send(error(500, e.message));
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const curUserId = req._id;

    const post = await Post.findById(postId);
    const curUser = await User.findById(curUserId);

    if (!post) {
      return res.send(error(404, "Post not found"));
    }

    if (post.owner.toString() !== curUserId) {
      return res.send(error(403, "Only owners can delete their post"));
    }

    const index = curUser.posts.indexOf(postId);
    curUser.posts.splice(index, 1);
    await curUser.save();
    await post.remove();
    return res.send(success(200, "Post deleted"));
  } catch (e) {
    console.log("error in delete post at postsController.js", e);
    return res.send(error(500, e.message));
  }
};

module.exports = {
  createPostController,
  likeAndUnlikePost,
  updatePostController,
  deletePost,
};

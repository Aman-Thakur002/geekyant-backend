const express = require("express");
const UserController = require("../controller/users.controller");
const auth = require("../middleware/auth");
const api = express.Router();
const multer = require("multer");
import fs from "fs";


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.mkdirSync(global.config.userPictureUploadPath, { recursive: true });
    return cb(null, global.config.userPictureUploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    let ext = file.originalname.substring(
      file.originalname.lastIndexOf("."),
      file.originalname.length
    );
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

api.put(
  "/fcm-token",
  auth.ensureAuth("Engineer", "Manager","Engineer", "Customer"),
  UserController.UpdateFcmToken
);


api.post("/login", UserController.logIn);

api.post("/", auth.ensureAuth("Manager","Engineer"), UserController.createUser);

api.get(
  "/me",
  auth.ensureAuth("Engineer", "Manager"),
  UserController.checkUserStatus
);

api.delete("/delete", auth.ensureAuth("Manager","Engineer"), UserController.bulkDelete);
api.delete("/:id", auth.ensureAuth("Manager","Engineer"), UserController.deleteUser);
api.get("/", auth.ensureAuth("Manager","Engineer"), UserController.getUsers);
api.get("/:id", auth.ensureAuth("Manager","Engineer"), UserController.getUserById);
api.patch(
  "/:id",
  auth.ensureAuth("Manager","Engineer"),
  UserController.updateUserStatus
);
api.post("/send-otp", UserController.sendOTPFn);
api.put(
  "/:id",
  auth.ensureAuth("Manager","Engineer","Customer","Engineer"),
  upload.single("picture"),
  UserController.updateUser
);

api.post(
  "/verify-otp",
  UserController.verifyOtp
);

api.post(
  "/change-password",
  auth.ensureAuth("Engineer", "Manager","Engineer", "Customer"),
  UserController.changePassword
);
api.post("/forget-password", UserController.forgetPassword);

module.exports = api;

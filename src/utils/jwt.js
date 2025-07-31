const { Users } = require("../models");

import jwt from "jsonwebtoken";
const SECRET_KEY = process.env.JWT_SECRET;

// Function to Create Token
export function createAccesstoken(user) {
  const EXPIRE_IN = Math.floor(new Date().getTime() / 1000) + 24 * 24 * 60 * 60;
  const token = jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      type: user.type,
      expiresIn: EXPIRE_IN,
    },
    SECRET_KEY
  ); 
  // Update Token to user table
  Users.findByIdAndUpdate(user._id, {
    accessToken: token,
    lastLogin: new Date()
  }).exec();
  return token;
 }


// Function To Decode Token
export function decodeToken(token) {
  return jwt.verify(token, SECRET_KEY);
}

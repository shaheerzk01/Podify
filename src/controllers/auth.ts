import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { CreateUser, VerifyEmailRequest } from "#/@types/user";
import User from "#/models/user";
import { formatProfile, generateToken } from "#/utils/helper";
import {
  sendForgetPasswordLink,
  sendPassResetSuccessEmail,
  sendVerificationMail,
} from "#/utils/mailHelper";
import emailVerificationToken from "#/models/emailVerificationToken";
import PasswordResetToken from "#/models/passwordResetToken";
import { isValidObjectId } from "mongoose";
import crypto from "crypto";
import { JWT_SECRET, PASSWORD_RESET_LINK } from "#/utils/variables";
import { RequestWithFiles } from "#/middleware/fileParser";
import cloudinary from "#/cloud";
import formidable from "formidable";
import user from "#/models/user";

export const create: RequestHandler = async (req: CreateUser, res) => {
  const { name, email, password } = req.body;

  const newUser = await User.create({ name, email, password });

  //send email verification
  const token = generateToken(6);
  await emailVerificationToken.create({
    owner: newUser._id,
    token,
  });
  sendVerificationMail(token, { name, email, userId: newUser._id.toString() });

  res.status(201).json({ newUser: { id: newUser._id, name, email } });
};

export const verifyEmail: RequestHandler = async (
  req: VerifyEmailRequest,
  res
) => {
  const { token, userId } = req.body;

  const verificationToken = await emailVerificationToken.findOne({
    owner: userId,
  });

  if (!verificationToken)
    return res.status(403).json({ error: "Invalid token!" });

  const matched = await verificationToken.compareToken(token);
  if (!matched) return res.status(403).json({ error: "Invalid token!" });

  await User.findByIdAndUpdate(userId, {
    verified: true,
  });
  await emailVerificationToken.findByIdAndDelete(verificationToken._id);

  res.json({ message: "Your email is verified." });
};

export const sendReVerificationToken: RequestHandler = async (req, res) => {
  const { userId } = req.body;

  if (!isValidObjectId(userId))
    return res.status(403).json({ error: "Invalid request!" });

  const user = await User.findById(userId);
  if (!user) return res.status(403).json({ error: "Invalid request!" });

  await emailVerificationToken.findOneAndDelete({
    owner: userId,
  });

  const token = generateToken(6);

  await emailVerificationToken.create({
    owner: userId,
    token,
  });

  sendVerificationMail(token, {
    name: user?.name,
    email: user?.email,
    userId: user?._id.toString(),
  });

  res.json({ message: "Please check you mail." });
};

export const generateForgetPasswordLink: RequestHandler = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({
    email,
  });

  if (!user) {
    return res.status(404).json({ error: "Account not found!" });
  }

  await PasswordResetToken.findOneAndDelete({
    owner: user._id,
  });
  //generate token for password link
  const token = crypto.randomBytes(36).toString("hex");

  await PasswordResetToken.create({
    owner: user._id,
    token,
  });

  const resetLink = `${PASSWORD_RESET_LINK}?token=${token}&userId=${user.id}`;

  sendForgetPasswordLink({ email: user.email, link: resetLink });

  res.json({ message: "Check your registered mail." });
};

export const grantValid: RequestHandler = (req, res) => {
  res.json({ valid: true });
};

export const updatePassword: RequestHandler = async (req, res) => {
  const { password, userId } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(403).json({ error: "Unauthorized access!" });
  }

  const matched = await user.comparePassword(password);
  if (matched) {
    return res
      .status(403)
      .json({ error: "The new password must be different!" });
  }

  user.password = password;

  await user.save();

  await PasswordResetToken.findOneAndDelete({
    owner: userId,
  });

  //send success email

  sendPassResetSuccessEmail(user.name, user.email);
  res.json({ message: "Password reset successfully." });
};

export const signIn: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    email,
  });
  if (!user) {
    return res.status(403).json({ error: "Email/Password mismatch!" });
  }

  const matched = await user.comparePassword(password);
  if (!matched) {
    return res.status(403).json({ error: "Email/Password mismatch!" });
  }

  //generate the token for later use.
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  //post this token to schema
  user.tokens.push(token);
  await user.save();

  res.json({
    profile: {
      id: user._id,
      name: user.name,
      email: user.email,
      verified: user.verified,
      avatar: user.avatar?.url,
      followers: user.followers.length,
      followings: user.followers.length,
    },
    token,
  });
};

export const updateProfile: RequestHandler = async (
  req: RequestWithFiles,
  res
) => {
  const { name } = req.body;
  const files = req.files?.avatar as formidable.File[];
  const avatar = files[0];
  const newName = name[0];
  const user = await User.findById(req.user.id);
  if (!user) throw new Error("something went wrong, user not found!");

  if (typeof newName !== "string")
    return res.status(422).json({ error: "Invalid name!" });

  if (newName.trim().length < 3)
    return res.status(422).json({ error: "Invalid name!" });

  user.name = newName;

  if (avatar) {
    // if there is already an avatar file, we want to remove that
    if (user.avatar?.publicId) {
      await cloudinary.uploader.destroy(user.avatar?.publicId);
    }
    // upload new avatar file
    try {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        avatar.filepath,
        {
          width: 300,
          height: 300,
          crop: "thumb",
          gravity: "face",
        }
      );
      user.avatar = { url: secure_url, publicId: public_id };
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
    }
  }
  await user.save();
  res.json({ Profile: formatProfile(user) });
};

export const sendProfile: RequestHandler = (req, res) => {
  res.json({ Profile: req.user });
};

export const logOut: RequestHandler =  async (req, res) =>{
  //logout and logout from all devices
  const {fromAll} = req.query;

  const token = req.token;
  const user = await User.findById(req.user.id)

  if (!user) throw new Error("something went wrong, user not found!");

  //logout from all
  if(fromAll === "yes"){
    user.tokens = []
  }else{
    user.tokens = user.tokens.filter((t) => t != token)
  }

  await user.save();

  res.json({success: true})

}

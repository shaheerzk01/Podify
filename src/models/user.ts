//interface (typescript)

import { compare, hash } from "bcrypt";
import { ObjectId, Schema, model, Model } from "mongoose";

export interface userDocument {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  verified: boolean;
  avatar?: { url: string; publicId: string };
  tokens: string[]; //tokens of authentication
  favorites: ObjectId[];
  followers: ObjectId[];
  following: ObjectId[];
}

interface Methods {
    comparePassword(password: string): Promise<boolean>;
  }

const userSchema = new Schema<userDocument, {}, Methods>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: Object,
      url: String,
      publicId: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: "Audio",
      },
    ],
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tokens: [String],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
    //hash the password
    if (this.isModified("password")) {
      this.password = await hash(this.password, 10);
    }
    next();
  });
  
  //method is used to compare the hash token from database to the token put by the user when he receive it through email
  userSchema.methods.comparePassword = async function (password) {
    const result = await compare(password, this.password);
    return result;
  };

export default model("User", userSchema) as Model<userDocument, {}, Methods>;

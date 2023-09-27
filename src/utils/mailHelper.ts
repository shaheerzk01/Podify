import nodemailer from "nodemailer";
import path from "path";

import {
  MAILTRAP_PASSWORD,
  MAILTRAP_USER,
  SIGN_IN_URL,
  VERIFICATION_EMAIL,
} from "#/utils/variables";
import { generateTemplate } from "#/mail/template";

const generateMailTransporter = () => {
  const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: MAILTRAP_USER,
      pass: MAILTRAP_PASSWORD,
    },
  });
  return transport;
};

interface Profile {
  name: string;
  email: string;
  userId: string;
}

export const sendVerificationMail = async (token: string, profile: Profile) => {
  const transport = generateMailTransporter();

  const { name, email, userId } = profile;

  //token = six digit otp = 123456 => send

  const welcomeMessage = `Hi ${name}, welcome to Podify! There are so much thing 
  that we do for verified users. Use the given otp to verify your email.`;

  transport.sendMail({
    to: email,
    from: VERIFICATION_EMAIL,
    subject: "Welcome message",
    html: generateTemplate({
      title: "Welcome to Podify",
      message: welcomeMessage,
      logo: "cid:logo",
      banner: "cid:welcome",
      link: "#",
      btnTitle: token,
    }),
    attachments: [
      {
        filename: "logo.png",
        path: path.join(__dirname, "../mail/logo.png"),
        cid: "logo", //content id
      },
      {
        filename: "welcome.png",
        path: path.join(__dirname, "../mail/welcome.png"),
        cid: "welcome", //content id
      },
    ],
  });
};

interface Options {
  email: string;
  link: string;
}

export const sendForgetPasswordLink = async (options: Options) => {
  const transport = generateMailTransporter();

  const { email, link } = options;

  //token = six digit otp = 123456 => send

  const message =
    "We just receive a request that you forget your password. No problem you can use the link below and create a brand new password";

  transport.sendMail({
    to: email,
    from: VERIFICATION_EMAIL,
    subject: "Reset Password Link",
    html: generateTemplate({
      title: "Forget Password",
      message,
      logo: "cid:logo",
      banner: "cid:forget_password",
      link,
      btnTitle: "Reset Password",
    }),
    attachments: [
      {
        filename: "logo.png",
        path: path.join(__dirname, "../mail/logo.png"),
        cid: "logo", //content id
      },
      {
        filename: "forget_password",
        path: path.join(__dirname, "../mail/forget_password.png"),
        cid: "forget_password", //content id
      },
    ],
  });
};

export const sendPassResetSuccessEmail = async (name: string, email: string) => {
    const transport = generateMailTransporter();
    
    const message =
      `Dear ${name} we just updated your new password. You can sign in with your new pasword.`
  
    transport.sendMail({
      to: email,
      from: VERIFICATION_EMAIL,
      subject: "Password Reset Successfully",
      html: generateTemplate({
        title: "Password Reset Successfully",
        message,
        logo: "cid:logo",
        banner: "cid:forget_password",
        link: SIGN_IN_URL,
        btnTitle: "Log in",
      }),
      attachments: [
        {
          filename: "logo.png",
          path: path.join(__dirname, "../mail/logo.png"),
          cid: "logo", //content id
        },
        {
          filename: "forget_password",
          path: path.join(__dirname, "../mail/forget_password.png"),
          cid: "forget_password", //content id
        },
      ],
    });
  };

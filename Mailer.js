const nodemailer = require("nodemailer");
const { config } = require("dotenv");
// import nodemailer from "nodemailer";
// import { config } from "dotenv";

config();

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "alfredchrisayo@gmail.com",
    pass: process.env.MAIL_PASSWORD,
  },
});
module.exports = { mailTransporter };

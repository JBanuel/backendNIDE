import nodemailer from 'nodemailer';
import config from '../config.mjs';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.ES_EMAIL,
    pass: config.ES_PASSWORD
  }
});

export default transporter;



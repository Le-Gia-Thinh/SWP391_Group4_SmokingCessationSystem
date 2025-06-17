// utils/mailer
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,     // VD: your_email@gmail.com
    pass: process.env.EMAIL_PASS      // VD: mật khẩu ứng dụng (app password)
  }
});

const sendResetEmail = async (to, resetLink) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Đặt lại mật khẩu - QuitSmoking',
    html: `<p>Bạn đã yêu cầu đặt lại mật khẩu.</p><p>Nhấn vào link dưới đây để thực hiện:</p><a href="${resetLink}">${resetLink}</a>`
  });
};

module.exports = { sendResetEmail };
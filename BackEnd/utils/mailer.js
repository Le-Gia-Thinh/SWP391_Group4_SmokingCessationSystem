// utils/mailer
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,     // VD: your_email@gmail.com
    pass: process.env.EMAIL_PASS      // VD: mật khẩu ứng dụng (app password)
  }
});

// 1. Gửi email đặt lại mật khẩu
const sendResetEmail = async (to, resetLink) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Đặt lại mật khẩu - QuitSmoking',
    html: `<p>Bạn đã yêu cầu đặt lại mật khẩu.</p><p>Nhấn vào link dưới đây để thực hiện:</p><a href="${resetLink}">${resetLink}</a>`
  });
};

module.exports = { sendResetEmail };

// 2. Gửi thông tin account đến mail Coach
const sendCoachCredentials = async ({ to, name, email, password }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Thông tin tài khoản Coach - QuitSmoking',
    html: `
      <h3>🎉 Tài khoản Coach đã được tạo thành công!</h3>
      <p>Xin chào <strong>${name}</strong>,</p>
      <p>Thông tin đăng nhập của bạn như sau:</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Mật khẩu:</strong> ${password}</li>
      </ul>
      <p>🔐 Vui lòng đăng nhập và đổi mật khẩu sau lần đầu sử dụng.</p>
      <br/>
      <p>Trân trọng,<br/>QuitSmoking Team</p>
    `
  });
};

module.exports = {
  sendResetEmail,
  sendCoachCredentials
};
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

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

module.exports = sendCoachCredentials;
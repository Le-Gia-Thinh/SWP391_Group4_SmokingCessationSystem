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
    subject: '🔐 Đặt lại mật khẩu - QuitSmoking',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; padding: 30px;">
        <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); padding: 30px;">
          <h2 style="color: #52c41a; text-align: center;">🔐 Yêu cầu đặt lại mật khẩu</h2>
          <p style="font-size: 15px; color: #333;">Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
          <p style="font-size: 15px; color: #333;">Vui lòng nhấn vào nút bên dưới để tạo mật khẩu mới:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetLink}" style="background-color: #52c41a; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">🔁 Đặt lại mật khẩu</a>
          </div>
          <p style="font-size: 13px; color: #888;">Nếu bạn không yêu cầu thay đổi mật khẩu, hãy bỏ qua email này.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #aaa; text-align: center;">© ${new Date().getFullYear()} QuitSmoking System</p>
        </div>
      </div>
    `
  });
};

module.exports = { sendResetEmail };
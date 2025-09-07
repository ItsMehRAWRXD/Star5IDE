const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'SendGrid',
  auth: {
    user: process.env.SENDGRID_USERNAME || 'your_sendgrid_username',
    pass: process.env.SENDGRID_API_KEY || 'your_sendgrid_key'
  }
});

exports.sendWelcomeEmail = async (user) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@yourcompany.com',
    to: user.email,
    subject: 'Welcome to Our SaaS Platform',
    html: `<h1>Welcome ${user.firstName}!</h1>`
  };

  await transporter.sendMail(mailOptions);
};

exports.sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@yourcompany.com',
    to: user.email,
    subject: 'Password Reset Request',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password</p>`
  };

  await transporter.sendMail(mailOptions);
};

import nodemailer from 'nodemailer';

// Create reusable transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send verification email to user
 * @param {string} email - User's email address
 * @param {string} username - User's username
 * @param {string} token - Verification token
 * @param {string} frontendUrl - Frontend base URL for verification link
 */
export const sendVerificationEmail = async (email, username, token, frontendUrl) => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email credentials not configured. EMAIL_USER or EMAIL_PASS is missing.');
    console.error('   EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'MISSING');
    console.error('   EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'MISSING');
    return { success: false, error: 'Email credentials not configured' };
  }

  console.log('📧 Attempting to send verification email to:', email);
  console.log('   Using EMAIL_USER:', process.env.EMAIL_USER);

  const transporter = createTransporter();

  const verificationUrl = `${frontendUrl}/verify-email/${token}`;

  const mailOptions = {
    from: `"Typing Sprint" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - Typing Sprint',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #22c55e; margin: 0;">⌨️ Typing Sprint</h1>
        </div>
        
        <div style="background-color: #1a1a1a; border-radius: 10px; padding: 30px; border: 1px solid #333;">
          <h2 style="color: #22c55e; margin-top: 0;">Welcome, ${username}!</h2>
          
          <p style="color: #cccccc; line-height: 1.6;">
            Thank you for signing up for Typing Sprint. To complete your registration and start improving your typing speed, please verify your email address.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 14px 32px; background-color: #22c55e; color: #000000; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Verify Email
            </a>
          </div>
          
          <p style="color: #888888; font-size: 14px;">
            Or copy and paste this link into your browser:<br/>
            <a href="${verificationUrl}" style="color: #22c55e; word-break: break-all;">${verificationUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;"/>
          
          <p style="color: #666666; font-size: 12px; margin: 0;">
            This link will expire in 24 hours. If you didn't create an account with Typing Sprint, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666666; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Typing Sprint. Happy typing!</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    console.error('   Full error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate a random verification token
 * @returns {string} Random token string
 */
export const generateVerificationToken = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, body }) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : undefined;

  if (!user || !pass) {
    console.log(`
┌────────────────────────────────────────────────────────┐
│               ✉  EMAIL SENT (SIMULATION)               │
├────────────────────────────────────────────────────────┤
│ TO:      ${to.padEnd(46)} │
│ SUBJECT: ${subject.substring(0, 45).padEnd(46)} │
├────────────────────────────────────────────────────────┤
│ BODY:                                                  │
│ ${body.split('\n').map(line => line.substring(0, 52).padEnd(52)).join(' |\n│ ')}
└────────────────────────────────────────────────────────┘
`);
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass
      }
    });

    const info = await transporter.sendMail({
      from: `"Mini CRM" <${user}>`,
      to,
      subject,
      html: body.replace(/\n/g, '<br />')
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Gmail SMTP email delivery failed. Error details:', error.message);
    return { success: false, error: error.message };
  }
};


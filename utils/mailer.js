const mailer = require('nodemailer');

const sendEmail = async options => {

    const transporter = mailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.ADMIN_USERNAME,
            pass: process.env.ADMIN_PASSWORD
        }
    });

    const emailOptions = {
        from: `Adil Nehal <${process.env.ADMIN_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    await transporter.sendMail(emailOptions);
}

module.exports = sendEmail;
require('dotenv').config();
const mailer = require('nodemailer');

const tx = mailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function test() {
    console.log("Testing email connection with:", process.env.EMAIL_USER);
    try {
        await tx.verify();
        console.log("✅ Email SMTP Connection Successful!");
    } catch (err) {
        console.error("❌ Email Connection Failed!");
        console.error(err);
    }
}
test();

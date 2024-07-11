const express = require("express");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const cors = require("cors");
const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());
require("dotenv").config();

app.post("/api/referrals", async (req, res) => {
  try {
    const { name, email, friendsName, friendsEmail, course } = req.body;

    if (!name || !email || !friendsName || !friendsEmail || !course) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const referral = await prisma.referral.create({
      data: {
        name,
        email,
        friendsName,
        friendsEmail,
        course,
      },
    });

    await sendReferralEmail(referral);

    res.status(201).json({ message: "Referral saved successfully" });
  } catch (error) {
    console.error("Error processing referral:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your referral" });
  }
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendReferralEmail(referral) {
  try {
    const info = await transporter.sendMail({
      from: '"accredian" <' + process.env.EMAIL_USER + ">",
      to: referral.friendsEmail,
      subject: "You've been referred!",
      text: `Hello ${referral.friendsName},

You've been referred by your friend ${referral.name} for the ${referral.course} course. We'd love to have you join us!

Best regards,
The Accredian Team
Visit our website: https://accredian.com/#courses
`,
      html: `<p>Hello ${referral.friendsName},</p>
<p>You've been referred by your friend ${referral.name} for the <strong>${referral.course}</strong> course. We'd love to have you join us!</p>
<p>Best regards,<br>The Accredian Team</p>
<p>Visit our website: <Link href="https://accredian.com/#courses">https://accredian.com/#courses</a></p>`,
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

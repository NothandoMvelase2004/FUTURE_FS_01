const express = require("express");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Server is alive");
});

app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!email || !name || !message) {
    return res.status(400).send("All fields are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send("The email is invalid");
  }

  const to = "nmelecent@gmail.com";

  const emailBody = `
You received a message from your portfolio website.

Name: ${name}
Email: ${email}
Message:
${message}
`;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: "nmelecent@gmail.com",
      subject: "Message from Portfolio Website",
      text: message,
    });

    res.send("Message sent successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("There was an error sending your message");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


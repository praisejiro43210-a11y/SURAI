require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const { saveSurveyData, getAllSurveyData } = require('./survey');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

// Serve frontend if needed
app.use(express.static(path.join(__dirname)));

// ===== Email transporter =====
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465, // SSL port
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ===== ROUTES =====

// Handle survey submission
app.post('/submit-survey', async (req, res) => {
    try {
        const { userData, surveyAnswers } = req.body;
        if (!userData || !surveyAnswers) {
            return res.status(400).json({ success: false, message: 'Missing survey data' });
        }

        const surveyId = saveSurveyData(userData, surveyAnswers);

        // Send emails asynchronously, catch errors
        sendWelcomeEmail(userData.email, userData.name).catch(err => console.error('Welcome email error:', err));
        sendAdminEmail(surveyId, userData, surveyAnswers).catch(err => console.error('Admin email error:', err));

        res.json({ success: true, message: 'Survey submitted successfully', surveyId });
    } catch (error) {
        console.error('Error submitting survey:', error);
        res.status(500).json({ success: false, message: 'Error submitting survey' });
    }
});

// Get all survey data for admin
app.get('/admin-data', (req, res) => {
    try {
        const data = getAllSurveyData();
        res.json(data);
    } catch (error) {
        console.error('Error fetching survey data:', error);
        res.status(500).json({ error: 'Failed to fetch survey data' });
    }
});

// ===== Email helpers =====
async function sendWelcomeEmail(email, name) {
    if (!email) return;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to SURAI – We’re Glad You’re Here!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #f7f8fa; border-radius: 8px;">
                <h2>Hello ${name || 'there'}, welcome to SURAI!</h2>
                <p>Thanks for joining our AI interaction survey. Your input helps us improve!</p>
                <p>– The SURAI Team</p>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
}

async function sendAdminEmail(surveyId, userData, surveyAnswers) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: adminEmail,
        subject: `📥 New SURAI Survey Submission | ID: ${surveyId}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; padding: 20px; background: #f1f5f9; border-radius: 8px;">
                <h3>New Submission Received</h3>
                <p><strong>Name:</strong> ${userData.name}</p>
                <p><strong>Email:</strong> ${userData.email}</p>
                <p><strong>Age:</strong> ${userData.age || 'N/A'}</p>
                <h4>Answers:</h4>
                <ul>${surveyAnswers.map(a => `<li>${a}</li>`).join('')}</ul>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
}

// ===== Start server =====
app.listen(PORT, () => {
    console.log(`✅ SURAI backend running on port ${PORT}`);
});
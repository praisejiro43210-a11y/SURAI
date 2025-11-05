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

// ✅ Allow all origins for testing (you can later restrict to your frontend URL)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Serve your frontend (optional: if HTML is in same folder)
app.use(express.static(path.join(__dirname)));

// ===== Email transporter =====
const transporter = nodemailer.createTransport({
    service: 'gmail',
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

        // Send emails (safe fail)
        sendWelcomeEmail(userData.email, userData.name).catch(console.error);
        sendAdminEmail(surveyId, userData, surveyAnswers).catch(console.error);

        res.json({ success: true, message: 'Survey submitted successfully', surveyId });
    } catch (error) {
        console.error('Error submitting survey:', error);
        res.status(500).json({ success: false, message: 'Error submitting survey' });
    }
});

// Admin data view
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
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to SURAI – We’re Glad You’re Here!',
        html: `<h2>Hello ${name || 'there'}, welcome to SURAI!</h2>
               <p>Thanks for joining our AI interaction survey!</p>`
    });
}

async function sendAdminEmail(surveyId, userData, surveyAnswers) {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `📥 New SURAI Survey Submission | ID: ${surveyId}`,
        html: `
            <h3>New Submission Received</h3>
            <p><strong>User:</strong> ${userData.name}</p>
            <p><strong>Email:</strong> ${userData.email}</p>
            <h4>Answers:</h4>
            <ul>${surveyAnswers.map(a => `<li>${a}</li>`).join('')}</ul>
        `
    });
}

// ===== Server start =====
app.listen(PORT, () => {
    console.log(`✅ SURAI backend running on port ${PORT}`);
});
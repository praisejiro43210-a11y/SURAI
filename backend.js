require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { saveSurveyData } = require('./survey');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files like SURAI.html

// Email transporter (configure with your email service)
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email service
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com', // Set your email
        pass: process.env.EMAIL_PASS || 'your-app-password' // Set your app password
    }
});

// Route to submit survey
app.post('/submit-survey', async (req, res) => {
    try {
        const { userData, surveyAnswers } = req.body;

        // Save survey data
        const surveyId = saveSurveyData(userData, surveyAnswers);

        // Try to send welcome email (don't fail if email fails)
        try {
            await sendWelcomeEmail(userData.email, userData.name);
        } catch (emailError) {
            console.error('Welcome email sending failed:', emailError.message);
            // Continue without failing the submission
        }

        // Try to send admin confirmation email (don't fail if email fails)
        try {
            await sendAdminEmail(surveyId, userData, surveyAnswers);
        } catch (emailError) {
            console.error('Admin email sending failed:', emailError.message);
            // Continue without failing the submission
        }

        res.json({ success: true, message: 'Survey submitted successfully', surveyId });
    } catch (error) {
        console.error('Error submitting survey:', error);
        res.status(500).json({ success: false, message: 'Error submitting survey' });
    }
});

// Route to send update message (for future use)
app.post('/send-update', async (req, res) => {
    try {
        const { email, message } = req.body;
        await sendUpdateEmail(email, message);
        res.json({ success: true, message: 'Update sent successfully' });
    } catch (error) {
        console.error('Error sending update:', error);
        res.status(500).json({ success: false, message: 'Error sending update' });
    }
});

// Function to send welcome email
async function sendWelcomeEmail(email, name) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to SURAI – We’re Glad You’re Here!',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; background-color: #f9f9ff; border: 1px solid #e0e0f0;">
                <h2 style="color: #5a67d8; text-align: center;">Hello ${name}, welcome to <span style="color: #667eea;">SURAI</span>!</h2>
                <p style="font-size: 16px; color: #333;">Thank you for joining our AI interaction survey. Your input helps us create smarter, more human-centered AI experiences that truly make a difference.</p>
                <p style="font-size: 16px; color: #333;">We’re excited to have you with us on this journey. Keep an eye on your inbox for updates on our progress and insights from the data you’ve helped us collect.</p>
                <p style="font-size: 16px; color: #333;">Together, we’re shaping the future of artificial intelligence.</p>
                <div style="margin-top: 30px; text-align: center;">
                    <p style="color: #5a67d8; font-weight: bold;">– The SURAI Team</p>
                </div>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}


// Function to send admin confirmation email
async function sendAdminEmail(surveyId, userData, surveyAnswers) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@surai.com'; // Set admin email
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: adminEmail,
        subject: `📥 New SURAI Survey Submission | ID: ${surveyId}`,
        html: `
            <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; padding: 30px; border: 1px solid #1e293b;">
                <h2 style="color: #60a5fa; margin-bottom: 15px;">New Survey Submission Received</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                    A new user has completed the AI interaction survey. Below are the details of the submission:
                </p>
                <div style="background: #1e293b; border-radius: 8px; padding: 15px 20px; margin-top: 20px;">
                    <p style="margin: 5px 0;"><strong style="color: #93c5fd;">Survey ID:</strong> ${surveyId}</p>
                    <p style="margin: 5px 0;"><strong style="color: #93c5fd;">User:</strong> ${userData.name}</p>
                    <p style="margin: 5px 0;"><strong style="color: #93c5fd;">Email:</strong> ${userData.email}</p>
                    <p style="margin: 5px 0;"><strong style="color: #93c5fd;">Age:</strong> ${userData.age}</p>
                </div>
                <h3 style="color: #818cf8; margin-top: 30px;">Survey Answers</h3>
                <ul style="list-style-type: none; padding-left: 0;">
                    ${surveyAnswers.map((answer, index) => `
                        <li style="margin-bottom: 10px; background: #1e293b; padding: 10px 15px; border-radius: 6px;">
                            <strong style="color: #93c5fd;">Q${index + 1}:</strong> 
                            <span style="color: #e2e8f0;">${answer}</span>
                        </li>
                    `).join('')}
                </ul>
                <hr style="border: none; border-top: 1px solid #1e293b; margin: 30px 0;">
                <p style="font-size: 14px; color: #94a3b8;">This is an automated notification from the SURAI system.</p>
                <p style="font-size: 15px; color: #60a5fa; font-weight: 600;">— SURAI Admin Console</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}

// Function to send update email
async function sendUpdateEmail(email, message) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'SURAI Update',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">SURAI Update</h2>
                <p>${message}</p>
                <p>Best regards,<br>The SURAI Team</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}

// Route to serve admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/dashboard.html');
});

// Route to get all survey data for admin
app.get('/admin-data', (req, res) => {
    try {
        const { getAllSurveyData } = require('./survey');
        const data = getAllSurveyData();
        res.json(data);
    } catch (error) {
        console.error('Error fetching survey data:', error);
        res.status(500).json({ error: 'Failed to fetch survey data' });
    }
});

app.listen(PORT, () => {
    console.log(`SURAI backend server running on port ${PORT}`);
});

const fs = require('fs'); const path = require('path');

const surveyDataFile = path.join(__dirname, 'surveyData.json');

// Initialize survey data file if it doesn't exist if (!fs.existsSync(surveyDataFile)) { fs.writeFileSync(surveyDataFile, JSON.stringify([], null, 2)); }

// Function to save survey data function saveSurveyData(userData, surveyAnswers) { const data = { id: Date.now().toString(), user: userData, answers: surveyAnswers, timestamp: new Date().toISOString() };
const existingData = JSON.parse(fs.readFileSync(surveyDataFile, 'utf8'));   existingData.push(data);   fs.writeFileSync(surveyDataFile, JSON.stringify(existingData, null, 2));    return data.id;   
}

// Function to get all survey data (for admin purposes) function getAllSurveyData() { return JSON.parse(fs.readFileSync(surveyDataFile, 'utf8')); }

module.exports = { saveSurveyData, getAllSurveyData };
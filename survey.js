const fs = require('fs');
const path = require('path');

const surveyDataFile = path.join(__dirname, 'surveyData.json');

// Initialize survey data file if it doesn't exist
if (!fs.existsSync(surveyDataFile)) {
    fs.writeFileSync(surveyDataFile, JSON.stringify([], null, 2));
}

// Function to save survey data
function saveSurveyData(userData, surveyAnswers) {
    const data = {
        id: Date.now().toString(),
        user: userData,
        answers: surveyAnswers,
        timestamp: new Date().toISOString()
    };

    try {
        const existingData = JSON.parse(fs.readFileSync(surveyDataFile, 'utf8'));
        existingData.push(data);
        fs.writeFileSync(surveyDataFile, JSON.stringify(existingData, null, 2));
    } catch (err) {
        console.error('Error saving survey data:', err);
        throw new Error('Failed to save survey data');
    }

    return data.id;
}

// Function to get all survey data (for admin purposes)
function getAllSurveyData() {
    try {
        return JSON.parse(fs.readFileSync(surveyDataFile, 'utf8'));
    } catch (err) {
        console.error('Error reading survey data:', err);
        return [];
    }
}

module.exports = { saveSurveyData, getAllSurveyData };
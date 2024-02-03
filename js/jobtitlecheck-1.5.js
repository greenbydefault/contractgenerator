console.log('Das Script wurde geladen.');   
import config from './config/config.js';

// Debounce-Funktion
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Eingabefeld-Event-Listener mit Debouncing
const jobTitleInput = document.getElementById('jobname');
jobTitleInput.addEventListener('input', debounce(async function(e) {
    const jobTitle = e.target.value;
    // Asynchrone Anfrage, um den Jobtitel zu überprüfen
    const exists = await checkJobTitleExists(jobTitle);
    const messageElement = document.getElementById('message');
    const submitButton = document.getElementById('submitButton');
    if (exists) {
        // Setze den roten Rahmen, wenn der Jobtitel bereits vorhanden ist
        jobTitleInput.style.border = '2px solid #D92415';
        messageElement.textContent = 'Dieser Jobtitel existiert bereits. Bitte verwende einen eindeutigen Namen';
        messageElement.style.color = 'red';
        submitButton.classList.add('hide');
    } else {
        // Setze den grünen Rahmen, wenn der Name verfügbar ist
        jobTitleInput.style.border = '2px solid #3DB927';
        messageElement.textContent = 'Dieser Jobtitel ist verfügbar.';
        messageElement.style.color = 'green';
        submitButton.classList.remove('hide');

    }
}, 500)); // Wartezeit von 500ms

// Funktion, um den Jobtitel zu überprüfen
async function checkJobTitleExists(title) {
    const apiKey = config.apiKey;
    const baseId = 'appVQBmxIpYuapHVR';
    const tableName = 'Jobs';
    const dynamicFieldName = 'Name'; // Das Feld, nach dem gesucht wird
    const query = encodeURIComponent(`LOWER({${dynamicFieldName}})="${title.toLowerCase()}"`);

    const url = `https://api.airtable.com/v0/${baseId}/${tableName}?filterByFormula=${query}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });
        const data = await response.json();
        // Wenn "records" leer ist, existiert der Titel nicht
        return data.records && data.records.length > 0;
    } catch (error) {
        console.error('Fehler beim Überprüfen des Jobtitels:', error);
        return false; // Im Fehlerfall sicherheitshalber false zurückgeben
    }
}

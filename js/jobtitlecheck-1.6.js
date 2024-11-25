console.log('Das Script wurde geladen.');
import config from './config/config.js';

// Debounce-Funktion
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Funktion, um Sonderzeichen zu prüfen (nur erlaubte Zeichen: Buchstaben, Zahlen, deutsche Umlaute)
function isValidJobTitle(title) {
    // Regex: erlaubt sind Buchstaben (A-Z, a-z), Zahlen (0-9), deutsche Umlaute (äöüÄÖÜß) und Leerzeichen
    const regex = /^[a-zA-Z0-9äöüÄÖÜß\s]+$/;
    return regex.test(title);
}

// Eingabefeld-Event-Listener mit Debouncing
const jobTitleInput = document.getElementById('jobname');
jobTitleInput.addEventListener('input', debounce(async function (e) {
    const jobTitle = e.target.value;
    const messageElement = document.getElementById('message');
    const submitButton = document.getElementById('submitButton');

    // Prüfen, ob der Jobtitel gültig ist
    if (!isValidJobTitle(jobTitle)) {
        jobTitleInput.style.border = '2px solid #D92415';
        messageElement.textContent = 'Der Jobtitel enthält ungültige Zeichen. Erlaubt sind nur Buchstaben, Zahlen und deutsche Umlaute.';
        messageElement.style.color = 'red';
        submitButton.classList.add('hide');
        return;
    }

    // Asynchrone Anfrage, um den Jobtitel zu überprüfen
    const exists = await checkJobTitleExists(jobTitle);
    if (exists) {
        // Setze den roten Rahmen, wenn der Jobtitel bereits vorhanden ist
        jobTitleInput.style.border = '2px solid #D92415';
        messageElement.textContent = 'Dieser Jobtitel existiert bereits. Bitte verwende einen eindeutigen Namen.';
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

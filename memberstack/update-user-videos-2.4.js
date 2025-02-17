console.log('Das Script wurde geladen.');

const UPLOADCARE_API_URL = 'https://api.uploadcare.com/files/storage/';
const UPLOADCARE_DELETE_URL = 'https://api.uploadcare.com/files/';
const UPLOADCARE_PUBLIC_KEY = 'xx'; // Setze hier deinen Uploadcare Public Key ein
const UPLOADCARE_SECRET_KEY = 'xx'; // Setze hier deinen Uploadcare Secret Key ein

const FILE_UUIDS = [
    "2874ea3c-a559-421a-ba8d-c98bb7707da2",
    "6faf64f7-14a5-4c15-bb42-66b0aed0815e",
    "b95f9017-cc37-4ff5-a0e6-7f1d01e83b82",
    "ccd4a363-2f30-4d12-94a4-e2dcfa1b8c9a",
    "413ddb19-1825-44d1-922b-20874f00ba48",
    "6e9f7a62-63e7-4c22-b4c6-f4d9418c7eb4",
    "ec0f2dfc-a03c-4d47-9416-85353791e61a",
    "c55ae604-eac3-491d-9f53-b77d14b08fa3"
];

document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('delete-uploadcare-files-button'); // Ensure your Webflow button has this ID
    if (!button) {
        console.error("Button mit ID 'delete-uploadcare-files-button' nicht gefunden.");
        return;
    }

    button.addEventListener('click', async function() {
        console.log(`Löschvorgang gestartet für ${FILE_UUIDS.length} Dateien...`);

        try {
            const response = await fetch(UPLOADCARE_DELETE_URL, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/vnd.uploadcare-v0.7+json',
                    'Authorization': `Uploadcare.Simple ${UPLOADCARE_PUBLIC_KEY}:${UPLOADCARE_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(FILE_UUIDS)
            });

            if (!response.ok) {
                console.error(`Fehlerhafte Antwort: ${response.status} - ${response.statusText}`);
                alert(`Fehler beim Löschen: ${response.statusText}. Siehe Konsole für Details.`);
                return;
            }

            const result = await response.json();
            console.log('Erfolgreich gelöschte Dateien:', result);
            alert('Die Dateien wurden erfolgreich gelöscht.');
        } catch (error) {
            console.error('Fehler beim Löschen der Dateien:', error);
            alert('Fehler beim Löschen der Dateien. Siehe Konsole für Details.');
        }
    });
});

// Webflow API Integration für GitHub-Hosting

// Funktion zum Abrufen von Collection-Items
async function fetchCollectionItem(collectionId, memberstackId) {
    const apiUrl = `https://api.webflow.com/v2/collections/${collectionId}/items?live=true`;
    const workerUrl = `https://bewerbungen.oliver-258.workers.dev/?url=${encodeURIComponent(apiUrl)}`;

    console.log(`🌍 Worker-Anfrage: ${workerUrl}`);

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const userItem = data.items.find(item => item.fieldData?.['memberstack-id'] === memberstackId);
        console.log(`✅ Erfolgreiche API-Antwort:`, userItem);
        return userItem;
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen der Collection: ${error.message}`);
        throw error;
    }
}

// Funktion zum Abrufen von Job-Namen
async function fetchJobName(jobId) {
    const jobCollectionId = "6448faf9c5a8a17455c05525"; // Ersetze mit der Job-Collection-ID
    const apiUrl = `https://api.webflow.com/v2/collections/${jobCollectionId}/items/${jobId}/live`;
    const workerUrl = `https://bewerbungen.oliver-258.workers.dev/?url=${encodeURIComponent(apiUrl)}`;

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }

        const jobData = await response.json();
        return jobData.fieldData?.name || "Unbekannter Job";
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen des Job-Namens: ${error.message}`);
        return "Fehler beim Abrufen";
    }
}

// Beispiel-Aufruf der Funktion
async function displayUserApplications() {
    const collectionId = "6448faf9c5a8a15f6cc05526"; // Webflow Collection ID

    try {
        const member = await window.$memberstackDom.getCurrentMember();
        const memberstackId = member?.data?.id;

        if (!memberstackId) {
            console.error("❌ Kein eingeloggter Benutzer gefunden.");
            return;
        }

        console.log(`👤 Eingeloggte Memberstack-ID: ${memberstackId}`);

        const userData = await fetchCollectionItem(collectionId, memberstackId);
        const applications = userData?.fieldData?.["abgeschlossene-bewerbungen"] || [];

        const appContainer = document.getElementById("application-list");
        appContainer.innerHTML = "";

        if (applications.length > 0) {
            console.log("🎯 Abgeschlossene Bewerbungen:", applications);
            for (const appId of applications) {
                const jobName = await fetchJobName(appId);
                const listItem = document.createElement("li");
                listItem.textContent = `📝 ${jobName}`;
                appContainer.appendChild(listItem);
            }
        } else {
            appContainer.innerHTML = "<p>🚫 Keine abgeschlossenen Bewerbungen gefunden.</p>";
        }
    } catch (error) {
        console.error("❌ Fehler beim Laden der Bewerbungen:", error);
    }
}

// Start der Anwendung
window.addEventListener("DOMContentLoaded", displayUserApplications);

// Webflow API Integration für GitHub-Hosting

// Funktion zum Abrufen von Collection-Items
async function fetchCollectionItem(collectionId, webflowMemberId) {
    const apiUrl = `https://api.webflow.com/v2/collections/${collectionId}/items/${webflowMemberId}/live`;
    const workerUrl = `https://bewerbungen.oliver-258.workers.dev/?url=${encodeURIComponent(apiUrl)}`;

    console.log(`🌍 Worker-Anfrage: ${workerUrl}`);

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }

        const userItem = await response.json();
        console.log(`✅ Erfolgreiche API-Antwort:`, userItem);
        return userItem;
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen der Collection: ${error.message}`);
        throw error;
    }
}

// Funktion zum Abrufen von Job-Daten
async function fetchJobData(jobId) {
    const jobCollectionId = "6448faf9c5a8a17455c05525";
    const apiUrl = `https://api.webflow.com/v2/collections/${jobCollectionId}/items/${jobId}/live`;
    const workerUrl = `https://bewerbungen.oliver-258.workers.dev/?url=${encodeURIComponent(apiUrl)}`;

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }

        const jobData = await response.json();
        return jobData.fieldData || {};
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen der Job-Daten: ${error.message}`);
        return {};
    }
}

// Beispiel-Aufruf der Funktion
async function displayUserApplications() {
    const collectionId = "6448faf9c5a8a15f6cc05526";

    try {
        const member = await window.$memberstackDom.getCurrentMember();
        const webflowMemberId = member?.data?.customFields?.['webflow-member-id'];

        if (!webflowMemberId) {
            console.error("❌ Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
            return;
        }

        console.log(`👤 Eingeloggte Webflow Member-ID: ${webflowMemberId}`);

        const userData = await fetchCollectionItem(collectionId, webflowMemberId);
        const applications = userData?.fieldData?.["abgeschlossene-bewerbungen"] || [];

        const appContainer = document.getElementById("application-list");
        appContainer.innerHTML = "";

        if (applications.length > 0) {
            console.log("🎯 Abgeschlossene Bewerbungen:", applications);
            for (const appId of applications) {
                const jobData = await fetchJobData(appId);

                const jobDiv = document.createElement("div");
                jobDiv.classList.add("db-table-row", "db-table-bewerbungen");

                const fields = [
                    { key: "name", label: "Job-Name" },
                    { key: "job-image", label: "Bild" },
                    { key: "job-payment", label: "Bezahlung" },
                    { key: "job-date-end", label: "Enddatum" },
                    { key: "fertigstellung-content", label: "Fertigstellung" }
                ];

                fields.forEach(field => {
                    const value = jobData[field.key] || "Nicht verfügbar";
                    const fieldDiv = document.createElement("div");
                    fieldDiv.classList.add("db-table-row-item", "is-txt-16");

                    if (field.key === "job-image" && value.startsWith("http")) {
                        const img = document.createElement("img");
                        img.src = value;
                        img.alt = field.label;
                        img.style.maxWidth = "100px";
                        fieldDiv.appendChild(img);
                    } else {
                        fieldDiv.textContent = value;
                    }

                    jobDiv.appendChild(fieldDiv);
                });

                appContainer.appendChild(jobDiv);
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

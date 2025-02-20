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

// Deadline-Countdown berechnen
function calculateDeadlineCountdown(endDate) {
    const now = new Date();
    const deadline = new Date(endDate);
    const diff = deadline - now;

    if (diff <= 0) return "⏳ Abgelaufen";

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Endet in ${days} Tag(en)`;
    if (hours > 0) return `Endet in ${hours} Stunde(n)`;
    return `Endet in ${minutes} Minute(n)`;
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

            // 🚀 Parallel alle Job-Daten abrufen
            const jobPromises = applications.map(async (appId) => {
                const jobData = await fetchJobData(appId);
                return { appId, jobData };
            });

            // 🟢 Alle Anfragen parallel abschließen
            const jobResults = await Promise.all(jobPromises);

            // 📄 Ergebnisse rendern
            jobResults.forEach(({ jobData }, index) => {
                const jobDiv = document.createElement("div");
                jobDiv.classList.add("db-table-row", "db-table-bewerbungen");
                if (index === 0) jobDiv.classList.add("justify-left");

                // Gemeinsames Div für Bild und Name
                const jobInfoDiv = document.createElement("div");
                jobInfoDiv.classList.add("db-table-row-item", "justify-left");

                // Bild
                const jobImage = document.createElement("img");
                jobImage.classList.add("db-table-img", "is-margin-right-12");
                jobImage.src = jobData["job-image"] || "https://via.placeholder.com/100";
                jobImage.alt = jobData["name"] || "Job Bild";
                jobImage.style.maxWidth = "100px";
                jobInfoDiv.appendChild(jobImage);

                // Name
                const jobName = document.createElement("span");
                jobName.classList.add("truncate");
                jobName.textContent = jobData["name"] || "Unbekannter Job";
                jobInfoDiv.appendChild(jobName);

                jobDiv.appendChild(jobInfoDiv);

                // Weitere Felder
                const fields = [
                    { key: "job-payment", label: "Bezahlung" },
                    { key: "job-date-end", label: "Bewerbungsfrist" },
                    { key: "fertigstellung-content", label: "Fertigstellung" }
                ];

                fields.forEach(field => {
                    const value = jobData[field.key] || "Nicht verfügbar";
                    const fieldDiv = document.createElement("div");
                    fieldDiv.classList.add("db-table-row-item");

                    const fieldText = document.createElement("span");
                    fieldText.classList.add("is-txt-16");
                    
                    if (field.key === "job-payment" && value !== "Nicht verfügbar") {
                        fieldText.textContent = `${value} €`;
                    } else if (field.key === "job-date-end" && value !== "Nicht verfügbar") {
                        fieldText.textContent = calculateDeadlineCountdown(value);
                    } else {
                        fieldText.textContent = value;
                    }

                    fieldDiv.appendChild(fieldText);
                    jobDiv.appendChild(fieldDiv);
                });

                appContainer.appendChild(jobDiv);
            });
        } else {
            appContainer.innerHTML = "<p>🚫 Keine abgeschlossenen Bewerbungen gefunden.</p>";
        }
    } catch (error) {
        console.error("❌ Fehler beim Laden der Bewerbungen:", error);
    }
}

// Start der Anwendung
window.addEventListener("DOMContentLoaded", displayUserApplications);

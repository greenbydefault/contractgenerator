// Warten bis die Seite vollständig geladen ist
document.addEventListener("DOMContentLoaded", async () => {
    console.log("📜 Seite vollständig geladen.");

    const memberstack = window.$memberstackDom;

    try {
        // Memberstack-ID des eingeloggten Users abrufen
        const member = await memberstack.getCurrentMember();
        const memberstackId = member?.data?.id;

        if (!memberstackId) throw new Error("Keine Memberstack-ID gefunden.");

        console.log("🔑 Gefundene Memberstack-ID:", memberstackId);

        // Webflow API-Konfiguration
        const config = {
            apiToken: "4d57119959ae31735992550e9e2113af6c7b7e46b0f2faad05daf8f31aeae731",
            membersCollectionId: "6448faf9c5a8a15f6cc05526",
            jobsCollectionId: "6448faf9c5a8a17455c05525"
        };

        // Mitglieder-Collection abrufen
        const memberData = await fetchCollectionItem(config.membersCollectionId, config.apiToken, memberstackId);
        if (!memberData) throw new Error("Kein passender Member-Eintrag gefunden.");

        console.log("✅ Gefundener Member-Eintrag:", memberData);

        const jobIds = memberData.fieldData["abgeschlossene-bewerbungen"] || [];
        if (jobIds.length === 0) {
            displayMessage("Keine abgeschlossenen Bewerbungen gefunden.");
            return;
        }

        // Jobs abrufen und filtern
        const appliedJobs = await fetchJobs(config.jobsCollectionId, config.apiToken, jobIds);
        console.log("📄 Gefundene Bewerbungen:", appliedJobs);

        // Detaillierte Job-Informationen abrufen
        const detailedJobs = await Promise.all(appliedJobs.map(job => fetchJobDetails(config.jobsCollectionId, config.apiToken, job._id)));
        console.log("🔍 Detaillierte Bewerbungen:", detailedJobs);

        displayJobs(detailedJobs);
    } catch (error) {
        console.error("❌ Fehler im Prozess:", error.message);
        displayMessage(`Fehler: ${error.message}`);
    }
});

// Hilfsfunktion: Collection-Element abrufen
async function fetchCollectionItem(collectionId, apiToken, memberstackId) {
    try {
        console.log(`📡 Abrufen der Collection ${collectionId}...`);
        const response = await fetch(`https://api.webflow.com/collections/${collectionId}/items?live=true`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiToken}`,
                "accept-version": "1.0.0"
            }
        });

        if (!response.ok) throw new Error("Fehler beim Abrufen der Collection.");

        const data = await response.json();
        return data.items.find(item => item.fieldData["memberstack-id"] === memberstackId);
    } catch (error) {
        console.error("⚠️ Fehler beim Abrufen der Members Collection:", error);
        throw error;
    }
}

// Hilfsfunktion: Jobs abrufen
async function fetchJobs(collectionId, apiToken, jobIds) {
    try {
        console.log("📡 Abrufen der Jobs...");
        const response = await fetch(`https://api.webflow.com/collections/${collectionId}/items?live=true`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiToken}`,
                "accept-version": "1.0.0"
            }
        });

        if (!response.ok) throw new Error("Fehler beim Abrufen der Jobs Collection.");

        const data = await response.json();
        return data.items.filter(job => jobIds.includes(job._id));
    } catch (error) {
        console.error("⚠️ Fehler beim Abrufen der Jobs:", error);
        throw error;
    }
}

// Hilfsfunktion: Detaillierte Job-Informationen abrufen
async function fetchJobDetails(collectionId, apiToken, jobId) {
    try {
        console.log(`🔍 Abrufen der Details für Job ${jobId}...`);
        const response = await fetch(`https://api.webflow.com/v2/collections/${collectionId}/items/${jobId}/live`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiToken}`,
                "accept-version": "1.0.0"
            }
        });

        if (!response.ok) throw new Error(`Fehler beim Abrufen der Details für Job ${jobId}.`);

        const jobDetails = await response.json();
        return jobDetails;
    } catch (error) {
        console.error("⚠️ Fehler beim Abrufen der Job-Details:", error);
        throw error;
    }
}

// Hilfsfunktion: Jobs auf der Seite anzeigen
function displayJobs(jobs) {
    const jobList = document.getElementById("job-list");
    jobList.innerHTML = "";

    jobs.forEach(job => {
        const jobElement = document.createElement("div");
        jobElement.classList.add("job-item");
        jobElement.innerHTML = `
            <h3>${job.fieldData?.name || "Unbekannter Job"}</h3>
            <p>${job.fieldData?.description || "Keine Beschreibung verfügbar."}</p>
            <p><strong>Bewerbungsdatum:</strong> ${new Date(job.createdOn).toLocaleDateString()}</p>
            <p><strong>Zuletzt veröffentlicht:</strong> ${new Date(job.lastPublished).toLocaleDateString()}</p>
        `;
        jobList.appendChild(jobElement);
    });
}

// Hilfsfunktion: Nachrichten anzeigen
function displayMessage(message) {
    const jobList = document.getElementById("job-list");
    jobList.innerHTML = `<p>${message}</p>`;
    console.warn("⚙️ Info:", message);
}

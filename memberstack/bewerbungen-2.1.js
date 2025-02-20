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
            membersCollectionId: "6448faf9c5a8a15f6cc05526",
            jobsCollectionId: "YOUR_JOBS_COLLECTION_ID_HERE"
        };

        // Mitglieder-Collection abrufen
        const memberData = await fetchCollectionItem(config.membersCollectionId, memberstackId);
        if (!memberData || !memberData.items) throw new Error("Kein passender Member-Eintrag gefunden oder leere Antwort.");

        console.log("✅ Gefundener Member-Eintrag:", memberData);

        const jobIds = memberData.items[0]?.fieldData?.["abgeschlossene-bewerbungen"] || [];
        if (jobIds.length === 0) {
            displayMessage("Keine abgeschlossenen Bewerbungen gefunden.");
            return;
        }

        // Jobs abrufen und filtern
        const appliedJobs = await fetchJobs(config.jobsCollectionId, jobIds);
        console.log("📄 Gefundene Bewerbungen:", appliedJobs);

        // Detaillierte Job-Informationen abrufen
        const detailedJobs = await Promise.all(appliedJobs.map(job => fetchJobDetails(config.jobsCollectionId, job._id)));
        console.log("🔍 Detaillierte Bewerbungen:", detailedJobs);

        // Jobs nach Status aufteilen
        const activeJobs = detailedJobs.filter(job => !job.fieldData?.status || job.fieldData.status === "offen");
        const rejectedJobs = detailedJobs.filter(job => job.fieldData?.status === "abgelehnt");

        displayJobs(activeJobs, "active-job-list");
        displayJobs(rejectedJobs, "rejected-job-list");
    } catch (error) {
        console.error("❌ Fehler im Prozess:", error.message);
        displayMessage(`Fehler: ${error.message}`);
    }
});

// Hilfsfunktion: Collection-Element abrufen
async function fetchCollectionItem(collectionId, memberstackId) {
    try {
        console.log(`📡 Abrufen der Collection ${collectionId}...`);
        const url = `https://bewerbungen.oliver-258.workers.dev/?url=${encodeURIComponent(`https://api.webflow.com/collections/${collectionId}/items?live=true&fields=abgeschlossene-bewerbungen,status`)}`;
        console.log("🌍 Anfrage-URL:", url);

        const response = await fetch(url);

        console.log("🔍 Response-Status:", response.status);
        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Fehler-Details:", errorText);
            throw new Error(`Fehler beim Abrufen der Collection: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("🌐 API-Antwort der Members Collection:", data);
        return data;
    } catch (error) {
        console.error("⚠️ Fehler beim Abrufen der Members Collection:", error);
        throw error;
    }
}

// Hilfsfunktion: Jobs abrufen
async function fetchJobs(collectionId, jobIds) {
    try {
        console.log("📡 Abrufen der Jobs...");
        const url = `https://bewerbungen.oliver-258.workers.dev/?url=${encodeURIComponent(`https://api.webflow.com/collections/${collectionId}/items?live=true&fields=name,description,createdOn,lastPublished,status,deadline`)}`;
        console.log("🌍 Anfrage-URL:", url);

        const response = await fetch(url);
        console.log("🔍 Response-Status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Fehler-Details:", errorText);
            throw new Error(`Fehler beim Abrufen der Jobs Collection: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("🌐 API-Antwort der Jobs Collection:", data);
        return data.items ? data.items.filter(job => jobIds.includes(job._id)) : [];
    } catch (error) {
        console.error("⚠️ Fehler beim Abrufen der Jobs:", error);
        throw error;
    }
}

// Hilfsfunktion: Detaillierte Job-Informationen abrufen
async function fetchJobDetails(collectionId, jobId) {
    try {
        console.log(`🔍 Abrufen der Details für Job ${jobId}...`);
        const url = `https://bewerbungen.oliver-258.workers.dev/?url=${encodeURIComponent(`https://api.webflow.com/v2/collections/${collectionId}/items/${jobId}/live?fields=name,description,createdOn,lastPublished,status,deadline`)}`;
        console.log("🌍 Anfrage-URL:", url);

        const response = await fetch(url);
        console.log("🔍 Response-Status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Fehler-Details:", errorText);
            throw new Error(`Fehler beim Abrufen der Details für Job ${jobId}: ${response.status} - ${errorText}`);
        }

        const jobDetails = await response.json();
        console.log(`📄 Details für Job ${jobId}:`, jobDetails);
        return jobDetails;
    } catch (error) {
        console.error("⚠️ Fehler beim Abrufen der Job-Details:", error);
        throw error;
    }
}

// Hilfsfunktion: Jobs auf der Seite anzeigen
function displayJobs(jobs, containerId) {
    const jobList = document.getElementById(containerId);
    if (!jobList) return;
    jobList.innerHTML = "";

    const fragment = document.createDocumentFragment();

    jobs.forEach(job => {
        const jobElement = document.createElement("div");
        jobElement.classList.add("job-item");

        const deadline = job.fieldData?.deadline ? calculateDeadline(job.fieldData.deadline) : "Keine Deadline gesetzt";

        jobElement.innerHTML = `
            <h3>${job.fieldData?.name || "Unbekannter Job"}</h3>
            <p>${job.fieldData?.description || "Keine Beschreibung verfügbar."}</p>
            <p><strong>Bewerbungsdatum:</strong> ${new Date(job.createdOn).toLocaleDateString()}</p>
            <p><strong>Zuletzt veröffentlicht:</strong> ${new Date(job.lastPublished).toLocaleDateString()}</p>
            <p><strong>Deadline:</strong> ${deadline}</p>
            <p><strong>Status:</strong> ${job.fieldData?.status || "Offen"}</p>
        `;

        fragment.appendChild(jobElement);
    });

    jobList.appendChild(fragment);
}

// Hilfsfunktion: Deadline-Countdown berechnen
function calculateDeadline(deadline) {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;

    if (diff <= 0) return "Bewerbung beendet";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `Job endet in ${days} Tag(en)`;
    } else if (hours > 0) {
        return `Job endet in ${hours} Stunde(n)`;
    } else {
        const minutes = Math.floor(diff / (1000 * 60));
        return `Job endet in ${minutes} Minute(n)`;
    }
}

// Hilfsfunktion: Nachrichten anzeigen
function displayMessage(message) {
    const jobList = document.getElementById("active-job-list");
    jobList.innerHTML = `<p>${message}</p>`;
    console.warn("⚙️ Info:", message);
}

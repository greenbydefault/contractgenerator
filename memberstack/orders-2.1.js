// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url="; // Worker URL für CORS-Anfragen
const JOB_COLLECTION_ID = "6448faf9c5a8a17455c05525"; // Webflow Collection ID für Jobs
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526"; // Webflow Collection ID für Benutzer

let currentWebflowMemberId = null; // 💡 Hier wird die eingeloggte Member-ID aus Memberstack gespeichert

// 🛠️ Hilfsfunktionen

/**
 * Baut die vollständige URL für den Worker, um CORS-Probleme zu umgehen.
 * @param {string} apiUrl - Die ursprüngliche API-URL.
 * @returns {string} Die URL für den Worker.
 */
function buildWorkerUrl(apiUrl) {
    return `${WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

/**
 * Berechnet den Countdown bis zu einem Enddatum und gibt Text und CSS-Klasse zurück.
 * @param {string} endDate - Das Enddatum im ISO-Format.
 * @returns {object} Ein Objekt mit Text und CSS-Klasse für das Tag.
 */
function calculateCountdown(endDate) {
    if (!endDate) return { text: "K.A.", class: "job-tag" }; // Kein Datum vorhanden

    const now = new Date();
    const deadline = new Date(endDate);
    const diff = deadline - now; // Differenz in Millisekunden

    if (diff <= 0) return { text: "Abgelaufen", class: "job-tag is-bg-light-red" }; // Deadline ist vorbei

    const days = Math.floor(diff / (1000 * 60 * 60 * 24)); // Differenz in Tagen

    // Unterschiedliche Klassen basierend auf der verbleibenden Zeit
    if (days > 10) return { text: `${days} Tag(e)`, class: "job-tag" };
    if (days > 4) return { text: `${days} Tag(e)`, class: "job-tag is-bg-light-yellow" };
    return { text: `${days} Tag(e)`, class: "job-tag is-bg-light-red" };
}

/**
 * Ruft ein einzelnes Item aus einer Webflow Collection ab.
 * Die API gibt das Item-Objekt direkt zurück.
 * @param {string} collectionId - Die ID der Webflow Collection.
 * @param {string} itemId - Die ID des Items in der Collection.
 * @returns {Promise<object|null>} Das Item-Objekt (inkl. fieldData) oder null bei einem Fehler.
 */
async function fetchCollectionItem(collectionId, itemId) {
    const apiUrl = `${API_BASE_URL}/${collectionId}/items/${itemId}/live`;
    const workerUrl = buildWorkerUrl(apiUrl);

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API-Fehler beim Abrufen von Item ${itemId} aus Collection ${collectionId}: ${response.status} - ${errorText}`);
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }

        const item = await response.json(); // Das ist das Item-Objekt direkt
        return item;
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen des Collection Items (${collectionId}/${itemId}): ${error.message}`);
        return null;
    }
}

/**
 * Ruft die spezifischen Job-Daten (fieldData) aus der Webflow Collection ab.
 * @param {string} jobId - Die ID des Jobs.
 * @returns {Promise<object>} Die fieldData des Jobs oder ein leeres Objekt bei einem Fehler.
 */
async function fetchJobData(jobId) {
    const jobItem = await fetchCollectionItem(JOB_COLLECTION_ID, jobId);
    // Greift direkt auf fieldData des Job-Items zu
    return jobItem?.fieldData || {};
}

// 🖨️ Jobs rendern

/**
 * Rendert die Job-Liste im angegebenen Container.
 * @param {Array<object>} jobsFieldDataArray - Ein Array von Job fieldData Objekten.
 * @param {string} containerId - Die ID des HTML-Containers, in dem die Jobs gerendert werden sollen.
 */
function renderJobs(jobsFieldDataArray, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ Container mit ID '${containerId}' nicht gefunden.`);
        return;
    }
    container.innerHTML = ""; // Bestehenden Inhalt leeren

    if (jobsFieldDataArray.length === 0) {
        const noJobsMessage = document.createElement("p");
        noJobsMessage.textContent = "Es sieht so aus, als wäre aktuell noch kein Auftrag für dich bestätigt worden.";
        noJobsMessage.classList.add("no-jobs-message"); // Klasse für Styling hinzufügen
        container.appendChild(noJobsMessage);
        return;
    }

    jobsFieldDataArray.forEach(jobData => { // jobData ist hier das fieldData Objekt
        if (!jobData || Object.keys(jobData).length === 0) {
            console.warn("⚠️ Leere Job-Daten (fieldData) übersprungen.");
            return; // Überspringe leere Job-Daten
        }

        // Link-Element für den gesamten Job-Eintrag
        const jobLink = document.createElement("a");
        // 'slug' ist ein Feld innerhalb von fieldData
        jobLink.href = `https://www.creatorjobs.com/creator-job/${jobData.slug}`;
        jobLink.target = "_blank"; // Link in neuem Tab öffnen
        jobLink.style.textDecoration = "none"; // Standard-Unterstreichung entfernen
        jobLink.style.color = "#040e1a"; // Textfarbe setzen

        // Haupt-Div für einen Job-Eintrag
        const jobDiv = document.createElement("div");
        jobDiv.classList.add("db-table-row", "db-table-booked"); // Styling-Klassen

        // Info-Bereich (Bild und Name)
        const jobInfoDiv = document.createElement("div");
        jobInfoDiv.classList.add("db-table-row-item", "justify-left");

        // Bild des Jobs
        const jobImage = document.createElement("img");
        jobImage.classList.add("db-table-img", "is-margin-right-12");
        // 'job-image' ist ein Feld innerhalb von fieldData und hat ggf. eine 'url' Eigenschaft
        jobImage.src = jobData["job-image"]?.url || "https://via.placeholder.com/60x60?text=Job";
        jobImage.alt = jobData["name"] || "Job Bild"; // 'name' ist ein Feld innerhalb von fieldData
        jobImage.style.width = "60px"; // Feste Breite für Konsistenz
        jobImage.style.height = "60px"; // Feste Höhe für Konsistenz
        jobImage.style.objectFit = "cover"; // Bild zuschneiden, um den Bereich zu füllen
        jobImage.onerror = () => { jobImage.src = "https://via.placeholder.com/60x60?text=Error"; }; // Fallback bei Ladefehler
        jobInfoDiv.appendChild(jobImage);

        // Name des Jobs
        const jobName = document.createElement("span");
        jobName.classList.add("truncate"); // Klasse für Textabschneidung (falls benötigt)
        jobName.textContent = jobData["name"] || "Unbekannter Job";
        jobInfoDiv.appendChild(jobName);

        jobDiv.appendChild(jobInfoDiv);

        // Markenname
        const brandNameDiv = document.createElement("div");
        brandNameDiv.classList.add("db-table-row-item");
        brandNameDiv.textContent = jobData["brand-name"] || "Keine Marke";
        jobDiv.appendChild(brandNameDiv);

        // Budget
        const jobBudget = document.createElement("div");
        jobBudget.classList.add("db-table-row-item");
        jobBudget.textContent = jobData["job-payment"] ? `${jobData["job-payment"]} €` : "K.A.";
        jobDiv.appendChild(jobBudget);

        // Industrie-Kategorie
        const jobCategory = document.createElement("div");
        jobCategory.classList.add("db-table-row-item");
        jobCategory.textContent = jobData["industrie-kategorie"] || "K.A.";
        jobDiv.appendChild(jobCategory);

        // Deadlines mit farbigen Tags
        const contentDeadline = calculateCountdown(jobData["fertigstellung-content"]);
        const contentDeadlineDiv = document.createElement("div");
        contentDeadlineDiv.classList.add("db-table-row-item");
        const contentTag = document.createElement("div");
        contentTag.classList.add(...contentDeadline.class.split(" "));
        const contentText = document.createElement("span");
        contentText.textContent = contentDeadline.text;
        contentTag.appendChild(contentText);
        contentDeadlineDiv.appendChild(contentTag);
        jobDiv.appendChild(contentDeadlineDiv);

        const scriptDeadline = calculateCountdown(jobData["job-scriptdeadline"]);
        const scriptDeadlineDiv = document.createElement("div");
        scriptDeadlineDiv.classList.add("db-table-row-item");
        const scriptTag = document.createElement("div");
        scriptTag.classList.add(...scriptDeadline.class.split(" "));
        const scriptText = document.createElement("span");
        scriptText.textContent = scriptDeadline.text;
        scriptTag.appendChild(scriptText);
        scriptDeadlineDiv.appendChild(scriptTag);
        jobDiv.appendChild(scriptDeadlineDiv);

        jobLink.appendChild(jobDiv);
        container.appendChild(jobLink);
    });
}

// 🌟 Hauptfunktion
async function displayUserJobs() {
    const containerId = "booked-jobs-list"; // ID des Containers für gebuchte Jobs

    try {
        // Auf Memberstack warten, falls es noch nicht geladen ist
        if (typeof window.$memberstackDom === 'undefined') {
            console.log("Memberstack noch nicht geladen, warte...");
            await new Promise(resolve => {
                const interval = setInterval(() => {
                    if (typeof window.$memberstackDom !== 'undefined') {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            });
        }
        
        const member = await window.$memberstackDom.getCurrentMember();
        currentWebflowMemberId = member?.data?.customFields?.['webflow-member-id'];

        if (!currentWebflowMemberId) {
            console.error("❌ Kein 'webflow-member-id' im Memberstack-Profil gefunden. Stelle sicher, dass das Feld existiert und gefüllt ist.");
            const container = document.getElementById(containerId);
            if (container) {
                 container.innerHTML = "<p class='error-message'>Benutzerdaten konnten nicht geladen werden. Bitte überprüfe dein Profil.</p>";
            }
            return;
        }

        console.log(`✅ Webflow Member ID gefunden: ${currentWebflowMemberId}`);

        // userItem ist das gesamte Item-Objekt von Webflow
        const userItem = await fetchCollectionItem(USER_COLLECTION_ID, currentWebflowMemberId);
        
        // KORRIGIERTE PRÜFUNG: Überprüfe, ob userItem und userItem.fieldData existieren
        if (!userItem || !userItem.fieldData) {
            console.error(`❌ Benutzerdaten (Item oder fieldData) für ID ${currentWebflowMemberId} nicht gefunden oder leer.`);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = "<p class='error-message'>Benutzerdaten nicht gefunden oder unvollständig. Das Item existiert möglicherweise nicht oder hat keine Felder.</p>";
            }
            return;
        }
        
        // KORRIGIERTER ZUGRIFF: userData ist jetzt direkt userItem.fieldData
        const userData = userItem.fieldData; 
        const bookedJobIds = userData["booked-jobs"] || []; // Array der gebuchten Job-IDs aus fieldData

        console.log(`📚 Gefundene gebuchte Job-IDs: ${bookedJobIds.join(', ')}`);

        if (bookedJobIds.length === 0) {
            renderJobs([], containerId); // Leeres Array rendern, um "Keine Jobs"-Nachricht anzuzeigen
            return;
        }

        // Alle Job-Daten (fieldData) parallel abrufen
        const bookedJobsFieldDataPromises = bookedJobIds.map(jobId => fetchJobData(jobId)); // fetchJobData gibt fieldData zurück
        const bookedJobsFieldDataResults = await Promise.all(bookedJobsFieldDataPromises);
        
        // Filtere alle null oder leeren fieldData-Objekte heraus
        const validBookedJobsFieldData = bookedJobsFieldDataResults.filter(fieldData => fieldData && Object.keys(fieldData).length > 0);

        console.log(`📊 ${validBookedJobsFieldData.length} valide Job-fieldData zum Rendern.`);

        renderJobs(validBookedJobsFieldData, containerId); // Übergibt Array von fieldData-Objekten

    } catch (error) {
        console.error("❌ Schwerwiegender Fehler beim Laden der Jobs:", error);
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<p class='error-message'>Ein Fehler ist aufgetreten: ${error.message}. Bitte versuche es später erneut.</p>`;
        }
    }
}

// Start der Anwendung, sobald das DOM vollständig geladen ist
window.addEventListener("DOMContentLoaded", displayUserJobs);

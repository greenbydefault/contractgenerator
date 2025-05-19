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
 * @param {string} collectionId - Die ID der Webflow Collection.
 * @param {string} itemId - Die ID des Items in der Collection.
 * @returns {Promise<object|null>} Die Daten des Collection Items oder null bei einem Fehler.
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

        const item = await response.json();
        return item; // Gibt das gesamte Item-Objekt zurück (inkl. fieldData etc.)
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen des Collection Items (${collectionId}/${itemId}): ${error.message}`);
        return null;
    }
}

/**
 * Ruft die spezifischen Job-Daten aus der Webflow Collection ab.
 * @param {string} jobId - Die ID des Jobs.
 * @returns {Promise<object>} Die fieldData des Jobs oder ein leeres Objekt bei einem Fehler.
 */
async function fetchJobData(jobId) {
    const jobItem = await fetchCollectionItem(JOB_COLLECTION_ID, jobId);
    return jobItem?.items?.[0]?.fieldData || {}; // Sicherstellen, dass fieldData existiert und zurückgegeben wird
}

// 🖨️ Jobs rendern

/**
 * Rendert die Job-Liste im angegebenen Container.
 * @param {Array<object>} jobs - Ein Array von Job-Daten Objekten.
 * @param {string} containerId - Die ID des HTML-Containers, in dem die Jobs gerendert werden sollen.
 */
function renderJobs(jobs, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ Container mit ID '${containerId}' nicht gefunden.`);
        return;
    }
    container.innerHTML = ""; // Bestehenden Inhalt leeren

    if (jobs.length === 0) {
        const noJobsMessage = document.createElement("p");
        noJobsMessage.textContent = "Es sieht so aus, als wäre aktuell noch kein Auftrag für dich bestätigt worden.";
        noJobsMessage.classList.add("no-jobs-message"); // Klasse für Styling hinzufügen
        container.appendChild(noJobsMessage);
        return;
    }

    jobs.forEach(jobData => {
        if (!jobData || Object.keys(jobData).length === 0) {
            console.warn("⚠️ Leere Job-Daten übersprungen.");
            return; // Überspringe leere Job-Daten
        }

        // Link-Element für den gesamten Job-Eintrag
        const jobLink = document.createElement("a");
        jobLink.href = `https://www.creatorjobs.com/creator-job/${jobData.slug}`; // Dynamischer Link basierend auf dem Slug
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
        jobImage.src = jobData["job-image"]?.url || "https://via.placeholder.com/60x60?text=Job"; // Fallback-Bild und Zugriff auf URL
        jobImage.alt = jobData["name"] || "Job Bild";
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
        jobBudget.textContent = jobData["job-payment"] ? `${jobData["job-payment"]} €` : "K.A."; // Währungssymbol hinzufügen
        jobDiv.appendChild(jobBudget);

        // Industrie-Kategorie
        const jobCategory = document.createElement("div");
        jobCategory.classList.add("db-table-row-item");
        jobCategory.textContent = jobData["industrie-kategorie"] || "K.A.";
        jobDiv.appendChild(jobCategory);

        // Deadlines mit farbigen Tags
        // Content Deadline
        const contentDeadline = calculateCountdown(jobData["fertigstellung-content"]);
        const contentDeadlineDiv = document.createElement("div");
        contentDeadlineDiv.classList.add("db-table-row-item");
        const contentTag = document.createElement("div");
        contentTag.classList.add(...contentDeadline.class.split(" ")); // Klassen für das Tag setzen
        const contentText = document.createElement("span");
        // contentText.classList.add("db-job-tag-txt"); // Diese Zeile wurde entfernt
        contentText.textContent = contentDeadline.text;
        contentTag.appendChild(contentText);
        contentDeadlineDiv.appendChild(contentTag);
        jobDiv.appendChild(contentDeadlineDiv);

        // Script Deadline
        const scriptDeadline = calculateCountdown(jobData["job-scriptdeadline"]);
        const scriptDeadlineDiv = document.createElement("div");
        scriptDeadlineDiv.classList.add("db-table-row-item");
        const scriptTag = document.createElement("div");
        scriptTag.classList.add(...scriptDeadline.class.split(" ")); // Klassen für das Tag setzen
        const scriptText = document.createElement("span");
        // scriptText.classList.add("db-job-tag-txt"); // Diese Zeile wurde entfernt
        scriptText.textContent = scriptDeadline.text;
        scriptTag.appendChild(scriptText);
        scriptDeadlineDiv.appendChild(scriptTag);
        jobDiv.appendChild(scriptDeadlineDiv);

        jobLink.appendChild(jobDiv); // Job-Div dem Link hinzufügen
        container.appendChild(jobLink); // Job-Link dem Container hinzufügen
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
            document.getElementById(containerId).innerHTML = "<p class='error-message'>Benutzerdaten konnten nicht geladen werden. Bitte überprüfe dein Profil.</p>";
            return;
        }

        console.log(`✅ Webflow Member ID gefunden: ${currentWebflowMemberId}`);

        const userItem = await fetchCollectionItem(USER_COLLECTION_ID, currentWebflowMemberId);
        
        if (!userItem || !userItem.items || userItem.items.length === 0) {
            console.error(`❌ Benutzerdaten für ID ${currentWebflowMemberId} nicht gefunden oder leer.`);
            document.getElementById(containerId).innerHTML = "<p class='error-message'>Benutzerdaten nicht gefunden.</p>";
            return;
        }
        
        const userData = userItem.items[0].fieldData; // Direkter Zugriff auf fieldData
        const bookedJobIds = userData?.["booked-jobs"] || []; // Array der gebuchten Job-IDs

        console.log(`📚 Gefundene gebuchte Job-IDs: ${bookedJobIds.join(', ')}`);

        if (bookedJobIds.length === 0) {
            renderJobs([], containerId); // Leeres Array rendern, um "Keine Jobs"-Nachricht anzuzeigen
            return;
        }

        // Alle Job-Daten parallel abrufen
        const bookedJobsPromises = bookedJobIds.map(jobId => fetchJobData(jobId));
        const bookedJobsResults = await Promise.all(bookedJobsPromises);
        
        // Filtere alle null oder leeren Ergebnisse heraus, die von fetchJobData kommen könnten
        const validBookedJobs = bookedJobsResults.filter(job => job && Object.keys(job).length > 0);

        console.log(`📊 ${validBookedJobs.length} valide Jobs zum Rendern.`);

        renderJobs(validBookedJobs, containerId);

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

// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url="; // Dein Worker-URL
const JOB_COLLECTION_ID = "6448faf9c5a8a17455c05525"; // Deine Job Collection ID
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526"; // Deine User Collection ID
const JOBS_PER_PAGE = 15;

let currentPage = 1;
let allJobResults = []; // Speichert alle jemals geladenen Jobergebnisse
let currentWebflowMemberId = null; // Hier wird die eingeloggte Member-ID gespeichert

// 🛠️ Hilfsfunktionen
function buildWorkerUrl(apiUrl) {
    return `${WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

async function fetchCollectionItem(collectionId, memberId) {
    const apiUrl = `${API_BASE_URL}/${collectionId}/items/${memberId}/live`;
    const workerUrl = buildWorkerUrl(apiUrl);

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen der Collection: ${error.message}`);
        return null;
    }
}

async function fetchJobData(jobId) {
    const apiUrl = `${API_BASE_URL}/${JOB_COLLECTION_ID}/items/${jobId}/live`;
    const workerUrl = buildWorkerUrl(apiUrl);

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }
        const jobData = await response.json();
        return jobData?.fieldData || {};
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen der Job-Daten: ${error.message}`);
        return {};
    }
}

// ⏳ Countdown-Berechnung
function calculateDeadlineCountdown(endDate) {
    const now = new Date();
    const deadline = new Date(endDate);
    const diff = deadline - now;

    if (diff <= 0) return "Abgelaufen";

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Endet in ${days} Tag(en)`;
    if (hours > 0) return `Endet in ${hours} Stunde(n)`;
    return `Endet in ${minutes} Minute(n)`;
}

// 🖨️ Jobs rendern
function renderJobs(jobsToProcess, webflowMemberId) {
    const appContainer = document.getElementById("application-list");
    if (!appContainer) {
        console.error("❌ Element 'application-list' nicht gefunden.");
        return;
    }
    appContainer.innerHTML = ""; // Leert den Container vor dem Neuzeichnen

    console.log(`🟢 Eingeloggte Webflow Member-ID für Rendering: ${webflowMemberId}`);

    // Filterlogik basierend auf Checkboxen
    const showActive = document.getElementById("job-status-active-filter")?.checked;
    const showClosed = document.getElementById("job-status-closed-filter")?.checked;

    let filteredJobs = jobsToProcess.filter(({ jobData }) => {
        if (!jobData || !jobData["job-date-end"]) return false; // Jobs ohne Enddatum überspringen oder als ungültig behandeln

        const endDate = new Date(jobData["job-date-end"]);
        const now = new Date();
        const isJobActive = endDate >= now;

        // Wenn beide Checkboxen nicht ausgewählt sind oder beide ausgewählt sind, zeige alle Jobs
        if ((!showActive && !showClosed) || (showActive && showClosed)) {
            return true;
        }
        // Zeige aktive Jobs, wenn "Aktiv" ausgewählt ist
        if (showActive && isJobActive) {
            return true;
        }
        // Zeige beendete Jobs, wenn "Beendet" ausgewählt ist
        if (showClosed && !isJobActive) {
            return true;
        }
        return false;
    });
    
    console.log(`🔎 Gefilterte Jobs (${filteredJobs.length}):`, filteredJobs);


    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    const jobsToShowOnPage = filteredJobs.slice(startIndex, endIndex); // Korrigiert: slice von 0 auf startIndex

    if (jobsToShowOnPage.length === 0 && currentPage === 1) {
        appContainer.innerHTML = "<p>ℹ️ Keine Jobs entsprechen den aktuellen Filterkriterien.</p>";
    }

    jobsToShowOnPage.forEach(({ jobData }, index) => {
        if (!jobData) return;

        const jobLink = document.createElement("a");
        jobLink.href = `https://www.creatorjobs.com/creator-job/${jobData.slug}`; // Stelle sicher, dass 'slug' vorhanden ist
        jobLink.target = "_blank";
        jobLink.style.textDecoration = "none";
        jobLink.classList.add("job-listing-link"); // Klasse für einfacheres Styling

        const jobDiv = document.createElement("div");
        jobDiv.classList.add("db-table-row", "db-table-bewerbungen");
        // Die Klasse 'justify-left' wird hier nicht mehr speziell für das erste Element hinzugefügt,
        // da dies eher eine Styling-Frage für alle Zeilen sein sollte.
        // Falls doch benötigt: if (index === 0 && startIndex === 0) jobDiv.classList.add("justify-left");


        const jobInfoDiv = document.createElement("div");
        jobInfoDiv.classList.add("db-table-row-item", "justify-left", "job-info-container"); // Klasse für Layout

        // Bild
        const jobImage = document.createElement("img");
        jobImage.classList.add("db-table-img", "is-margin-right-12");
        jobImage.src = jobData["job-image"]?.url || jobData["job-image"] || "https://via.placeholder.com/80x80?text=Job"; // Fallback für Bild-URL
        jobImage.alt = jobData["name"] || "Job Bild";
        jobImage.style.width = "80px"; // Feste Breite für Konsistenz
        jobImage.style.height = "80px"; // Feste Höhe für Konsistenz
        jobImage.style.objectFit = "cover"; // Stellt sicher, dass das Bild den Bereich füllt
        jobInfoDiv.appendChild(jobImage);

        // Name
        const jobName = document.createElement("span");
        jobName.classList.add("truncate", "job-title"); // Klasse für Styling
        jobName.textContent = jobData["name"] || "Unbekannter Job";
        jobInfoDiv.appendChild(jobName);

        jobDiv.appendChild(jobInfoDiv);

        // Weitere Felder
        const fields = [
            { key: "job-payment", label: "Bezahlung" },
            { key: "job-date-end", label: "Bewerbungsfrist" },
            { key: "fertigstellung-content", label: "Contentdeadline" },
            { key: "job-status", label: "Job Status" }, // Wird dynamisch basierend auf job-date-end bestimmt
            { key: "application-status", label: "Bewerbungsstatus" }
        ];

        fields.forEach(field => {
            const value = jobData[field.key]; // Zugriff auf den Wert, Prüfung auf 'Nicht verfügbar' später
            const fieldDiv = document.createElement("div");
            fieldDiv.classList.add("db-table-row-item", `item-${field.key}`); // Eindeutige Klasse pro Feld

            const fieldText = document.createElement("span");
            fieldText.classList.add("db-job-tag-txt");

            if (field.key === "job-payment") {
                fieldText.textContent = value ? `${value} €` : "N/A";
            } else if (field.key === "job-date-end") {
                fieldText.textContent = value ? calculateDeadlineCountdown(value) : "N/A";
            } else if (field.key === "fertigstellung-content" && value) {
                const date = new Date(value);
                fieldText.textContent = !isNaN(date.getTime()) ? `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}` : "N/A";
            } else if (field.key === "job-status") {
                const endDateJob = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
                const now = new Date();
                const statusDiv = document.createElement("div");
                statusDiv.classList.add("job-tag"); // Allgemeine Klasse für Tags
                const statusTextInner = document.createElement("span");
                statusTextInner.classList.add("db-job-tag-txt");

                if (endDateJob && endDateJob < now) {
                    statusDiv.classList.add("is-bg-light-red");
                    statusTextInner.textContent = "Beendet";
                } else if (endDateJob) {
                    statusDiv.classList.add("is-bg-light-green");
                    statusTextInner.textContent = "Aktiv";
                } else {
                    statusDiv.classList.add("is-bg-light-grey"); // Fallback, falls kein Enddatum
                    statusTextInner.textContent = "Unbekannt";
                }
                statusDiv.appendChild(statusTextInner);
                fieldDiv.appendChild(statusDiv); // Fügt das Status-Tag-Div hinzu
                // fieldText wird hier nicht direkt verwendet, da der Status komplexer ist
            } else if (field.key === "application-status") {
                const bookedCreators = jobData["booked-creators"] || [];
                const rejectedCreators = jobData["rejected-creators"] || [];
                const endDateApp = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
                const now = new Date();
                const statusDiv = document.createElement("div");
                statusDiv.classList.add("job-tag");
                const statusTextInner = document.createElement("span");
                statusTextInner.classList.add("db-job-tag-txt");

                // console.log(`🔍 Bewerbungsstatus-Check: MemberID: ${webflowMemberId}, Job: ${jobData.name}, Booked: ${JSON.stringify(bookedCreators)}`);

                if (webflowMemberId && bookedCreators.includes(webflowMemberId)) {
                    statusDiv.classList.add("is-bg-light-green");
                    statusTextInner.textContent = "Angenommen";
                } else if (webflowMemberId && (rejectedCreators.includes(webflowMemberId) || (endDateApp && endDateApp < now && !bookedCreators.includes(webflowMemberId)))) {
                    // Wenn abgelehnt ODER die Frist abgelaufen ist UND man nicht angenommen wurde
                    statusDiv.classList.add("is-bg-light-red");
                    statusTextInner.textContent = "Abgelehnt";
                } else {
                    statusDiv.classList.add("is-bg-light-blue");
                    statusTextInner.textContent = "Ausstehend";
                }
                statusDiv.appendChild(statusTextInner);
                fieldDiv.appendChild(statusDiv);
            } else {
                fieldText.textContent = value || "Nicht verfügbar";
            }

            // Nur fieldText hinzufügen, wenn es nicht schon durch eine komplexere Logik (wie Status-Tags) gehandhabt wurde
            if (field.key !== "job-status" && field.key !== "application-status") {
                fieldDiv.appendChild(fieldText);
            }
            jobDiv.appendChild(fieldDiv);
        });
        jobLink.appendChild(jobDiv);
        appContainer.appendChild(jobLink);
    });

    // Load More Button
    const loadMoreContainer = document.getElementById("load-more-container");
    if (!loadMoreContainer) {
        console.error("❌ Element 'load-more-container' nicht gefunden.");
        return;
    }
    loadMoreContainer.innerHTML = ""; // Leert den Button-Container

    if (endIndex < filteredJobs.length) { // Prüft gegen die Länge der gefilterten Jobs
        const loadMoreButton = document.createElement("button");
        loadMoreButton.textContent = "Mehr laden";
        loadMoreButton.classList.add("load-more-btn", "button", "is-primary"); // Zusätzliche Styling-Klassen
        loadMoreButton.addEventListener("click", () => {
            currentPage++;
            renderJobs(allJobResults, webflowMemberId); // Ruft renderJobs erneut auf, Filterung geschieht intern
        });
        loadMoreContainer.appendChild(loadMoreButton);
    }
}


// Initialisierungsfunktion
async function initializeUserApplications() {
    const appContainer = document.getElementById("application-list");
    if (!appContainer) {
        console.error("FEHLER: App-Container 'application-list' nicht im DOM gefunden.");
        return;
    }
    appContainer.innerHTML = "<p>Lade Bewerbungen...</p>"; // Ladeindikator

    try {
        // Überprüfe, ob MemberStack und die Funktion getCurrentMember verfügbar sind
        if (window.$memberstackDom && typeof window.$memberstackDom.getCurrentMember === 'function') {
            const member = await window.$memberstackDom.getCurrentMember();
            currentWebflowMemberId = member?.data?.customFields?.['webflow-member-id'];

            if (!currentWebflowMemberId) {
                console.warn("⚠️ Kein 'webflow-member-id' im Memberstack-Profil gefunden. Einige Funktionen könnten eingeschränkt sein.");
                // Optional: Fehlermeldung im UI anzeigen
                // appContainer.innerHTML = "<p>❌ Fehler: Webflow Member-ID nicht gefunden. Bitte Profil überprüfen.</p>";
                // return; // Frühzeitiger Ausstieg, wenn die ID zwingend erforderlich ist
            } else {
                console.log(`👤 Aktuelle eingeloggte Webflow Member-ID: ${currentWebflowMemberId}`);
            }
        } else {
            console.warn("⚠️ MemberStack (window.$memberstackDom.getCurrentMember) ist nicht verfügbar. Fahre ohne Benutzerdaten fort.");
            // Optional: Fallback-Verhalten oder UI-Anzeige
            // appContainer.innerHTML = "<p>ℹ️ Benutzer nicht angemeldet. Anzeige allgemeiner Jobdaten.</p>";
        }


        // Hole User-spezifische Daten nur, wenn eine Member-ID vorhanden ist
        let applications = [];
        if (currentWebflowMemberId) {
            const userData = await fetchCollectionItem(USER_COLLECTION_ID, currentWebflowMemberId);
            applications = userData?.fieldData?.["abgeschlossene-bewerbungen"] || []; // Stelle sicher, dass der Feldname korrekt ist
        } else {
            // Fallback: Wenn keine Member-ID vorhanden ist, könnten z.B. alle Jobs geladen werden
            // Für dieses Szenario ist es aktuell so, dass keine "abgeschlossenen-bewerbungen" vorhanden sind.
            // Man könnte hier eine andere Logik implementieren, z.B. alle öffentlichen Jobs laden.
            console.log("ℹ️ Keine Member-ID, daher werden keine spezifischen 'abgeschlossene-bewerbungen' geladen.");
        }


        if (applications.length > 0) {
            const jobPromises = applications.map(async (appId) => {
                const jobData = await fetchJobData(appId);
                return { appId, jobData }; // Enthält die ID der Bewerbung und die Jobdaten
            });

            allJobResults = await Promise.all(jobPromises);
            // Entferne Jobs, für die keine Daten geladen werden konnten
            allJobResults = allJobResults.filter(job => job.jobData && Object.keys(job.jobData).length > 0);
            
            console.log(`📊 ${allJobResults.length} Jobs initial geladen und verarbeitet.`);
            currentPage = 1; // Setze die Seite zurück, bevor zum ersten Mal gerendert wird
            renderJobs(allJobResults, currentWebflowMemberId);
        } else {
            appContainer.innerHTML = "<p>Keine abgeschlossenen Bewerbungen gefunden oder keine Jobs zum Anzeigen.</p>";
            // Leere auch den "Mehr laden"-Container, falls er noch Elemente von einem vorherigen Ladevorgang enthält
            const loadMoreContainer = document.getElementById("load-more-container");
            if (loadMoreContainer) loadMoreContainer.innerHTML = "";
        }
    } catch (error) {
        console.error("❌ Schwerwiegender Fehler beim Laden der Bewerbungen:", error);
        appContainer.innerHTML = `<p>❌ Es ist ein Fehler aufgetreten: ${error.message}. Bitte versuchen Sie es später erneut.</p>`;
    }
}

// Event Listener für Filter-Checkboxen
function setupFilterListeners() {
    const activeFilterCheckbox = document.getElementById("job-status-active-filter");
    const closedFilterCheckbox = document.getElementById("job-status-closed-filter");

    const handleFilterChange = () => {
        currentPage = 1; // Setze die aktuelle Seite zurück, da sich die Datenmenge ändert
        renderJobs(allJobResults, currentWebflowMemberId);
    };

    if (activeFilterCheckbox) {
        activeFilterCheckbox.addEventListener("change", handleFilterChange);
    } else {
        console.warn("⚠️ Checkbox 'job-status-active-filter' nicht gefunden.");
    }

    if (closedFilterCheckbox) {
        closedFilterCheckbox.addEventListener("change", handleFilterChange);
    } else {
        console.warn("⚠️ Checkbox 'job-status-closed-filter' nicht gefunden.");
    }
}


// Start der Anwendung, sobald das DOM vollständig geladen ist
window.addEventListener("DOMContentLoaded", () => {
    initializeUserApplications();
    setupFilterListeners(); // Richte die Filter-Listener ein
});

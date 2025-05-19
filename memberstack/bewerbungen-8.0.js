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

// Funktion zur Bestimmung des Bewerbungsstatus für die Filterung
function getApplicationStatusForFilter(jobData, memberId) {
    if (!jobData) return "Ausstehend"; // Fallback

    const bookedCreators = jobData["booked-creators"] || [];
    const rejectedCreators = jobData["rejected-creators"] || [];
    const endDateApp = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
    const now = new Date();

    if (memberId && bookedCreators.includes(memberId)) {
        return "Angenommen";
    } else if (memberId && (rejectedCreators.includes(memberId) || (endDateApp && endDateApp < now && !bookedCreators.includes(memberId)))) {
        return "Abgelehnt";
    }
    return "Ausstehend";
}


// 🖨️ Jobs rendern
function renderJobs(jobsToProcess, webflowMemberId) {
    const appContainer = document.getElementById("application-list");
    if (!appContainer) {
        console.error("❌ Element 'application-list' nicht gefunden.");
        return;
    }
    appContainer.innerHTML = ""; // Leert den Container vor dem Neuzeichnen

    // console.log(`🟢 Eingeloggte Webflow Member-ID für Rendering: ${webflowMemberId}`);

    // Filterlogik basierend auf Job-Status Checkboxen
    const showJobActiveFilter = document.getElementById("job-status-active-filter")?.checked;
    const showJobClosedFilter = document.getElementById("job-status-closed-filter")?.checked;

    // Filterlogik basierend auf Bewerbungs-Status Checkboxen
    const showAppPendingFilter = document.getElementById("application-status-pending-filter")?.checked;
    const showAppAcceptedFilter = document.getElementById("application-status-accepted-filter")?.checked;
    const showAppRejectedFilter = document.getElementById("application-status-rejected-filter")?.checked;

    let filteredJobs = jobsToProcess.filter(({ jobData }) => {
        if (!jobData) return false;

        // Job-Status Filterung
        const jobEndDate = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
        const now = new Date();
        const isJobCurrentlyActive = jobEndDate && jobEndDate >= now;
        let jobStatusPasses = false;
        if ((!showJobActiveFilter && !showJobClosedFilter) || (showJobActiveFilter && showJobClosedFilter)) {
            jobStatusPasses = true; // Zeige alle, wenn keine oder beide Job-Status-Filter aktiv sind
        } else if (showJobActiveFilter && isJobCurrentlyActive) {
            jobStatusPasses = true;
        } else if (showJobClosedFilter && !isJobCurrentlyActive) {
            jobStatusPasses = true;
        }
        if (!jobEndDate && (showJobActiveFilter || showJobClosedFilter)) { // Wenn kein Enddatum, aber Filter aktiv
             if (showJobActiveFilter && !showJobClosedFilter) jobStatusPasses = false; // Sollte nicht als aktiv gelten
             else if (showJobClosedFilter && !showJobActiveFilter) jobStatusPasses = true; // Könnte als "beendet/unbekannt" gelten
        }


        // Bewerbungs-Status Filterung
        const currentApplicationStatus = getApplicationStatusForFilter(jobData, webflowMemberId);
        let applicationStatusPasses = false;
        const noAppStatusFiltersChecked = !showAppPendingFilter && !showAppAcceptedFilter && !showAppRejectedFilter;

        if (noAppStatusFiltersChecked) {
            applicationStatusPasses = true; // Zeige alle, wenn keine Bewerbungs-Status-Filter aktiv sind
        } else {
            if (showAppPendingFilter && currentApplicationStatus === "Ausstehend") {
                applicationStatusPasses = true;
            }
            if (showAppAcceptedFilter && currentApplicationStatus === "Angenommen") {
                applicationStatusPasses = true;
            }
            if (showAppRejectedFilter && currentApplicationStatus === "Abgelehnt") {
                applicationStatusPasses = true;
            }
        }
        
        return jobStatusPasses && applicationStatusPasses;
    });
    
    console.log(`🔎 Gefilterte Jobs (${filteredJobs.length}):`, filteredJobs);


    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    const jobsToShowOnPage = filteredJobs.slice(startIndex, endIndex);

    if (jobsToShowOnPage.length === 0 && currentPage === 1) {
        appContainer.innerHTML = "<p>ℹ️ Keine Jobs entsprechen den aktuellen Filterkriterien.</p>";
    }

    jobsToShowOnPage.forEach(({ jobData }) => { // Index wird hier nicht direkt benötigt
        if (!jobData) return;

        const jobLink = document.createElement("a");
        jobLink.href = `https://www.creatorjobs.com/creator-job/${jobData.slug || ''}`;
        jobLink.target = "_blank";
        jobLink.style.textDecoration = "none";
        jobLink.classList.add("job-listing-link");

        const jobDiv = document.createElement("div");
        jobDiv.classList.add("db-table-row", "db-table-bewerbungen");

        const jobInfoDiv = document.createElement("div");
        jobInfoDiv.classList.add("db-table-row-item", "justify-left", "job-info-container");

        // Bild (Styling entfernt)
        const jobImage = document.createElement("img");
        jobImage.classList.add("db-table-img", "is-margin-right-12");
        jobImage.src = jobData["job-image"]?.url || jobData["job-image"] || "https://via.placeholder.com/80x80?text=Job";
        jobImage.alt = jobData["name"] || "Job Bild";
        // jobImage.style.width = "80px"; // Entfernt
        // jobImage.style.height = "80px"; // Entfernt
        // jobImage.style.objectFit = "cover"; // Entfernt
        jobInfoDiv.appendChild(jobImage);

        // Name
        const jobName = document.createElement("span");
        jobName.classList.add("truncate", "job-title");
        jobName.textContent = jobData["name"] || "Unbekannter Job";
        jobInfoDiv.appendChild(jobName);

        jobDiv.appendChild(jobInfoDiv);

        // Weitere Felder
        const fields = [
            { key: "job-payment", label: "Bezahlung" },
            { key: "job-date-end", label: "Bewerbungsfrist" },
            { key: "fertigstellung-content", label: "Contentdeadline" },
            { key: "job-status", label: "Job Status" },
            { key: "application-status", label: "Bewerbungsstatus" }
        ];

        fields.forEach(field => {
            const value = jobData[field.key];
            const fieldDiv = document.createElement("div");
            fieldDiv.classList.add("db-table-row-item", `item-${field.key}`);

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
                statusDiv.classList.add("job-tag");
                const statusTextInner = document.createElement("span");
                statusTextInner.classList.add("db-job-tag-txt");

                if (endDateJob && endDateJob < now) {
                    statusDiv.classList.add("is-bg-light-red");
                    statusTextInner.textContent = "Beendet";
                } else if (endDateJob) {
                    statusDiv.classList.add("is-bg-light-green");
                    statusTextInner.textContent = "Aktiv";
                } else {
                    statusDiv.classList.add("is-bg-light-grey");
                    statusTextInner.textContent = "Unbekannt";
                }
                statusDiv.appendChild(statusTextInner);
                fieldDiv.appendChild(statusDiv);
            } else if (field.key === "application-status") {
                const statusDiv = document.createElement("div");
                statusDiv.classList.add("job-tag");
                const statusTextInner = document.createElement("span");
                statusTextInner.classList.add("db-job-tag-txt");

                const appStatus = getApplicationStatusForFilter(jobData, webflowMemberId);

                if (appStatus === "Angenommen") {
                    statusDiv.classList.add("is-bg-light-green");
                    statusTextInner.textContent = "Angenommen";
                } else if (appStatus === "Abgelehnt") {
                    statusDiv.classList.add("is-bg-light-red");
                    statusTextInner.textContent = "Abgelehnt";
                } else { // Ausstehend
                    statusDiv.classList.add("is-bg-light-blue");
                    statusTextInner.textContent = "Ausstehend";
                }
                statusDiv.appendChild(statusTextInner);
                fieldDiv.appendChild(statusDiv);
            } else {
                fieldText.textContent = value || "Nicht verfügbar";
            }

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
    loadMoreContainer.innerHTML = "";

    if (endIndex < filteredJobs.length) {
        const loadMoreButton = document.createElement("button");
        loadMoreButton.textContent = "Mehr laden";
        loadMoreButton.classList.add("load-more-btn", "button", "is-primary");
        loadMoreButton.addEventListener("click", () => {
            currentPage++;
            renderJobs(allJobResults, webflowMemberId);
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
    appContainer.innerHTML = "<p>Lade Bewerbungen...</p>";

    try {
        if (window.$memberstackDom && typeof window.$memberstackDom.getCurrentMember === 'function') {
            const member = await window.$memberstackDom.getCurrentMember();
            currentWebflowMemberId = member?.data?.customFields?.['webflow-member-id'];

            if (!currentWebflowMemberId) {
                console.warn("⚠️ Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
            } else {
                console.log(`👤 Aktuelle eingeloggte Webflow Member-ID: ${currentWebflowMemberId}`);
            }
        } else {
            console.warn("⚠️ MemberStack (window.$memberstackDom.getCurrentMember) ist nicht verfügbar.");
        }

        let applications = [];
        if (currentWebflowMemberId) {
            const userData = await fetchCollectionItem(USER_COLLECTION_ID, currentWebflowMemberId);
            applications = userData?.fieldData?.["abgeschlossene-bewerbungen"] || [];
        } else {
            console.log("ℹ️ Keine Member-ID, daher werden keine spezifischen 'abgeschlossene-bewerbungen' geladen.");
        }

        if (applications.length > 0) {
            const jobPromises = applications.map(async (appId) => {
                const jobData = await fetchJobData(appId);
                return { appId, jobData };
            });

            allJobResults = await Promise.all(jobPromises);
            allJobResults = allJobResults.filter(job => job.jobData && Object.keys(job.jobData).length > 0);
            
            console.log(`📊 ${allJobResults.length} Jobs initial geladen und verarbeitet.`);
            currentPage = 1;
            renderJobs(allJobResults, currentWebflowMemberId);
        } else {
            appContainer.innerHTML = "<p>Keine abgeschlossenen Bewerbungen gefunden oder keine Jobs zum Anzeigen.</p>";
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
    const activeJobFilterCheckbox = document.getElementById("job-status-active-filter");
    const closedJobFilterCheckbox = document.getElementById("job-status-closed-filter");
    const pendingAppFilterCheckbox = document.getElementById("application-status-pending-filter");
    const acceptedAppFilterCheckbox = document.getElementById("application-status-accepted-filter");
    const rejectedAppFilterCheckbox = document.getElementById("application-status-rejected-filter");

    const handleFilterChange = () => {
        currentPage = 1;
        renderJobs(allJobResults, currentWebflowMemberId);
    };

    const checkboxes = [
        activeJobFilterCheckbox,
        closedJobFilterCheckbox,
        pendingAppFilterCheckbox,
        acceptedAppFilterCheckbox,
        rejectedAppFilterCheckbox
    ];

    checkboxes.forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener("change", handleFilterChange);
        } else {
            // Es ist hilfreich zu wissen, welche Checkbox fehlt, falls es zu Problemen kommt.
            // Hier könnte man die ID der erwarteten Checkbox loggen, aber das erfordert mehr Aufwand.
            // Fürs Erste reicht eine allgemeine Warnung, wenn eine Checkbox null ist.
            // console.warn("⚠️ Eine oder mehrere Filter-Checkboxen wurden nicht im DOM gefunden.");
        }
    });
    // Spezifischere Warnungen, falls benötigt:
    if (!activeJobFilterCheckbox) console.warn("⚠️ Checkbox 'job-status-active-filter' nicht gefunden.");
    if (!closedJobFilterCheckbox) console.warn("⚠️ Checkbox 'job-status-closed-filter' nicht gefunden.");
    if (!pendingAppFilterCheckbox) console.warn("⚠️ Checkbox 'application-status-pending-filter' nicht gefunden.");
    if (!acceptedAppFilterCheckbox) console.warn("⚠️ Checkbox 'application-status-accepted-filter' nicht gefunden.");
    if (!rejectedAppFilterCheckbox) console.warn("⚠️ Checkbox 'application-status-rejected-filter' nicht gefunden.");

}


// Start der Anwendung, sobald das DOM vollständig geladen ist
window.addEventListener("DOMContentLoaded", () => {
    initializeUserApplications();
    setupFilterListeners();
});

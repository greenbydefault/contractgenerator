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

// 💀 Skeleton Loader rendern
function renderSkeletonLoader(container, count) {
    container.innerHTML = ""; // Vorherigen Inhalt (z.B. "Lade...") entfernen

    const fieldSkeletons = [
        { type: "text", classModifier: "skeleton-text-short" }, 
        { type: "text", classModifier: "skeleton-text-medium" }, 
        { type: "text", classModifier: "skeleton-text-medium" }, 
        { type: "tag" }, 
        { type: "tag" }  
    ];

    for (let i = 0; i < count; i++) {
        const jobDiv = document.createElement("div");
        jobDiv.classList.add("db-table-row", "db-table-bewerbungen", "skeleton-row");

        const jobInfoDiv = document.createElement("div");
        jobInfoDiv.classList.add("db-table-row-item", "justify-left", "job-info-container");

        const skeletonImage = document.createElement("div");
        skeletonImage.classList.add("db-table-img", "is-margin-right-12", "skeleton-element", "skeleton-image");
        jobInfoDiv.appendChild(skeletonImage);

        const skeletonName = document.createElement("div");
        skeletonName.classList.add("truncate", "job-title", "skeleton-element", "skeleton-text", "skeleton-text-title");
        jobInfoDiv.appendChild(skeletonName);
        jobDiv.appendChild(jobInfoDiv);

        fieldSkeletons.forEach(skelType => {
            const fieldDiv = document.createElement("div");
            fieldDiv.classList.add("db-table-row-item");
            
            if (skelType.type === "tag") {
                 const skeletonTag = document.createElement("div");
                 skeletonTag.classList.add("job-tag", "skeleton-element", "skeleton-tag-box");
                 fieldDiv.appendChild(skeletonTag);
            } else { 
                 const skeletonFieldText = document.createElement("div");
                 skeletonFieldText.classList.add("db-job-tag-txt", "skeleton-element", "skeleton-text", skelType.classModifier || "");
                 fieldDiv.appendChild(skeletonFieldText);
            }
            jobDiv.appendChild(fieldDiv);
        });
        container.appendChild(jobDiv);
    }
    /*
    CSS-Styling für Skeleton-Elemente (Beispiel - in deiner CSS-Datei hinzufügen):
    .skeleton-row { opacity: 0.7; }
    .skeleton-element {
        background-color: #e0e0e0; // Helles Grau für Skeleton-Elemente
        border-radius: 4px;       // Abgerundete Ecken
        animation: pulse 1.5s infinite ease-in-out; // Pulsierende Animation
    }
    .skeleton-image { width: 80px; height: 80px; } 
    .skeleton-text { height: 20px; margin-bottom: 8px; }
    .skeleton-text-title { width: 60%; }
    .skeleton-text-short { width: 30%; }
    .skeleton-text-medium { width: 50%; }
    .skeleton-tag-box { width: 80px; height: 24px; }

    @keyframes pulse { // Keyframes für die Puls-Animation
        0% { background-color: #e0e0e0; }
        50% { background-color: #d0d0d0; } // Etwas dunkler in der Mitte der Animation
        100% { background-color: #e0e0e0; }
    }

    CSS-Styling für den Fade-In-Effekt der Job-Einträge (NEU - in deiner CSS-Datei hinzufügen):
    .job-entry {
        opacity: 0;
        transition: opacity 0.4s ease-in-out; // Dauer und Timing-Funktion für den Fade-In
    }
    .job-entry.visible {
        opacity: 1;
    }
    */
}


// 🖨️ Jobs rendern
function renderJobs(jobsToProcess, webflowMemberId) {
    const appContainer = document.getElementById("application-list");
    if (!appContainer) {
        console.error("❌ Element 'application-list' nicht gefunden.");
        return;
    }

    // Filterlogik (bleibt unverändert)
    const showJobActiveFilter = document.getElementById("job-status-active-filter")?.checked;
    const showJobClosedFilter = document.getElementById("job-status-closed-filter")?.checked;
    const showAppPendingFilter = document.getElementById("application-status-pending-filter")?.checked;
    const showAppAcceptedFilter = document.getElementById("application-status-accepted-filter")?.checked;
    const showAppRejectedFilter = document.getElementById("application-status-rejected-filter")?.checked;

    let filteredJobs = jobsToProcess.filter(({ jobData }) => {
        if (!jobData) return false;
        const jobEndDate = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
        const now = new Date();
        const isJobCurrentlyActive = jobEndDate && jobEndDate >= now;
        let jobStatusPasses = false;
        if ((!showJobActiveFilter && !showJobClosedFilter) || (showJobActiveFilter && showJobClosedFilter)) {
            jobStatusPasses = true; 
        } else if (showJobActiveFilter && isJobCurrentlyActive) {
            jobStatusPasses = true;
        } else if (showJobClosedFilter && !isJobCurrentlyActive) {
            jobStatusPasses = true;
        }
        if (!jobEndDate && (showJobActiveFilter || showJobClosedFilter)) { 
             if (showJobActiveFilter && !showJobClosedFilter) jobStatusPasses = false; 
             else if (showJobClosedFilter && !showJobActiveFilter) jobStatusPasses = true; 
        }

        const currentApplicationStatus = getApplicationStatusForFilter(jobData, webflowMemberId);
        let applicationStatusPasses = false;
        const noAppStatusFiltersChecked = !showAppPendingFilter && !showAppAcceptedFilter && !showAppRejectedFilter;
        if (noAppStatusFiltersChecked) {
            applicationStatusPasses = true; 
        } else {
            if (showAppPendingFilter && currentApplicationStatus === "Ausstehend") applicationStatusPasses = true;
            if (showAppAcceptedFilter && currentApplicationStatus === "Angenommen") applicationStatusPasses = true;
            if (showAppRejectedFilter && currentApplicationStatus === "Abgelehnt") applicationStatusPasses = true;
        }
        return jobStatusPasses && applicationStatusPasses;
    });
    
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    const jobsToShowOnPage = filteredJobs.slice(startIndex, endIndex);

    if (currentPage === 1) {
        appContainer.innerHTML = ""; // Skeletons oder alte Inhalte entfernen
        if (jobsToShowOnPage.length === 0) {
            const noJobsMessage = document.createElement('p');
            noJobsMessage.textContent = "ℹ️ Keine Jobs entsprechen den aktuellen Filterkriterien.";
            noJobsMessage.classList.add('job-entry'); // Für Fade-In
            appContainer.appendChild(noJobsMessage);
            requestAnimationFrame(() => { // Stellt sicher, dass das Element im DOM ist, bevor die Klasse geändert wird
                noJobsMessage.classList.add('visible');
            });
        } else {
            const fragment = document.createDocumentFragment();
            jobsToShowOnPage.forEach(({ jobData }) => { 
                if (!jobData) return;
                const jobLink = document.createElement("a");
                jobLink.href = `https://www.creatorjobs.com/creator-job/${jobData.slug || ''}`;
                jobLink.target = "_blank";
                jobLink.style.textDecoration = "none";
                jobLink.classList.add("job-listing-link", "job-entry"); // NEU: job-entry Klasse für Fade-In

                // ... (Restlicher Code zum Erstellen des jobDiv und seiner Inhalte bleibt gleich)
                const jobDiv = document.createElement("div");
                jobDiv.classList.add("db-table-row", "db-table-bewerbungen");
        
                const jobInfoDiv = document.createElement("div");
                jobInfoDiv.classList.add("db-table-row-item", "justify-left", "job-info-container");
        
                const jobImage = document.createElement("img");
                jobImage.classList.add("db-table-img", "is-margin-right-12");
                jobImage.src = jobData["job-image"]?.url || jobData["job-image"] || "https://via.placeholder.com/80x80?text=Job";
                jobImage.alt = jobData["name"] || "Job Bild";
                jobInfoDiv.appendChild(jobImage);
        
                const jobName = document.createElement("span");
                jobName.classList.add("truncate", "job-title");
                jobName.textContent = jobData["name"] || "Unbekannter Job";
                jobInfoDiv.appendChild(jobName);
        
                jobDiv.appendChild(jobInfoDiv);
        
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
                    if (field.key === "job-payment") {
                        fieldText.classList.add("db-job-tag-txt"); 
                        fieldText.textContent = value ? `${value} €` : "N/A";
                    } else if (field.key === "job-date-end") {
                        fieldText.classList.add("db-job-tag-txt"); 
                        fieldText.textContent = value ? calculateDeadlineCountdown(value) : "N/A";
                    } else if (field.key === "fertigstellung-content" && value) {
                        fieldText.classList.add("db-job-tag-txt"); 
                        const date = new Date(value);
                        fieldText.textContent = !isNaN(date.getTime()) ? `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}` : "N/A";
                    } else if (field.key === "job-status") {
                        const endDateJob = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
                        const now = new Date();
                        const statusDiv = document.createElement("div");
                        statusDiv.classList.add("job-tag");
                        const statusTextInner = document.createElement("span");
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
                        const appStatus = getApplicationStatusForFilter(jobData, webflowMemberId);
                        if (appStatus === "Angenommen") {
                            statusDiv.classList.add("is-bg-light-green");
                            statusTextInner.textContent = "Angenommen";
                        } else if (appStatus === "Abgelehnt") {
                            statusDiv.classList.add("is-bg-light-red");
                            statusTextInner.textContent = "Abgelehnt";
                        } else { 
                            statusDiv.classList.add("is-bg-light-blue");
                            statusTextInner.textContent = "Ausstehend";
                        }
                        statusDiv.appendChild(statusTextInner);
                        fieldDiv.appendChild(statusDiv);
                    } else {
                        fieldText.classList.add("db-job-tag-txt"); 
                        fieldText.textContent = value || "Nicht verfügbar";
                    }
                    if (field.key !== "job-status" && field.key !== "application-status") {
                         if(fieldText.textContent || fieldText.classList.contains("db-job-tag-txt")){ 
                            fieldDiv.appendChild(fieldText);
                         }
                    }
                    jobDiv.appendChild(fieldDiv);
                });
                jobLink.appendChild(jobDiv);
                fragment.appendChild(jobLink); 
            });
            appContainer.appendChild(fragment);
            requestAnimationFrame(() => { // Stellt sicher, dass alle Elemente im DOM sind
                const newEntries = appContainer.querySelectorAll('.job-entry');
                newEntries.forEach(entry => entry.classList.add('visible'));
            });
        }
    } else if (jobsToShowOnPage.length > 0) { // Für "Mehr laden" (currentPage > 1)
        // Bestehende Logik zum Anhängen ohne Fade-In, da dies inkrementell geschieht
        jobsToShowOnPage.forEach(({ jobData }) => { 
            if (!jobData) return;
            const jobLink = document.createElement("a");
            jobLink.href = `https://www.creatorjobs.com/creator-job/${jobData.slug || ''}`;
            jobLink.target = "_blank";
            jobLink.style.textDecoration = "none";
            jobLink.classList.add("job-listing-link"); // Keine job-entry Klasse hier, da kein Fade-In für "Mehr laden"
            
            // ... (Restlicher Code zum Erstellen des jobDiv und seiner Inhalte bleibt gleich)
            const jobDiv = document.createElement("div");
            jobDiv.classList.add("db-table-row", "db-table-bewerbungen");
    
            const jobInfoDiv = document.createElement("div");
            jobInfoDiv.classList.add("db-table-row-item", "justify-left", "job-info-container");
    
            const jobImage = document.createElement("img");
            jobImage.classList.add("db-table-img", "is-margin-right-12");
            jobImage.src = jobData["job-image"]?.url || jobData["job-image"] || "https://via.placeholder.com/80x80?text=Job";
            jobImage.alt = jobData["name"] || "Job Bild";
            jobInfoDiv.appendChild(jobImage);
    
            const jobName = document.createElement("span");
            jobName.classList.add("truncate", "job-title");
            jobName.textContent = jobData["name"] || "Unbekannter Job";
            jobInfoDiv.appendChild(jobName);
    
            jobDiv.appendChild(jobInfoDiv);
    
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
                if (field.key === "job-payment") {
                    fieldText.classList.add("db-job-tag-txt"); 
                    fieldText.textContent = value ? `${value} €` : "N/A";
                } else if (field.key === "job-date-end") {
                    fieldText.classList.add("db-job-tag-txt"); 
                    fieldText.textContent = value ? calculateDeadlineCountdown(value) : "N/A";
                } else if (field.key === "fertigstellung-content" && value) {
                    fieldText.classList.add("db-job-tag-txt"); 
                    const date = new Date(value);
                    fieldText.textContent = !isNaN(date.getTime()) ? `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}` : "N/A";
                } else if (field.key === "job-status") {
                    const endDateJob = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
                    const now = new Date();
                    const statusDiv = document.createElement("div");
                    statusDiv.classList.add("job-tag");
                    const statusTextInner = document.createElement("span");
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
                    const appStatus = getApplicationStatusForFilter(jobData, webflowMemberId);
                    if (appStatus === "Angenommen") {
                        statusDiv.classList.add("is-bg-light-green");
                        statusTextInner.textContent = "Angenommen";
                    } else if (appStatus === "Abgelehnt") {
                        statusDiv.classList.add("is-bg-light-red");
                        statusTextInner.textContent = "Abgelehnt";
                    } else { 
                        statusDiv.classList.add("is-bg-light-blue");
                        statusTextInner.textContent = "Ausstehend";
                    }
                    statusDiv.appendChild(statusTextInner);
                    fieldDiv.appendChild(statusDiv);
                } else {
                    fieldText.classList.add("db-job-tag-txt"); 
                    fieldText.textContent = value || "Nicht verfügbar";
                }
                if (field.key !== "job-status" && field.key !== "application-status") {
                     if(fieldText.textContent || fieldText.classList.contains("db-job-tag-txt")){ 
                        fieldDiv.appendChild(fieldText);
                     }
                }
                jobDiv.appendChild(fieldDiv);
            });
            jobLink.appendChild(jobDiv);
            appContainer.appendChild(jobLink); 
        });
    }

    // Load More Button (Logik bleibt unverändert)
    const loadMoreContainer = document.getElementById("load-more-container");
    if (!loadMoreContainer) {
        console.error("❌ Element 'load-more-container' nicht gefunden.");
        return;
    }
    loadMoreContainer.innerHTML = ""; 
    if (endIndex < filteredJobs.length) {
        const loadMoreButton = document.createElement("button");
        loadMoreButton.textContent = "Mehr laden";
        loadMoreButton.classList.add("load-more-btn"); 
        loadMoreButton.addEventListener("click", () => {
            currentPage++; 
            renderJobs(allJobResults, currentWebflowMemberId); 
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
    renderSkeletonLoader(appContainer, JOBS_PER_PAGE); 

    try {
        if (window.$memberstackDom && typeof window.$memberstackDom.getCurrentMember === 'function') {
            const member = await window.$memberstackDom.getCurrentMember();
            currentWebflowMemberId = member?.data?.customFields?.['webflow-member-id'];
            if (!currentWebflowMemberId) console.warn("⚠️ Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
        } else {
            console.warn("⚠️ MemberStack (window.$memberstackDom.getCurrentMember) ist nicht verfügbar.");
        }

        let applications = [];
        if (currentWebflowMemberId) {
            const userData = await fetchCollectionItem(USER_COLLECTION_ID, currentWebflowMemberId);
            applications = userData?.fieldData?.["abgeschlossene-bewerbungen"] || [];
        }

        if (applications.length > 0) {
            const jobPromises = applications.map(appId => fetchJobData(appId).then(jobData => ({ appId, jobData })));
            allJobResults = await Promise.all(jobPromises);
            allJobResults = allJobResults.filter(job => job.jobData && Object.keys(job.jobData).length > 0);
            
            currentPage = 1; 
            renderJobs(allJobResults, currentWebflowMemberId);
        } else {
            appContainer.innerHTML = ""; // Skeletons entfernen
            const noJobsMessage = document.createElement('p');
            noJobsMessage.textContent = "Keine abgeschlossenen Bewerbungen gefunden oder keine Jobs zum Anzeigen.";
            noJobsMessage.classList.add('job-entry'); // Für Fade-In
            appContainer.appendChild(noJobsMessage);
            requestAnimationFrame(() => {
                noJobsMessage.classList.add('visible');
            });

            const loadMoreContainer = document.getElementById("load-more-container");
            if (loadMoreContainer) loadMoreContainer.innerHTML = ""; 
        }
    } catch (error) {
        console.error("❌ Schwerwiegender Fehler beim Laden der Bewerbungen:", error);
        appContainer.innerHTML = ""; // Skeletons entfernen
        const errorMessage = document.createElement('p');
        errorMessage.innerHTML = `❌ Es ist ein Fehler aufgetreten: ${error.message}. Bitte versuchen Sie es später erneut.`;
        errorMessage.classList.add('job-entry'); // Für Fade-In
        appContainer.appendChild(errorMessage);
        requestAnimationFrame(() => {
            errorMessage.classList.add('visible');
        });
    }
}

// Event Listener für Filter-Checkboxen
function setupFilterListeners() {
    const filterCheckboxesIds = [
        "job-status-active-filter", "job-status-closed-filter",
        "application-status-pending-filter", "application-status-accepted-filter", "application-status-rejected-filter"
    ];

    const handleFilterChange = () => {
        currentPage = 1; 
        // Optional: Skeleton Loader hier kurz anzeigen, wenn Filterung länger dauert
        // renderSkeletonLoader(document.getElementById("application-list"), JOBS_PER_PAGE);
        // setTimeout(() => renderJobs(allJobResults, currentWebflowMemberId), 50); // Kleine Verzögerung für Skeleton
        renderJobs(allJobResults, currentWebflowMemberId); // Direkter Render für schnellere Filterung
    };

    filterCheckboxesIds.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener("change", handleFilterChange);
        } else {
            console.warn(`⚠️ Checkbox '${id}' nicht gefunden.`);
        }
    });
}


// Start der Anwendung, sobald das DOM vollständig geladen ist
window.addEventListener("DOMContentLoaded", () => {
    initializeUserApplications();
    setupFilterListeners();
});

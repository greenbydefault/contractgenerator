// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url="; // Ensure your worker URL is correct
const JOB_COLLECTION_ID = "6448faf9c5a8a17455c05525";
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";
const JOBS_PER_PAGE = 15;
const MAX_VISIBLE_PAGES_MJ = 5;

let currentPage = 1;
let allJobResults = [];
let currentWebflowMemberId = null;
let activeSortCriteria = null;
let currentSearchTerm = "";

// NEU: Tab-Konfiguration
const TABS_CONFIG = [
    { id: "alle", listContainerId: "application-list-container", listId: "application-list", name: "Alle", filterFn: (jobData, memberId) => true },
    { id: "abgelehnt", listContainerId: "application-list-rejected-container", listId: "application-list-rejected", name: "Abgelehnt", filterFn: (jobData, memberId) => getApplicationStatusForFilter(jobData, memberId) === "Abgelehnt" },
    { id: "ausstehend", listContainerId: "application-list-pending-container", listId: "application-list-pending", name: "Ausstehend", filterFn: (jobData, memberId) => getApplicationStatusForFilter(jobData, memberId) === "Ausstehend" },
    { id: "favoriten", listContainerId: "application-list-fav-container", listId: "application-list-fav", name: "In Auswahl", filterFn: (jobData, memberId) => jobData["job-favoriten"] && Array.isArray(jobData["job-favoriten"]) && jobData["job-favoriten"].includes(memberId) }
];
let activeTabId = TABS_CONFIG[0].id; // Standardmäßig "Alle" aktiv

// 🛠️ Hilfsfunktionen
function buildWorkerUrl(apiUrl) {
    return `${WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

async function fetchCollectionItem(collectionId, memberId) {
    const apiUrl = `${API_BASE_URL}/${collectionId}/items/${memberId}/live`;
    const workerUrl = buildWorkerUrl(apiUrl);
    try {
        const response = await fetch(workerUrl);
        if (!response.ok) throw new Error(`API-Fehler: ${response.status} - ${await response.text()}`);
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
            console.error(`API-Fehler beim Abrufen von Job ${jobId}: ${response.status} - ${await response.text()}`);
            return { id: jobId, error: true, status: response.status, message: `API Error for job ${jobId}` };
        }
        const jobData = await response.json();
        // Sicherstellen, dass fieldData und slug vorhanden sind
        const fieldData = jobData?.item?.fieldData || jobData?.fieldData; // Anpassung an mögliche Webflow API Antwortstrukturen
        const slug = fieldData?.slug || jobData?.item?.slug || jobData?.slug;
        return fieldData ? { ...fieldData, id: jobData.id || jobData?.item?.id, slug: slug } : { id: jobId, error: true, message: `No fieldData for job ${jobId}`};
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen der Job-Daten für ${jobId}: ${error.message}`);
        return { id: jobId, error: true, status: 'network_error', message: `Network error for job ${jobId}: ${error.message}` };
    }
}

function calculateDeadlineCountdown(endDate) {
    if (!endDate) return { text: "N/A", isExpired: false };
    const now = new Date();
    const deadline = new Date(endDate);
    const diff = deadline - now;

    if (diff <= 0) return { text: "Abgelaufen", isExpired: true };

    const minutesTotal = Math.floor(diff / (1000 * 60));
    const hoursTotal = Math.floor(minutesTotal / 60);
    const daysTotal = Math.floor(hoursTotal / 24);

    if (daysTotal > 0) {
        return { text: `${daysTotal} Tag${daysTotal > 1 ? 'e' : ''}`, isExpired: false };
    }
    if (hoursTotal > 0) {
        return { text: `${hoursTotal} Stunde${hoursTotal > 1 ? 'n' : ''}`, isExpired: false };
    }
    return { text: `${minutesTotal} Minute${minutesTotal > 1 ? 'n' : ''}`, isExpired: false };
}

function getApplicationStatusForFilter(jobData, memberId) {
    if (!jobData || jobData.error) return "Ausstehend"; // Fallback, falls jobData nicht korrekt geladen wurde
    const bookedCreators = jobData["booked-creators"] || [];
    const rejectedCreators = jobData["rejected-creators"] || [];
    const endDateApp = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
    const now = new Date();

    if (memberId && bookedCreators.includes(memberId)) return "Angenommen";
    // Wichtig: "Abgelehnt" Status auch prüfen, wenn Job abgelaufen UND Creator nicht gebucht wurde.
    if (memberId && rejectedCreators.includes(memberId)) return "Abgelehnt";
    if (memberId && endDateApp && endDateApp < now && !bookedCreators.includes(memberId)) return "Abgelehnt";
    
    return "Ausstehend";
}

// 💀 Skeleton Loader rendern
function renderSkeletonLoader(targetListElement, count) {
    if (!targetListElement) {
        console.warn("Skeleton Loader: Target list element not found.");
        return;
    }
    targetListElement.innerHTML = "";
    const fieldSkeletons = [
        { type: "text", classModifier: "skeleton-text-short" },
        { type: "text", classModifier: "skeleton-text-medium" },
        { type: "text", classModifier: "skeleton-text-medium" },
        { type: "tag" }, { type: "tag" }
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
        targetListElement.appendChild(jobDiv);
    }
}

// 📄 Pagination Controls rendern
function renderPaginationControls(paginationContainerElement, currentPageNum, totalPagesNum) {
    // ... (Rest der Funktion bleibt gleich, stellt sicher, dass sie den korrekten Container verwendet)
    if (!paginationContainerElement) {
        console.warn("Pagination container not found for controls.");
        return;
    }
    paginationContainerElement.innerHTML = ''; 
    paginationContainerElement.style.display = totalPagesNum <= 1 ? "none" : "flex";

    if (totalPagesNum <= 1) {
        return;
    }

    async function handlePageChange(newPage) {
        const buttons = paginationContainerElement.querySelectorAll('.db-pagination-count');
        buttons.forEach(btn => btn.classList.add('disabled-loading'));
        
        currentPage = newPage;
        // Wichtig: renderActiveTabContent sorgt dafür, dass die richtige Liste mit der neuen Seite gerendert wird
        renderActiveTabContent(); 
    }

    const prevButton = document.createElement("a");
    prevButton.href = "#";
    prevButton.classList.add("db-pagination-count", "button-prev");
    prevButton.textContent = "Zurück";
    if (currentPageNum === 1) {
        prevButton.classList.add("disabled");
    } else {
        prevButton.addEventListener("click", async (e) => {
            e.preventDefault();
            if (prevButton.classList.contains("disabled") || prevButton.classList.contains("disabled-loading")) return;
            // prevButton.textContent = "Lade..."; // Kann zu UI-Sprüngen führen, wenn schnell geklickt wird
            await handlePageChange(currentPageNum - 1);
        });
    }
    paginationContainerElement.appendChild(prevButton);

    let startPage, endPage;
    if (totalPagesNum <= MAX_VISIBLE_PAGES_MJ) {
        startPage = 1;
        endPage = totalPagesNum;
    } else {
        const maxPagesBeforeCurrentPage = Math.floor(MAX_VISIBLE_PAGES_MJ / 2);
        const maxPagesAfterCurrentPage = Math.ceil(MAX_VISIBLE_PAGES_MJ / 2) - 1;
        if (currentPageNum <= maxPagesBeforeCurrentPage) {
            startPage = 1;
            endPage = MAX_VISIBLE_PAGES_MJ;
        } else if (currentPageNum + maxPagesAfterCurrentPage >= totalPagesNum) {
            startPage = totalPagesNum - MAX_VISIBLE_PAGES_MJ + 1;
            endPage = totalPagesNum;
        } else {
            startPage = currentPageNum - maxPagesBeforeCurrentPage;
            endPage = currentPageNum + maxPagesAfterCurrentPage;
        }
    }

    if (startPage > 1) {
        const firstPageLink = document.createElement("a");
        firstPageLink.href = "#";
        firstPageLink.classList.add("db-pagination-count");
        firstPageLink.textContent = "1";
        firstPageLink.addEventListener("click", async (e) => {
            e.preventDefault();
            if (firstPageLink.classList.contains("disabled-loading") || currentPageNum === 1) return;
            // document.querySelectorAll('.db-pagination-count:not(.ellipsis)').forEach(el => el.classList.add("disabled-loading"));
            // firstPageLink.textContent = "...";
            await handlePageChange(1);
        });
        paginationContainerElement.appendChild(firstPageLink);
        if (startPage > 2) {
            const ellipsisSpan = document.createElement("span");
            ellipsisSpan.classList.add("db-pagination-count", "ellipsis");
            ellipsisSpan.textContent = "...";
            paginationContainerElement.appendChild(ellipsisSpan);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLink = document.createElement("a");
        pageLink.href = "#";
        pageLink.classList.add("db-pagination-count");
        pageLink.textContent = i;
        if (i === currentPageNum) {
            pageLink.classList.add("current");
        } else {
            pageLink.addEventListener("click", async (e) => {
                e.preventDefault();
                if (pageLink.classList.contains("disabled-loading")) return;
                // document.querySelectorAll('.db-pagination-count:not(.ellipsis)').forEach(el => el.classList.add("disabled-loading"));
                // pageLink.textContent = "...";
                await handlePageChange(i);
            });
        }
        paginationContainerElement.appendChild(pageLink);
    }

    if (endPage < totalPagesNum) {
        if (endPage < totalPagesNum - 1) {
            const ellipsisSpan = document.createElement("span");
            ellipsisSpan.classList.add("db-pagination-count", "ellipsis");
            ellipsisSpan.textContent = "...";
            paginationContainerElement.appendChild(ellipsisSpan);
        }
        const lastPageLink = document.createElement("a");
        lastPageLink.href = "#";
        lastPageLink.classList.add("db-pagination-count");
        lastPageLink.textContent = totalPagesNum;
        lastPageLink.addEventListener("click", async (e) => {
            e.preventDefault();
            if (lastPageLink.classList.contains("disabled-loading") || currentPageNum === totalPagesNum) return;
            // document.querySelectorAll('.db-pagination-count:not(.ellipsis)').forEach(el => el.classList.add("disabled-loading"));
            // lastPageLink.textContent = "...";
            await handlePageChange(totalPagesNum);
        });
        paginationContainerElement.appendChild(lastPageLink);
    }

    const nextButton = document.createElement("a");
    nextButton.href = "#";
    nextButton.classList.add("db-pagination-count", "button-next");
    nextButton.textContent = "Weiter";
    if (currentPageNum === totalPagesNum) {
        nextButton.classList.add("disabled");
    } else {
        nextButton.addEventListener("click", async (e) => {
            e.preventDefault();
            if (nextButton.classList.contains("disabled") || nextButton.classList.contains("disabled-loading")) return;
            // nextButton.textContent = "Lade...";
            await handlePageChange(currentPageNum + 1);
        });
    }
    paginationContainerElement.appendChild(nextButton);
}

// 🖨️ Jobs rendern (angepasst für spezifische Listen-ID)
function renderJobs(jobsToProcessPrimaryFilter, webflowMemberId, targetListId) {
    const appContainer = document.getElementById(targetListId);
    if (!appContainer) {
        console.error(`❌ Element '${targetListId}' nicht gefunden.`);
        return;
    }
    appContainer.innerHTML = "";

    // Sekundäre Filter (Checkboxes, Suche) auf die bereits für den Tab vorab gefilterten Jobs anwenden
    const showJobActiveFilter = document.getElementById("job-status-active-filter")?.checked;
    const showJobClosedFilter = document.getElementById("job-status-closed-filter")?.checked;
    // Die Filter für Bewerbungsstatus (pending, accepted, rejected) sind durch die Tabs bereits primär abgedeckt.
    // Hier könnten sie als zusätzliche Verfeinerung dienen, falls gewünscht, oder entfernt/ignoriert werden,
    // da der Tab bereits die Hauptfilterung vornimmt. Fürs Erste lassen wir sie, falls Nutzer innerhalb eines Tabs weiter filtern will.
    const showAppPendingFilter = document.getElementById("application-status-pending-filter")?.checked;
    const showAppAcceptedFilter = document.getElementById("application-status-accepted-filter")?.checked;
    const showAppRejectedFilter = document.getElementById("application-status-rejected-filter")?.checked;

    const searchTermNormalized = currentSearchTerm.toLowerCase().trim();

    let filteredJobs = jobsToProcessPrimaryFilter.filter(({ jobData }) => {
        if (!jobData || jobData.error) return false;

        // Suchfilter
        if (searchTermNormalized) {
            const jobName = (jobData["name"] || "").toLowerCase();
            if (!jobName.includes(searchTermNormalized)) return false;
        }

        // Job-Status Filter (Aktiv/Geschlossen)
        const jobEndDate = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
        const now = new Date();
        const isJobCurrentlyActive = jobEndDate && jobEndDate >= now;
        
        let jobStatusPasses = true; // Standardmäßig true, wenn keine Checkboxen aktiv
        if (showJobActiveFilter || showJobClosedFilter) { // Nur filtern, wenn eine der Optionen gewählt ist
             jobStatusPasses = 
                (showJobActiveFilter && isJobCurrentlyActive) || 
                (showJobClosedFilter && !isJobCurrentlyActive) ||
                (showJobActiveFilter && showJobClosedFilter); // Wenn beide, dann alle anzeigen (oder spezifische Logik)
            
            // Sonderfall: Kein Enddatum, aber Filter aktiv
            if (!jobEndDate) {
                if (showJobActiveFilter && !showJobClosedFilter) jobStatusPasses = false; // Soll aktiv zeigen, aber kein Datum -> nicht aktiv
                // Wenn nur showJobClosedFilter aktiv ist und kein Enddatum, könnte man es als "nicht aktiv" = geschlossen interpretieren
                // oder als "unbekannt" und nicht anzeigen. Aktuell: Wenn showJobClosedFilter, dann true.
            }
        }
        if (!jobStatusPasses) return false;
        
        // Bewerbungsstatus Filter (Ausstehend/Angenommen/Abgelehnt)
        // Diese Filter sind primär durch die Tabs abgedeckt.
        // Wenn Checkboxen für diese trotzdem aktiv sind, könnten sie die Tab-Auswahl weiter verfeinern.
        // Beispiel: Im Tab "Alle" kann man dann nach "allen angenommenen" filtern.
        // Im Tab "Abgelehnt" macht ein weiterer Filter auf "angenommen" keinen Sinn.
        // Fürs Erste lassen wir die Logik, sie greift, wenn die Checkboxen explizit genutzt werden.
        const currentApplicationStatus = getApplicationStatusForFilter(jobData, webflowMemberId);
        let applicationStatusPasses = true;
        if (showAppPendingFilter || showAppAcceptedFilter || showAppRejectedFilter) {
            applicationStatusPasses = 
                (showAppPendingFilter && currentApplicationStatus === "Ausstehend") ||
                (showAppAcceptedFilter && currentApplicationStatus === "Angenommen") ||
                (showAppRejectedFilter && currentApplicationStatus === "Abgelehnt");
        }
        return applicationStatusPasses;
    });

    // Sortierlogik
    let sortedJobs = [...filteredJobs];
    if (activeSortCriteria && activeSortCriteria.key) {
        sortedJobs.sort((a, b) => {
            const jobDataA = a.jobData;
            const jobDataB = b.jobData;
            if (!jobDataA || jobDataA.error || !jobDataB || jobDataB.error) return 0;
            let valA, valB;
            switch (activeSortCriteria.key) {
                case 'deadline':
                    valA = jobDataA['job-date-end'] ? new Date(jobDataA['job-date-end']) : new Date(0);
                    valB = jobDataB['job-date-end'] ? new Date(jobDataB['job-date-end']) : new Date(0);
                    if (valA.getTime() === 0) valA = activeSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
                    if (valB.getTime() === 0) valB = activeSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
                    break;
                case 'content':
                    valA = jobDataA['fertigstellung-content'] ? new Date(jobDataA['fertigstellung-content']) : new Date(0);
                    valB = jobDataB['fertigstellung-content'] ? new Date(jobDataB['fertigstellung-content']) : new Date(0);
                    if (valA.getTime() === 0) valA = activeSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
                    if (valB.getTime() === 0) valB = activeSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
                    break;
                case 'budget':
                    valA = parseFloat(String(jobDataA['job-payment'] || '0').replace(/[^0-9.-]+/g, ""));
                    valB = parseFloat(String(jobDataB['job-payment'] || '0').replace(/[^0-9.-]+/g, ""));
                    if (isNaN(valA)) valA = activeSortCriteria.direction === 'asc' ? Infinity : -Infinity;
                    if (isNaN(valB)) valB = activeSortCriteria.direction === 'asc' ? Infinity : -Infinity;
                    break;
                default: return 0;
            }
            let comparison = 0;
            if (valA < valB) comparison = -1;
            if (valA > valB) comparison = 1;
            return activeSortCriteria.direction === 'desc' ? comparison * -1 : comparison;
        });
    }

    const totalPages = Math.ceil(sortedJobs.length / JOBS_PER_PAGE);
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    const jobsToShowOnPage = sortedJobs.slice(startIndex, endIndex);

    if (jobsToShowOnPage.length === 0) {
        const noJobsMessage = document.createElement('p');
        noJobsMessage.textContent = "ℹ️ Keine Jobs entsprechen den aktuellen Kriterien für diesen Tab.";
        noJobsMessage.classList.add('job-entry', 'visible'); // Stellt sicher, dass die Nachricht sichtbar ist
        appContainer.appendChild(noJobsMessage);
    } else {
        const fragment = document.createDocumentFragment();
        jobsToShowOnPage.forEach(({ jobData }) => {
            if (!jobData || jobData.error) {
                 console.warn("Skipping job due to error or no data:", jobData);
                 return;
            }
            const jobLink = document.createElement("a");
            jobLink.href = `https://www.creatorjobs.com/creator-job/${jobData.slug || jobData.id || ''}`;
            jobLink.target = "_blank";
            jobLink.style.textDecoration = "none";
            jobLink.classList.add("job-listing-link", "job-entry");

            const jobDiv = document.createElement("div");
            jobDiv.classList.add("db-table-row", "db-table-bewerbungen");

            const jobInfoDiv = document.createElement("div");
            jobInfoDiv.classList.add("db-table-row-item", "justify-left", "job-info-container");
            const jobImage = document.createElement("img");
            jobImage.classList.add("db-table-img", "is-margin-right-12");
            jobImage.src = jobData["job-image"]?.url || jobData["job-image"] || "https://via.placeholder.com/80x80?text=Job";
            jobImage.alt = jobData["name"] || "Job Bild";
            jobInfoDiv.appendChild(jobImage);
            const jobNameSpan = document.createElement("span");
            jobNameSpan.classList.add("truncate", "job-title");
            jobNameSpan.textContent = jobData["name"] || "Unbekannter Job";
            jobInfoDiv.appendChild(jobNameSpan);
            jobDiv.appendChild(jobInfoDiv);

            const fields = [
                { key: "job-payment", label: "Bezahlung" }, { key: "job-date-end", label: "Bewerbungsfrist" },
                { key: "fertigstellung-content", label: "Contentdeadline" }, { key: "job-status", label: "Job Status" },
                { key: "application-status", label: "Bewerbungsstatus" }
            ];
            fields.forEach(field => {
                const value = jobData[field.key];
                const fieldDiv = document.createElement("div");
                fieldDiv.classList.add("db-table-row-item", `item-${field.key}`);
                const fieldText = document.createElement("span"); 

                if (field.key === "job-payment") {
                    fieldText.classList.add("job-tag", "customer");
                    fieldText.textContent = value ? `${value} €` : "N/A";
                } else if (field.key === "job-date-end") {
                    const deadlineInfo = calculateDeadlineCountdown(value);
                    fieldText.classList.add("job-tag"); 
                    if (deadlineInfo.isExpired) {
                        fieldText.classList.add("is-bg-light-red");
                    }
                    fieldText.textContent = deadlineInfo.text;
                } else if (field.key === "fertigstellung-content") {
                    fieldText.classList.add("job-tag", "customer"); 
                    if (value) {
                        const date = new Date(value);
                        fieldText.textContent = !isNaN(date.getTime()) ? `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}` : "N/A";
                    } else {
                        fieldText.textContent = "N/A";
                    }
                } else if (field.key === "job-status") {
                    const endDateJob = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
                    const now = new Date();
                    const statusDiv = document.createElement("div"); statusDiv.classList.add("job-tag");
                    const statusTextInner = document.createElement("span");
                    if (endDateJob && endDateJob < now) { statusDiv.classList.add("is-bg-light-red"); statusTextInner.textContent = "Beendet"; }
                    else if (endDateJob) { statusDiv.classList.add("is-bg-light-green"); statusTextInner.textContent = "Aktiv"; }
                    else { statusDiv.classList.add("is-bg-light-grey"); statusTextInner.textContent = "Unbekannt"; }
                    statusDiv.appendChild(statusTextInner); fieldDiv.appendChild(statusDiv);
                } else if (field.key === "application-status") {
                    const statusDiv = document.createElement("div"); statusDiv.classList.add("job-tag");
                    const statusTextInner = document.createElement("span");
                    const appStatus = getApplicationStatusForFilter(jobData, webflowMemberId);
                    if (appStatus === "Angenommen") { statusDiv.classList.add("is-bg-light-green"); statusTextInner.textContent = "Angenommen"; }
                    else if (appStatus === "Abgelehnt") { statusDiv.classList.add("is-bg-light-red"); statusTextInner.textContent = "Abgelehnt"; }
                    else { statusDiv.classList.add("is-bg-light-blue"); statusTextInner.textContent = "Ausstehend"; }
                    statusDiv.appendChild(statusTextInner); fieldDiv.appendChild(statusDiv);
                } else { 
                    fieldText.classList.add("db-job-tag-txt");
                    fieldText.textContent = value || "Nicht verfügbar";
                }

                if (field.key !== "job-status" && field.key !== "application-status") {
                    if (fieldText.textContent || fieldText.classList.length > 0) { 
                         fieldDiv.appendChild(fieldText);
                    }
                }
                jobDiv.appendChild(fieldDiv);
            });
            jobLink.appendChild(jobDiv);
            fragment.appendChild(jobLink);
        });
        appContainer.appendChild(fragment);
        requestAnimationFrame(() => {
            const newEntries = appContainer.querySelectorAll('.job-entry:not(.visible)');
            newEntries.forEach(entry => entry.classList.add('visible'));
        });
    }

    const paginationContainer = document.getElementById("pagination-controls-container") || createPaginationContainer();
    renderPaginationControls(paginationContainer, currentPage, totalPages);
}

function createPaginationContainer() {
    let container = document.getElementById("pagination-controls-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "pagination-controls-container";
        container.className = "db-table-pagination"; 
        // Append to a sensible default if specific app list parent isn't easily determined here
        const firstTabContainer = document.getElementById(TABS_CONFIG[0].listContainerId);
        if (firstTabContainer && firstTabContainer.parentNode) {
             firstTabContainer.parentNode.appendChild(container); // Append after all tab content containers
        } else {
            document.body.appendChild(container); 
        }
    }
    return container;
}

// NEU: Funktion zum Rendern des Inhalts des aktiven Tabs
function renderActiveTabContent() {
    const activeTabConfig = TABS_CONFIG.find(tab => tab.id === activeTabId);
    if (!activeTabConfig) {
        console.error("Aktiver Tab nicht in Konfiguration gefunden:", activeTabId);
        return;
    }

    const targetListElement = document.getElementById(activeTabConfig.listId);
    if (!targetListElement) {
        console.error("Ziellisten-Element für Tab nicht gefunden:", activeTabConfig.listId);
        // Optional: Versuchen, den Skeleton Loader im ersten Tab anzuzeigen, falls dieser gerade initialisiert wird
        const initialListElement = document.getElementById(TABS_CONFIG[0].listId);
        if (initialListElement) renderSkeletonLoader(initialListElement, JOBS_PER_PAGE);
        return;
    }
    
    // Zeige Skeleton Loader im Ziel-Tab-Container, bevor Jobs geladen/gerendert werden
    renderSkeletonLoader(targetListElement, JOBS_PER_PAGE);


    // Filtere die allJobResults basierend auf der filterFn des aktiven Tabs
    const jobsForThisTab = allJobResults.filter(job => {
        // Stelle sicher, dass job.jobData existiert, bevor darauf zugegriffen wird
        return job.jobData && !job.jobData.error && activeTabConfig.filterFn(job.jobData, currentWebflowMemberId);
    });
    
    // Kurze Verzögerung, damit der Skeleton Loader sichtbar ist, bevor die Jobs gerendert werden
    // (besonders nützlich, wenn das Filtern sehr schnell geht)
    setTimeout(() => {
        renderJobs(jobsForThisTab, currentWebflowMemberId, activeTabConfig.listId);
    }, 50); // Kleine Verzögerung
}


// Initialisierungsfunktion
async function initializeUserApplications() {
    const initialTabConfig = TABS_CONFIG.find(tab => tab.id === activeTabId);
    const initialListElement = initialTabConfig ? document.getElementById(initialTabConfig.listId) : null;

    if (initialListElement) {
        renderSkeletonLoader(initialListElement, JOBS_PER_PAGE);
    } else {
        // Fallback, falls der initial aktive Tab nicht korrekt geladen werden kann
        const fallbackListElement = document.getElementById(TABS_CONFIG[0].listId);
        if (fallbackListElement) renderSkeletonLoader(fallbackListElement, JOBS_PER_PAGE);
        else console.error("FEHLER: Initialer App-Container für Skeleton nicht im DOM gefunden.");
    }
    
    const itemCountElement = document.querySelector('[data-db-table-item-count]');

    try {
        if (window.$memberstackDom && typeof window.$memberstackDom.getCurrentMember === 'function') {
            const member = await window.$memberstackDom.getCurrentMember();
            currentWebflowMemberId = member?.data?.customFields?.['webflow-member-id']; // Korrekter Zugriff auf customFields
            if (!currentWebflowMemberId) console.warn("⚠️ Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
        } else { console.warn("⚠️ MemberStack (window.$memberstackDom.getCurrentMember) ist nicht verfügbar."); }

        let applicationsFromUser = [];
        if (currentWebflowMemberId) {
            const userData = await fetchCollectionItem(USER_COLLECTION_ID, currentWebflowMemberId);
            // Zugriff auf fieldData, das die Bewerbungen enthält
            const userFieldData = userData?.item?.fieldData || userData?.fieldData;
            applicationsFromUser = userFieldData?.["abgeschlossene-bewerbungen"] || [];
        }

        if (applicationsFromUser.length > 0) {
            const jobPromises = applicationsFromUser.map(appId => fetchJobData(appId).then(jobDataResponse => ({ appId, jobData: jobDataResponse })));
            allJobResults = await Promise.all(jobPromises);
            // Filtert Jobs heraus, die Fehler hatten oder keine validen Daten (mehr als nur id/error/slug)
            allJobResults = allJobResults.filter(job => job.jobData && !job.jobData.error && Object.keys(job.jobData).length > 3); 
            
            if (itemCountElement) {
                itemCountElement.textContent = allJobResults.length;
            }
            
            currentPage = 1; // Zurücksetzen für den ersten Render
            renderActiveTabContent(); // Rendert den initial aktiven Tab
        } else {
            if (initialListElement) initialListElement.innerHTML = ""; // Leere den Skeleton Loader
            else if (document.getElementById(TABS_CONFIG[0].listId)) document.getElementById(TABS_CONFIG[0].listId).innerHTML = "";

            const noJobsMessage = document.createElement('p');
            noJobsMessage.textContent = "Keine abgeschlossenen Bewerbungen gefunden oder keine Jobs zum Anzeigen.";
            noJobsMessage.classList.add('job-entry', 'visible');
            
            // Nachricht im ersten Tab anzeigen, wenn keine Jobs vorhanden sind
            const firstTabList = document.getElementById(TABS_CONFIG[0].listId);
            if (firstTabList) {
                firstTabList.appendChild(noJobsMessage);
            } else {
                 console.error("Konnte 'Keine Jobs'-Nachricht nicht im ersten Tab anzeigen.");
            }
            
            if (itemCountElement) {
                itemCountElement.textContent = "0";
            }

            const paginationContainer = document.getElementById("pagination-controls-container");
            if (paginationContainer) paginationContainer.innerHTML = "";
        }
    } catch (error) {
        console.error("❌ Schwerwiegender Fehler beim Laden der Bewerbungen:", error);
        if (initialListElement) initialListElement.innerHTML = "";
        const errorMessage = document.createElement('p');
        errorMessage.innerHTML = `❌ Es ist ein Fehler aufgetreten: ${error.message}. Bitte versuchen Sie es später erneut.`;
        errorMessage.classList.add('job-entry', 'visible');
        if (initialListElement) initialListElement.appendChild(errorMessage);
        if (itemCountElement) {
            itemCountElement.textContent = "0";
        }
    }
}

// Event Listener
function setupEventListeners() {
    // Filter Checkboxen Listener
    const filterCheckboxIds = [
        "job-status-active-filter", "job-status-closed-filter",
        "application-status-pending-filter", "application-status-accepted-filter", "application-status-rejected-filter"
    ];
    const allFilterCheckboxes = filterCheckboxIds.map(id => document.getElementById(id)).filter(cb => cb !== null);
    allFilterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            currentPage = 1; // Reset Paginierung bei Filteränderung
            renderActiveTabContent();
        });
    });

    // Sortier Checkboxen Listener
    const sortCheckboxDefinitions = [
        { id: "job-sort-deadline-asc", key: "deadline", direction: "asc" },
        { id: "job-sort-deadline-desc", key: "deadline", direction: "desc" },
        { id: "job-sort-content-asc", key: "content", direction: "asc" },
        { id: "job-sort-content-desc", key: "content", direction: "desc" },
        { id: "job-sort-budget-asc", key: "budget", direction: "asc" },
        { id: "job-sort-budget-desc", key: "budget", direction: "desc" }
    ];
    const allSortCheckboxes = sortCheckboxDefinitions.map(def => {
        const cb = document.getElementById(def.id);
        if (cb) {
            cb.dataset.sortKey = def.key;
            cb.dataset.sortDirection = def.direction;
        }
        return cb;
    }).filter(cb => cb !== null);

    allSortCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const targetCheckbox = event.target;
            if (targetCheckbox.checked) {
                activeSortCriteria = {
                    key: targetCheckbox.dataset.sortKey,
                    direction: targetCheckbox.dataset.sortDirection
                };
                allSortCheckboxes.forEach(otherCb => {
                    if (otherCb !== targetCheckbox) otherCb.checked = false;
                });
            } else {
                if (activeSortCriteria && activeSortCriteria.key === targetCheckbox.dataset.sortKey && activeSortCriteria.direction === targetCheckbox.dataset.sortDirection) {
                    activeSortCriteria = null;
                }
            }
            currentPage = 1;
            renderActiveTabContent();
        });
    });

    // Suchfeld Listener
    const searchInput = document.getElementById("filter-search");
    if (searchInput) {
        searchInput.addEventListener("input", (event) => {
            currentSearchTerm = event.target.value;
            currentPage = 1;
            renderActiveTabContent();
        });
    } else {
        console.warn("⚠️ Suchfeld 'filter-search' nicht im DOM gefunden.");
    }

    // Tab-Link Listener
    const tabLinks = document.querySelectorAll(".tab-link[data-tab-id]"); // Selektor für Tab-Links
    tabLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const newTabId = link.dataset.tabId;
            if (newTabId === activeTabId) return; // Nichts tun, wenn derselbe Tab geklickt wird

            activeTabId = newTabId;
            currentPage = 1; // Paginierung für neuen Tab zurücksetzen

            // Aktive Klassen für Tabs und Content-Bereiche aktualisieren
            tabLinks.forEach(tl => tl.classList.remove("active-tab")); // Oder deine spezifische Klasse für aktive Tabs
            link.classList.add("active-tab");

            TABS_CONFIG.forEach(tabConfig => {
                const contentContainer = document.getElementById(tabConfig.listContainerId);
                if (contentContainer) {
                    contentContainer.style.display = tabConfig.id === activeTabId ? "" : "none";
                     // contentContainer.classList.toggle("active-content", tabConfig.id === activeTabId); // Alternative mit Klasse
                }
            });
            renderActiveTabContent();
        });
    });

    // Warnungen für fehlende Elemente
    filterCheckboxIds.forEach(id => {
        if (!document.getElementById(id)) console.warn(`⚠️ Filter-Checkbox '${id}' nicht im DOM gefunden.`);
    });
    sortCheckboxDefinitions.forEach(def => {
        if (!document.getElementById(def.id)) console.warn(`⚠️ Sortier-Checkbox '${def.id}' nicht im DOM gefunden.`);
    });
    TABS_CONFIG.forEach(tab => {
        if (!document.getElementById(tab.listId)) console.warn(`⚠️ Listen-Element für Tab '${tab.name}' (ID: ${tab.listId}) nicht im DOM gefunden.`);
        if (!document.getElementById(tab.listContainerId)) console.warn(`⚠️ Listen-Container-Element für Tab '${tab.name}' (ID: ${tab.listContainerId}) nicht im DOM gefunden.`);
    });
    if (tabLinks.length === 0) console.warn("⚠️ Keine Tab-Links mit 'data-tab-id' gefunden.");

}

// Start der Anwendung
window.addEventListener("DOMContentLoaded", () => {
    // Sicherstellen, dass der initiale Tab-Container sichtbar ist
    TABS_CONFIG.forEach(tabConfig => {
        const contentContainer = document.getElementById(tabConfig.listContainerId);
        if (contentContainer) {
            contentContainer.style.display = tabConfig.id === activeTabId ? "" : "none";
        }
    });
    const initialActiveTabLink = document.querySelector(`.tab-link[data-tab-id="${activeTabId}"]`);
    if(initialActiveTabLink) initialActiveTabLink.classList.add("active-tab");


    initializeUserApplications();
    setupEventListeners();
    createPaginationContainer(); // Stellt sicher, dass der Paginierungscontainer existiert
});

// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL_BOOKED = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL_BOOKED = "https://bewerbungen.oliver-258.workers.dev/?url="; // Worker URL für CORS-Anfragen
const JOB_COLLECTION_ID_BOOKED = "6448faf9c5a8a17455c05525"; // Webflow Collection ID für Jobs
const USER_COLLECTION_ID_BOOKED = "6448faf9c5a8a15f6cc05526"; // Webflow Collection ID für Benutzer
const SKELETON_COUNT_BOOKED = 5; // Anzahl der Skeleton-Zeilen, die initial angezeigt werden
const JOBS_PER_PAGE_BOOKED = 15; // NEU: Anzahl der Jobs pro Seite für gebuchte Jobs
const MAX_VISIBLE_PAGES_BOOKED = 5; // NEU: Maximale sichtbare Paginierungslinks

let currentWebflowMemberId_Booked = null;
let currentBookedJobsSearchTerm = "";
let activeBookedJobsSortCriteria = null;
let allBookedJobsDataGlobal = []; // Globale Variable zum Speichern aller geladenen Job-Daten
let currentPageBookedJobs = 1; // NEU: Aktuelle Seite für gebuchte Jobs

// 🛠️ Hilfsfunktionen
function buildWorkerUrl_Booked(apiUrl) {
    return `${WORKER_BASE_URL_BOOKED}${encodeURIComponent(apiUrl)}`;
}

function calculateCountdown_Booked(endDate) {
    if (!endDate) return { text: "K.A.", class: "job-tag" };

    const now = new Date();
    const deadline = new Date(endDate);
    const diff = deadline - now; // Differenz in Millisekunden

    if (diff <= 0) return { text: "Abgelaufen", class: "job-tag is-bg-light-red" };

    const totalMinutes = Math.floor(diff / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);

    let text = "";
    let tagClass = "job-tag"; // Standard-Klasse

    if (days > 0) {
        text = `${days} ${days === 1 ? "Tag" : "Tage"}`;
        if (days <= 4) {
            tagClass = "job-tag is-bg-light-red";
        } else if (days <= 10) {
            tagClass = "job-tag is-bg-light-yellow";
        }
    } else if (totalHours > 0) {
        text = `${totalHours} ${totalHours === 1 ? "Std." : "Std."}`;
        tagClass = "job-tag is-bg-light-red";
    } else {
        text = `${totalMinutes} ${totalMinutes === 1 ? "Min." : "Min."}`;
        tagClass = "job-tag is-bg-light-red";
    }
    return { text: text, class: tagClass };
}


async function fetchCollectionItem_Booked(collectionId, itemId) {
    const apiUrl = `${API_BASE_URL_BOOKED}/${collectionId}/items/${itemId}/live`;
    const workerUrl = buildWorkerUrl_Booked(apiUrl);
    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API-Fehler beim Abrufen von Item ${itemId} aus Collection ${collectionId}: ${response.status} - ${errorText}`);
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen des Collection Items (${collectionId}/${itemId}): ${error.message}`);
        return null;
    }
}

async function fetchJobData_Booked(jobId) {
    const jobItem = await fetchCollectionItem_Booked(JOB_COLLECTION_ID_BOOKED, jobId);
    // Ensure to return an object that includes the id and slug at the top level for consistency
    if (jobItem && jobItem.fieldData) {
        return { ...jobItem.fieldData, id: jobItem.id, slug: jobItem.fieldData.slug || jobItem.slug };
    }
    return { id: jobId, error: true, message: `No fieldData for job ${jobId}` }; // Return error structure
}

// 💀 Skeleton Loader für gebuchte Jobs rendern
function renderBookedJobsSkeletonLoader(container, count) {
    container.innerHTML = "";
    const fieldSkeletonsConfig = [
        { type: "brandTagOnly" },
        { classModifier: "skeleton-text-short" },
        { classModifier: "skeleton-text-medium" },
        { type: "tag" },
        { type: "tag" }
    ];

    for (let i = 0; i < count; i++) {
        const jobDiv = document.createElement("div");
        jobDiv.classList.add("db-table-row", "db-table-booked", "skeleton-row");

        const jobInfoDiv = document.createElement("div");
        jobInfoDiv.classList.add("db-table-row-item", "justify-left");
        const skeletonJobImage = document.createElement("div");
        skeletonJobImage.classList.add("db-table-img", "is-margin-right-12", "skeleton-element", "skeleton-image");
        jobInfoDiv.appendChild(skeletonJobImage);
        const skeletonJobName = document.createElement("div");
        skeletonJobName.classList.add("truncate", "skeleton-element", "skeleton-text", "skeleton-text-title");
        jobInfoDiv.appendChild(skeletonJobName);
        jobDiv.appendChild(jobInfoDiv);

        fieldSkeletonsConfig.forEach(skelConfig => {
            const fieldDiv = document.createElement("div");
            fieldDiv.classList.add("db-table-row-item");

            if (skelConfig.type === "brandTagOnly") {
                const skeletonTag = document.createElement("div");
                skeletonTag.classList.add("job-tag", "customer", "skeleton-element", "skeleton-tag-box");
                fieldDiv.appendChild(skeletonTag);
            } else if (skelConfig.type === "tag") {
                const skeletonTag = document.createElement("div");
                skeletonTag.classList.add("job-tag", "skeleton-element", "skeleton-tag-box");
                fieldDiv.appendChild(skeletonTag);
            } else {
                const skeletonFieldText = document.createElement("div");
                skeletonFieldText.classList.add("skeleton-element", "skeleton-text", skelConfig.classModifier || "");
                fieldDiv.appendChild(skeletonFieldText);
            }
            jobDiv.appendChild(fieldDiv);
        });
        container.appendChild(jobDiv);
    }
}

// 📄 NEU: Pagination Controls für gebuchte Jobs rendern
function renderBookedJobsPaginationControls(paginationContainerElement, currentPageNum, totalPagesNum) {
    if (!paginationContainerElement) {
        console.warn("Booked Jobs Pagination container not found.");
        return;
    }
    paginationContainerElement.innerHTML = ''; // Clear existing controls
    paginationContainerElement.style.display = totalPagesNum <= 1 ? "none" : "flex";

    if (totalPagesNum <= 1) {
        return;
    }

    async function handlePageChange_Booked(newPage) {
        const buttons = paginationContainerElement.querySelectorAll('.db-pagination-count');
        buttons.forEach(btn => btn.classList.add('disabled-loading'));
        
        currentPageBookedJobs = newPage;
        renderJobs_Booked(); // renderJobs_Booked uses global currentPageBookedJobs

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
            prevButton.textContent = "Lade...";
            await handlePageChange_Booked(currentPageNum - 1);
        });
    }
    paginationContainerElement.appendChild(prevButton);

    let startPage, endPage;
    if (totalPagesNum <= MAX_VISIBLE_PAGES_BOOKED) {
        startPage = 1;
        endPage = totalPagesNum;
    } else {
        const maxPagesBeforeCurrentPage = Math.floor(MAX_VISIBLE_PAGES_BOOKED / 2);
        const maxPagesAfterCurrentPage = Math.ceil(MAX_VISIBLE_PAGES_BOOKED / 2) - 1;
        if (currentPageNum <= maxPagesBeforeCurrentPage) {
            startPage = 1;
            endPage = MAX_VISIBLE_PAGES_BOOKED;
        } else if (currentPageNum + maxPagesAfterCurrentPage >= totalPagesNum) {
            startPage = totalPagesNum - MAX_VISIBLE_PAGES_BOOKED + 1;
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
            paginationContainerElement.querySelectorAll('.db-pagination-count:not(.ellipsis)').forEach(el => el.classList.add("disabled-loading"));
            firstPageLink.textContent = "...";
            await handlePageChange_Booked(1);
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
                paginationContainerElement.querySelectorAll('.db-pagination-count:not(.ellipsis)').forEach(el => el.classList.add("disabled-loading"));
                pageLink.textContent = "...";
                await handlePageChange_Booked(i);
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
            paginationContainerElement.querySelectorAll('.db-pagination-count:not(.ellipsis)').forEach(el => el.classList.add("disabled-loading"));
            lastPageLink.textContent = "...";
            await handlePageChange_Booked(totalPagesNum);
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
            nextButton.textContent = "Lade...";
            await handlePageChange_Booked(currentPageNum + 1);
        });
    }
    paginationContainerElement.appendChild(nextButton);
}

// 🖨️ Jobs rendern (MODIFIZIERT für Pagination)
function renderJobs_Booked() {
    const container = document.getElementById("booked-jobs-list");
    if (!container) {
        console.error(`❌ Container mit ID 'booked-jobs-list' nicht gefunden.`);
        return;
    }
    container.innerHTML = ""; // Clear previous items for the new page

    const searchTermNormalized = currentBookedJobsSearchTerm.toLowerCase().trim();
    const showContentDeadlineDone = document.getElementById("content-deadline-done")?.checked;
    const showContentDeadlineActive = document.getElementById("content-deadline-active")?.checked;
    const showScriptDeadlineDone = document.getElementById("script-deadline-done")?.checked;
    const showScriptDeadlineActive = document.getElementById("script-deadline-active")?.checked;

    let processedJobs = allBookedJobsDataGlobal;

    // 1. Nach Suchbegriff filtern
    if (searchTermNormalized) {
        processedJobs = processedJobs.filter(jobData => {
            if (!jobData || jobData.error) return false;
            const jobName = (jobData["name"] || "").toLowerCase();
            const brandName = (jobData["brand-name"] || "").toLowerCase();
            const category = (jobData["industrie-kategorie"] || "").toLowerCase();
            return jobName.includes(searchTermNormalized) ||
                brandName.includes(searchTermNormalized) ||
                category.includes(searchTermNormalized);
        });
    }

    // 2. Nach Content Deadline Status filtern
    if (showContentDeadlineDone || showContentDeadlineActive) {
        processedJobs = processedJobs.filter(jobData => {
            if (!jobData || jobData.error || !jobData["fertigstellung-content"]) {
                return false;
            }
            const contentDeadline = new Date(jobData["fertigstellung-content"]);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            contentDeadline.setHours(0, 0, 0, 0);
            const isDone = contentDeadline < now;
            if (showContentDeadlineDone && showContentDeadlineActive) return true;
            if (showContentDeadlineDone && isDone) return true;
            if (showContentDeadlineActive && !isDone) return true;
            return false;
        });
    }

    // 3. Nach Script Deadline Status filtern
    if (showScriptDeadlineDone || showScriptDeadlineActive) {
        processedJobs = processedJobs.filter(jobData => {
            if (!jobData || jobData.error || !jobData["job-scriptdeadline"]) {
                return false;
            }
            const scriptDeadline = new Date(jobData["job-scriptdeadline"]);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            scriptDeadline.setHours(0, 0, 0, 0);
            const isDone = scriptDeadline < now;

            if (showScriptDeadlineDone && showScriptDeadlineActive) return true;
            if (showScriptDeadlineDone && isDone) return true;
            if (showScriptDeadlineActive && !isDone) return true;
            return false;
        });
    }

    // 4. Sortierlogik ANWENDEN
    let sortedJobs = [...processedJobs];
    if (activeBookedJobsSortCriteria && activeBookedJobsSortCriteria.key) {
        sortedJobs.sort((a, b) => {
            const jobDataA = a; // Direct jobData object
            const jobDataB = b; // Direct jobData object
            if (!jobDataA || jobDataA.error || !jobDataB || jobDataB.error) return 0;
            let valA, valB;

            switch (activeBookedJobsSortCriteria.key) {
                case 'scriptdeadline':
                    valA = jobDataA['job-scriptdeadline'] ? new Date(jobDataA['job-scriptdeadline']) : null;
                    valB = jobDataB['job-scriptdeadline'] ? new Date(jobDataB['job-scriptdeadline']) : null;
                    if (valA === null) valA = activeBookedJobsSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
                    if (valB === null) valB = activeBookedJobsSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
                    break;
                case 'contentdeadline':
                    valA = jobDataA['fertigstellung-content'] ? new Date(jobDataA['fertigstellung-content']) : null;
                    valB = jobDataB['fertigstellung-content'] ? new Date(jobDataB['fertigstellung-content']) : null;
                    if (valA === null) valA = activeBookedJobsSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
                    if (valB === null) valB = activeBookedJobsSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
                    break;
                case 'budget':
                    valA = parseFloat(String(jobDataA['job-payment']).replace(/[^0-9.-]+/g, ""));
                    valB = parseFloat(String(jobDataB['job-payment']).replace(/[^0-9.-]+/g, ""));
                    if (isNaN(valA)) valA = activeBookedJobsSortCriteria.direction === 'asc' ? Infinity : -Infinity;
                    if (isNaN(valB)) valB = activeBookedJobsSortCriteria.direction === 'asc' ? Infinity : -Infinity;
                    break;
                default:
                    console.warn(`Unbekannter Sortierschlüssel: ${activeBookedJobsSortCriteria.key}`);
                    return 0;
            }
            let comparison = 0;
            if (valA < valB) comparison = -1;
            if (valA > valB) comparison = 1;
            return activeBookedJobsSortCriteria.direction === 'desc' ? comparison * -1 : comparison;
        });
    }

    const totalPages = Math.ceil(sortedJobs.length / JOBS_PER_PAGE_BOOKED);
    const startIndex = (currentPageBookedJobs - 1) * JOBS_PER_PAGE_BOOKED;
    const endIndex = startIndex + JOBS_PER_PAGE_BOOKED;
    const jobsToShowOnPage = sortedJobs.slice(startIndex, endIndex);

    if (jobsToShowOnPage.length === 0) {
        const noJobsMessage = document.createElement("p");
        noJobsMessage.textContent = "Es wurden keine Aufträge gefunden, die deinen Kriterien entsprechen.";
        noJobsMessage.classList.add("no-jobs-message", "job-entry", "visible");
        container.appendChild(noJobsMessage);
    } else {
        const fragment = document.createDocumentFragment();
        jobsToShowOnPage.forEach(jobData => {
            if (!jobData || jobData.error || Object.keys(jobData).length === 0) {
                console.warn("⚠️ Leere oder fehlerhafte Job-Daten (fieldData) übersprungen:", jobData);
                return;
            }
            const jobLink = document.createElement("a");
            jobLink.href = `https://www.creatorjobs.com/creator-job/${jobData.slug || jobData.id || ''}`; // Use top-level slug or id
            jobLink.target = "_blank";
            jobLink.style.textDecoration = "none";
            jobLink.style.color = "#040e1a";
            jobLink.classList.add("job-entry");

            const jobDiv = document.createElement("div");
            jobDiv.classList.add("db-table-row", "db-table-booked");

            const jobInfoDiv = document.createElement("div");
            jobInfoDiv.classList.add("db-table-row-item", "justify-left");
            const jobImage = document.createElement("img");
            jobImage.classList.add("db-table-img", "is-margin-right-12");
            jobImage.src = jobData["job-image"]?.url || jobData["job-image"] || "https://via.placeholder.com/100x60?text=Job";
            jobImage.alt = jobData["name"] || "Job Bild";
            jobInfoDiv.appendChild(jobImage);
            const jobNameSpan = document.createElement("span");
            jobNameSpan.classList.add("truncate");
            jobNameSpan.textContent = jobData["name"] || "Unbekannter Job";
            jobInfoDiv.appendChild(jobNameSpan);
            jobDiv.appendChild(jobInfoDiv);

            const brandNameDiv = document.createElement("div");
            brandNameDiv.classList.add("db-table-row-item");
            const brandTag = document.createElement("div");
            brandTag.classList.add("job-tag", "customer");
            brandTag.textContent = jobData["brand-name"] || "K.A.";
            brandNameDiv.appendChild(brandTag);
            jobDiv.appendChild(brandNameDiv);

            const jobBudget = document.createElement("div");
            jobBudget.classList.add("db-table-row-item");
            jobBudget.textContent = jobData["job-payment"] ? `${jobData["job-payment"]} €` : "K.A.";
            jobDiv.appendChild(jobBudget);

            const jobCategory = document.createElement("div");
            jobCategory.classList.add("db-table-row-item");
            jobCategory.textContent = jobData["industrie-kategorie"] || "K.A.";
            jobDiv.appendChild(jobCategory);

            const contentDeadline = calculateCountdown_Booked(jobData["fertigstellung-content"]);
            const contentDeadlineDiv = document.createElement("div");
            contentDeadlineDiv.classList.add("db-table-row-item");
            const contentTag = document.createElement("div");
            contentTag.classList.add(...contentDeadline.class.split(" "));
            const contentText = document.createElement("span");
            contentText.textContent = contentDeadline.text;
            contentTag.appendChild(contentText);
            contentDeadlineDiv.appendChild(contentTag);
            jobDiv.appendChild(contentDeadlineDiv);

            const scriptDeadline = calculateCountdown_Booked(jobData["job-scriptdeadline"]);
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
            fragment.appendChild(jobLink);
        });
        container.appendChild(fragment);
        requestAnimationFrame(() => {
            const newEntries = container.querySelectorAll(".job-entry:not(.visible)");
            newEntries.forEach(entry => { entry.classList.add("visible"); });
        });
    }

    // Render pagination controls
    const paginationContainer = document.getElementById("booked-jobs-pagination-controls-container") || createBookedJobsPaginationContainer();
    renderBookedJobsPaginationControls(paginationContainer, currentPageBookedJobs, totalPages);
}

// NEU: Helper to create pagination container for booked jobs if it doesn't exist
function createBookedJobsPaginationContainer() {
    let container = document.getElementById("booked-jobs-pagination-controls-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "booked-jobs-pagination-controls-container";
        container.className = "db-table-pagination"; // Add class for styling
        const bookedJobsList = document.getElementById("booked-jobs-list");
        if (bookedJobsList && bookedJobsList.parentNode) {
            bookedJobsList.parentNode.insertBefore(container, bookedJobsList.nextSibling);
        } else {
            document.body.appendChild(container); // Fallback
        }
    }
    return container;
}


// Event Listener für Suche, Filter und Sortierung
function setupBookedJobsEventListeners() {
    const searchInput = document.getElementById("filter-search"); // Assuming same ID for search, or use a specific one.
    const contentDeadlineDoneCheckbox = document.getElementById("content-deadline-done");
    const contentDeadlineActiveCheckbox = document.getElementById("content-deadline-active");
    const scriptDeadlineDoneCheckbox = document.getElementById("script-deadline-done");
    const scriptDeadlineActiveCheckbox = document.getElementById("script-deadline-active");


    const sortCheckboxDefinitions = [
        { id: "job-sort-script-asc", key: "scriptdeadline", direction: "asc" },
        { id: "job-sort-script-desc", key: "scriptdeadline", direction: "desc" },
        { id: "job-sort-content-asc", key: "contentdeadline", direction: "asc" },
        { id: "job-sort-content-desc", key: "contentdeadline", direction: "desc" },
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

    function handleInteraction_Booked() {
        currentPageBookedJobs = 1; // Reset to first page
        renderJobs_Booked();
    }

    if (searchInput) {
        searchInput.addEventListener("input", (event) => {
            currentBookedJobsSearchTerm = event.target.value;
            handleInteraction_Booked();
        });
    } else {
        console.warn("⚠️ Suchfeld 'filter-search' für gebuchte Jobs nicht im DOM gefunden.");
    }

    [contentDeadlineDoneCheckbox, contentDeadlineActiveCheckbox, scriptDeadlineDoneCheckbox, scriptDeadlineActiveCheckbox].forEach(cb => {
        if (cb) {
            cb.addEventListener("change", handleInteraction_Booked);
        } else {
            // console.warn is already inside the specific if-else blocks, no need to repeat here.
        }
    });
    
    if (!contentDeadlineDoneCheckbox) console.warn("⚠️ Filter-Checkbox 'content-deadline-done' nicht im DOM gefunden.");
    if (!contentDeadlineActiveCheckbox) console.warn("⚠️ Filter-Checkbox 'content-deadline-active' nicht im DOM gefunden.");
    if (!scriptDeadlineDoneCheckbox) console.warn("⚠️ Filter-Checkbox 'script-deadline-done' nicht im DOM gefunden.");
    if (!scriptDeadlineActiveCheckbox) console.warn("⚠️ Filter-Checkbox 'script-deadline-active' nicht im DOM gefunden.");


    allSortCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const targetCheckbox = event.target;
            if (targetCheckbox.checked) {
                activeBookedJobsSortCriteria = {
                    key: targetCheckbox.dataset.sortKey,
                    direction: targetCheckbox.dataset.sortDirection
                };
                allSortCheckboxes.forEach(otherCb => {
                    if (otherCb !== targetCheckbox) {
                        otherCb.checked = false;
                    }
                });
            } else {
                if (activeBookedJobsSortCriteria &&
                    activeBookedJobsSortCriteria.key === targetCheckbox.dataset.sortKey &&
                    activeBookedJobsSortCriteria.direction === targetCheckbox.dataset.sortDirection) {
                    activeBookedJobsSortCriteria = null;
                }
            }
            handleInteraction_Booked();
        });
    });

    sortCheckboxDefinitions.forEach(def => {
        if (!document.getElementById(def.id)) console.warn(`⚠️ Sortier-Checkbox '${def.id}' nicht im DOM gefunden.`);
    });
}


// 🌟 Hauptfunktion
async function displayUserJobs_Booked() {
    const containerId = "booked-jobs-list";
    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`❌ Container mit ID '${containerId}' für displayUserJobs_Booked nicht gefunden.`);
        return;
    }
    renderBookedJobsSkeletonLoader(container, SKELETON_COUNT_BOOKED);

    try {
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
        currentWebflowMemberId_Booked = member?.data?.customFields?.['webflow-member-id'];

        if (!currentWebflowMemberId_Booked) {
            console.error("❌ Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
            container.innerHTML = "";
            const errorMessage = document.createElement("p");
            errorMessage.className = "error-message job-entry visible";
            errorMessage.textContent = "Benutzerdaten konnten nicht geladen werden. Bitte überprüfe dein Profil.";
            container.appendChild(errorMessage);
            return;
        }
        console.log(`✅ Webflow Member ID gefunden: ${currentWebflowMemberId_Booked}`);

        const userItem = await fetchCollectionItem_Booked(USER_COLLECTION_ID_BOOKED, currentWebflowMemberId_Booked);
        if (!userItem || !userItem.fieldData) {
            console.error(`❌ Benutzerdaten (Item oder fieldData) für ID ${currentWebflowMemberId_Booked} nicht gefunden oder leer.`);
            container.innerHTML = "";
            const errorMessage = document.createElement("p");
            errorMessage.className = "error-message job-entry visible";
            errorMessage.textContent = "Benutzerdaten nicht gefunden oder unvollständig.";
            container.appendChild(errorMessage);
            return;
        }

        const userData = userItem.fieldData;
        const bookedJobIds = userData["booked-jobs"] || [];
        console.log(`📚 Gefundene gebuchte Job-IDs: ${bookedJobIds.join(', ')}`);

        if (bookedJobIds.length === 0) {
            allBookedJobsDataGlobal = [];
            currentPageBookedJobs = 1; // Reset current page
            renderJobs_Booked(); // Will show no jobs message and handle pagination
            // setupBookedJobsEventListeners(); // Already called at DOMContentLoaded
            const paginationContainer = document.getElementById("booked-jobs-pagination-controls-container") || createBookedJobsPaginationContainer();
            paginationContainer.innerHTML = ""; // Clear pagination if no jobs
            return;
        }

        const bookedJobsFieldDataPromises = bookedJobIds.map(jobId => fetchJobData_Booked(jobId));
        const bookedJobsFieldDataResults = await Promise.all(bookedJobsFieldDataPromises);
        
        // Filter out jobs that had errors or are empty, directly modify allBookedJobsDataGlobal
        allBookedJobsDataGlobal = bookedJobsFieldDataResults.filter(fieldData => {
            return fieldData && !fieldData.error && Object.keys(fieldData).length > 2; // Check for more than just id/error/message keys
        });
        console.log(`📊 ${allBookedJobsDataGlobal.length} valide Job-fieldData zum Rendern.`);

        currentPageBookedJobs = 1; // Reset current page before rendering
        renderJobs_Booked();
        // setupBookedJobsEventListeners(); // Already called at DOMContentLoaded

    } catch (error) {
        console.error("❌ Schwerwiegender Fehler beim Laden der Jobs:", error);
        if (container) {
            container.innerHTML = "";
            const errorMessage = document.createElement("p");
            errorMessage.className = "error-message job-entry visible";
            errorMessage.textContent = `Ein Fehler ist aufgetreten: ${error.message}. Bitte versuche es später erneut.`;
            container.appendChild(errorMessage);
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    displayUserJobs_Booked(); // Changed to the specific main function for this script
    setupBookedJobsEventListeners();
    createBookedJobsPaginationContainer(); // Ensure container exists
});

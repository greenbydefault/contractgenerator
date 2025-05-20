// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL_MJ = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL_MJ = "https://meine-kampagnen.oliver-258.workers.dev/";
const JOB_COLLECTION_ID_MJ = "6448faf9c5a8a17455c05525"; // Deine Job Collection ID
const USER_COLLECTION_ID_MJ = "6448faf9c5a8a15f6cc05526"; // Deine User Collection ID (für den eingeloggten User und Bewerber)
const SKELETON_JOBS_COUNT_MJ = 3;
const API_CALL_DELAY_MS = 5; 
let currentApplicantPageSize = 15; // Standard-Seitengröße, später anpassbar

let currentWebflowMemberId_MJ = null;
let allMyJobsData_MJ = []; // Speichert die geladenen Job-Items
let preloadedApplicantData = {}; // Cache für vorgeladene Bewerberseiten { jobId: { pageNum: [items] } }
let activePreloading = {}; // Verhindert mehrfaches Preloading derselben Seite { jobId_pageNum: boolean }


// --- Mapping-Konfigurationen ---
const MAPPINGS = {
    followerRanges: {
        "4b742e0670e6172d81112005c1be62c0": "0 - 2.500",
        "b07d2c7b0cdc43e2c496bb3aa798f672": "2.500 - 5.000",
        "f3ecc03ef887ee305600d3c0342836d7": "5.000 - 10.000",
        "251f07f2aa5a2c7ab22bf1ad6dd29688": "10.000 - 25.000",
        "92f7d061cb8be70f6ffe29992e313f30": "25.000 - 50.000",
        "ce3977740d475283d1e1fc1410ffef3c": "50.000 - 100.000",
        "d279846f40353aa3cffc22ee2d8ea564": "100.000 - 250.000",
        "cc74dfe0b4fe308ac66e11ba55419501": "250.000 - 500.000",
        "24bdb369f9cdb37e28678b8d1fba0308": "500.000 - 1.000.000",
        "0f579a02ba3055cf32347301e34ce262": "1.000.000+",
        "126e325d19f997cd4158ebd2f6bc43c8": "0"
    },
    bundeslaender: {
        "ad69af181ec0a76ead7ca0808f9322d5": "Baden-Württemberg",
        "4ed09f2799f39cd4458f3e590563b0a7": "Bayern",
        "8c1ff8264b84de6bbffd30ff9e315c44": "Berlin",
        "76951a563940804aa945c925a4eaa52c": "Brandenburg",
        "e2dd8f0b080138d125c58421c45e9060": "Bremen",
        "e1eb8fe3d24f911f99395fad2d0c84f9": "Hamburg",
        "17f378f66aeb54c4f513f3e1d94a8885": "Hessen",
        "e5f9b206a121c4d3ded9fd18258fb76a": "Mecklenburg-Vorpommern",
        "5069427f38715209276132e26184ee1d": "Niedersachsen",
        "54f3ea7a90d2bc63ec97195e2de1a3a3": "Nordrhein-Westfalen",
        "b3801d7ef0176c308a5115b0a9307a5f": "Rheinland-Pfalz",
        "42b8ac1c54146db14db5f11c20af1d23": "Saarland",
        "ab6c9a1c2a60464b33d02c3097d648ca": "Sachsen",
        "ab852edb71d3280bfe41083c793a4961": "Sachsen-Anhalt",
        "d44e3e9bad2c19f3502da1c8d5832311": "Schleswig-Holstein",
        "070d97b7c9dd6ee1e87625e64029b1f2": "Thüringen"
    },
    laender: {
        "ff0fb336a4f4329e373519e2f4f146d0": "Deutschland",
        "f6cdc4f895b295eda5035ecde8a638bc": "Schweiz",
        "4e353955e21323d2805e89a1b5d2f0ed": "Österreich"
    },
    altersgruppen: {
        "c9ae1533c4edb215bc978af50ead8e11": "18 - 24",
        "f4bd16f836e299f51469985cffb7bebc": "25 - 35",
        "d20369fd239006b5f3eda9dbb532cb60": "36 - 50",
        "5744f42d22c8da504632912511a80667": "50+",
        "d8e4582c524ded37c12c2bd414ac4287": "Keine Angabe"
    },
    creatorTypen: {
        "ad1b8266d488daebad7c20c21ffa75c9": "UGC Creator",
        "126c5ed961ae4a5a100ec61f98bb0413": "Content Creator",
        "e2e05ef792fcc0e7e889945a53108133": "Influencer",
        "ee3384b6b32fb943768222af908ed2c3": "Model",
        "04dcb25068e192ec3ae1571d8bab7def": "Fotograf",
        "48e29cee99112e44c5d7cd505e9f2442": "Videograf",
        "29ad386dd5d90248db0ff689bbbbf68d": "Keine Angabe"
    },
    sprachen: {
        "1c8e60afd27397cecf0172584d642461": "Deutsch",
        "c80924ee660d3514aae61540d9b3d114": "Englisch"
    }
};

// --- Hilfsfunktionen ---
function buildWorkerUrl_MJ(apiUrl) {
    const baseUrl = WORKER_BASE_URL_MJ.endsWith('/') ? WORKER_BASE_URL_MJ : WORKER_BASE_URL_MJ + '/';
    return `${baseUrl}?url=${encodeURIComponent(apiUrl)}`;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeUrl(url) {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `https://${url}`;
}

async function fetchWebflowItem(collectionId, itemId) {
    if (!itemId) {
        console.warn(`Ungültige Item-ID für Collection ${collectionId} übergeben.`);
        return null; 
    }
    const apiUrl = `${API_BASE_URL_MJ}/${collectionId}/items/${itemId}/live`;
    const workerUrl = buildWorkerUrl_MJ(apiUrl);
    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            if (response.status === 404) {
                return { id: itemId, error: true, status: 404, message: `Item ${itemId} not found.` };
            }
            const errorText = await response.text();
            console.error(`API-Fehler beim Abrufen von Item ${itemId} aus Collection ${collectionId}: ${response.status} - ${errorText}`);
            if (response.status === 429) {
                console.warn(`Rate limit getroffen bei Item ${itemId}.`);
                return { error: true, status: 429, message: "Too Many Requests for item " + itemId, id: itemId };
            }
            return { id: itemId, error: true, status: response.status, message: `API Error for item ${itemId}: ${errorText}` };
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ Netzwerkfehler oder anderer Fehler beim Abrufen des Items (${collectionId}/${itemId}): ${error.message}`);
        return { id: itemId, error: true, status: 'network_error', message: `Network error for item ${itemId}: ${error.message}` };
    }
}

// --- Skeleton Loader ---
function renderMyJobsSkeletonLoader(container, count) {
    container.innerHTML = "";
    for (let i = 0; i < count; i++) {
        const jobWrapper = document.createElement("div");
        jobWrapper.classList.add("my-job-item-skeleton", "skeleton-row", "job-entry");
        const jobHeader = document.createElement("div");
        jobHeader.classList.add("db-table-row", "db-table-my-job");
        const jobNameDiv = document.createElement("div");
        jobNameDiv.classList.add("db-table-row-item", "justify-left");
        const skeletonJobImage = document.createElement("div");
        skeletonJobImage.classList.add("db-table-img", "is-margin-right-12", "skeleton-element", "skeleton-image");
        jobNameDiv.appendChild(skeletonJobImage);
        const skeletonJobName = document.createElement("div");
        skeletonJobName.classList.add("truncate", "skeleton-element", "skeleton-text", "skeleton-text-title");
        jobNameDiv.appendChild(skeletonJobName);
        jobHeader.appendChild(jobNameDiv);
        const paymentDiv = document.createElement("div");
        paymentDiv.classList.add("db-table-row-item");
        const skeletonPayment = document.createElement("div");
        skeletonPayment.classList.add("skeleton-element", "skeleton-text", "skeleton-text-short");
        paymentDiv.appendChild(skeletonPayment);
        jobHeader.appendChild(paymentDiv);
        const placeholder1 = document.createElement("div"); 
        placeholder1.classList.add("db-table-row-item");
        const skeletonText1 = document.createElement("div");
        skeletonText1.classList.add("skeleton-element", "skeleton-text", "skeleton-text-medium");
        placeholder1.appendChild(skeletonText1);
        jobHeader.appendChild(placeholder1);
        const placeholder2 = document.createElement("div"); 
        placeholder2.classList.add("db-table-row-item");
        const skeletonText2 = document.createElement("div");
        skeletonText2.classList.add("skeleton-element", "skeleton-text", "skeleton-text-short");
        placeholder2.appendChild(skeletonText2);
        jobHeader.appendChild(placeholder2);
        const categoryDiv = document.createElement("div");
        categoryDiv.classList.add("db-table-row-item");
        const skeletonCategory = document.createElement("div");
        skeletonCategory.classList.add("skeleton-element", "skeleton-text", "skeleton-text-medium");
        categoryDiv.appendChild(skeletonCategory);
        jobHeader.appendChild(categoryDiv);
        const statusDiv = document.createElement("div");
        statusDiv.classList.add("db-table-row-item");
        const skeletonStatusTag = document.createElement("div");
        skeletonStatusTag.classList.add("job-tag", "skeleton-element", "skeleton-tag-box");
        statusDiv.appendChild(skeletonStatusTag);
        jobHeader.appendChild(statusDiv);
        const applicantsCountDiv = document.createElement("div");
        applicantsCountDiv.classList.add("db-table-row-item");
        const skeletonApplicantsCount = document.createElement("div");
        skeletonApplicantsCount.classList.add("skeleton-element", "skeleton-text", "skeleton-text-short");
        applicantsCountDiv.appendChild(skeletonApplicantsCount);
        jobHeader.appendChild(applicantsCountDiv);
        jobWrapper.appendChild(jobHeader);
        const skeletonPaginationRow = document.createElement("div");
        skeletonPaginationRow.classList.add("applicants-toggle-row-skeleton", "skeleton-element"); 
        skeletonPaginationRow.style.height = "30px"; 
        skeletonPaginationRow.style.width = "200px"; 
        skeletonPaginationRow.style.margin = "10px auto";
        jobWrapper.appendChild(skeletonPaginationRow);
        container.appendChild(jobWrapper);
    }
}

// --- Rendering-Funktionen ---
function createApplicantRowElement(applicantFieldData) {
    const applicantDiv = document.createElement("div");
    applicantDiv.classList.add("db-table-row", "db-table-applicant", "job-entry");

    applicantDiv.addEventListener('click', (event) => {
        if (event.target.closest('a.db-application-option')) {
            return;
        }
        const slug = applicantFieldData.slug;
        if (slug) {
            const profileUrl = `https://www.creatorjobs.com/members/${slug}`;
            window.open(profileUrl, '_blank');
        } else {
            console.warn("Kein Slug für Bewerber gefunden, kann Profil nicht öffnen:", applicantFieldData.name);
        }
    });

    if (typeof MAPPINGS === 'undefined') {
        console.error("❌ MAPPINGS-Objekt ist nicht definiert.");
        const errorDiv = document.createElement("div");
        errorDiv.textContent = "Fehler: Mapping-Daten nicht verfügbar.";
        applicantDiv.appendChild(errorDiv);
        return applicantDiv;
    }

    const profileInfoDiv = document.createElement("div");
    profileInfoDiv.classList.add("db-table-row-item", "justify-left");

    const profileImageField = applicantFieldData["image-thumbnail-small-92px"] || applicantFieldData["user-profile-img"];
    if (profileImageField) {
        const applicantImg = document.createElement("img");
        applicantImg.classList.add("db-table-img", "is-margin-right-12");
        applicantImg.src = typeof profileImageField === 'string' ? profileImageField : profileImageField?.url;
        applicantImg.alt = applicantFieldData.name || "Bewerberbild";
        profileInfoDiv.appendChild(applicantImg);
    }

    const namePlusStatusDiv = document.createElement("div");
    namePlusStatusDiv.classList.add("is-flexbox-vertical");
    const nameSpan = document.createElement("span");
    nameSpan.textContent = applicantFieldData.name || "Unbekannter Bewerber";
    nameSpan.classList.add("truncate");
    namePlusStatusDiv.appendChild(nameSpan);
    const plusStatusSpan = document.createElement("span");
    plusStatusSpan.classList.add("is-txt-tiny");
    plusStatusSpan.textContent = applicantFieldData["plus-mitglied"] ? "Plus Mitglied" : "Standard";
    namePlusStatusDiv.appendChild(plusStatusSpan);
    profileInfoDiv.appendChild(namePlusStatusDiv);
    applicantDiv.appendChild(profileInfoDiv);

    const locationDiv = document.createElement("div");
    locationDiv.classList.add("db-table-row-item");
    const city = applicantFieldData["user-city-2"] || "K.A.";
    const bundeslandId = applicantFieldData["bundesland-option"];
    const bundeslandName = MAPPINGS.bundeslaender[bundeslandId] || (bundeslandId ? bundeslandId : "K.A.");
    locationDiv.textContent = `${city}${bundeslandName !== "K.A." ? `, ${bundeslandName}` : ""}`;
    applicantDiv.appendChild(locationDiv);

    const categoryCell = document.createElement("div");
    categoryCell.classList.add("db-table-row-item");
    const categoryTag = document.createElement("span");
    categoryTag.classList.add("job-tag", "customer");
    categoryTag.textContent = applicantFieldData["creator-main-categorie"] || "K.A.";
    categoryCell.appendChild(categoryTag);
    applicantDiv.appendChild(categoryCell);

    const creatorTypeCell = document.createElement("div");
    creatorTypeCell.classList.add("db-table-row-item");
    const creatorTypeTag = document.createElement("span");
    creatorTypeTag.classList.add("job-tag", "customer");
    const creatorTypeId = applicantFieldData["creator-type"];
    creatorTypeTag.textContent = MAPPINGS.creatorTypen[creatorTypeId] || (creatorTypeId ? creatorTypeId : "K.A.");
    creatorTypeCell.appendChild(creatorTypeTag);
    applicantDiv.appendChild(creatorTypeCell);

    const socialCell = document.createElement("div");
    socialCell.classList.add("db-table-row-item");
    const socialPlatforms = [
        { key: "instagram", name: "Instagram", iconUrl: "https://cdn.prod.website-files.com/63db7d558cd2e4be56cd7e2f/640219e8d979b71d2a7e5db3_Instagram.svg" },
        { key: "tiktok", name: "TikTok", iconUrl: "https://cdn.prod.website-files.com/63db7d558cd2e4be56cd7e2f/640219e99dce86c2b6ba83fe_Tiktok.svg" },
        { key: "youtube", name: "YouTube", iconUrl: "https://cdn.prod.website-files.com/63db7d558cd2e4be56cd7e2f/640219e9b00d0480ffe289dc_YouTube.svg" }
    ];
    socialPlatforms.forEach(platform => {
        const platformUrlValue = applicantFieldData[platform.key];
        const normalizedPlatformUrl = normalizeUrl(platformUrlValue);
        if (normalizedPlatformUrl) {
            const socialLink = document.createElement("a");
            socialLink.href = normalizedPlatformUrl;
            socialLink.classList.add("db-application-option", "no-icon", "w-inline-block");
            socialLink.target = "_blank";
            socialLink.rel = "noopener noreferrer";
            const iconImg = document.createElement("img");
            iconImg.src = platform.iconUrl;
            iconImg.alt = `${platform.name} Profil`;
            iconImg.classList.add("db-icon-18");
            socialLink.appendChild(iconImg);
            socialCell.appendChild(socialLink);
        }
    });
    applicantDiv.appendChild(socialCell);

    const followerCell = document.createElement("div");
    followerCell.classList.add("db-table-row-item");
    const followerTag = document.createElement("span");
    followerTag.classList.add("job-tag", "customer");
    const followerId = applicantFieldData["creator-follower"];
    followerTag.textContent = MAPPINGS.followerRanges[followerId] || (followerId ? followerId : "K.A.");
    followerCell.appendChild(followerTag);
    applicantDiv.appendChild(followerCell);

    const ageCell = document.createElement("div");
    ageCell.classList.add("db-table-row-item");
    const ageTag = document.createElement("span");
    ageTag.classList.add("job-tag", "customer");
    const ageId = applicantFieldData["creator-age"];
    ageTag.textContent = MAPPINGS.altersgruppen[ageId] || (ageId ? ageId : "K.A.");
    ageCell.appendChild(ageTag);
    applicantDiv.appendChild(ageCell);

    return applicantDiv;
}

function createApplicantTableHeaderElement() {
    const headerDiv = document.createElement("div");
    headerDiv.classList.add("db-table-header", "db-table-applicant"); // Deine Hauptklassen

    const columns = ["Creator", "Location", "Kategorie", "Creator Type", "Social Media", "Follower", "Alter"];
    columns.forEach(colText => {
        const colDiv = document.createElement("div");
        colDiv.classList.add("db-table-row-item", "is-txt-16", "is-txt-bold"); // Deine Spaltenklassen
        colDiv.textContent = colText;
        headerDiv.appendChild(colDiv);
    });
    return headerDiv;
}


async function renderPaginationControls(jobId, allApplicantIdsForThisJob, applicantsContentElement, paginationWrapper, currentPage, totalPages) {
    if (!paginationWrapper) {
        return;
    }
    paginationWrapper.innerHTML = ''; 
    paginationWrapper.style.display = totalPages <= 1 ? "none" : "flex"; 

    if (totalPages <= 1) {
        return;
    }

    const prevButton = document.createElement("a");
    prevButton.href = "#"; 
    prevButton.classList.add("db-pagination-count", "button-prev"); 
    prevButton.textContent = "Zurück";
    if (currentPage === 1) {
        prevButton.classList.add("disabled"); 
    } else {
        prevButton.addEventListener("click", async (e) => {
            e.preventDefault();
            if (prevButton.classList.contains("disabled-loading")) return;
            prevButton.classList.add("disabled-loading");
            prevButton.textContent = "Lade...";
            await loadAndDisplayApplicantsForJob(jobId, allApplicantIdsForThisJob, applicantsContentElement.parentElement, paginationWrapper, currentPage - 1, true);
        });
    }
    paginationWrapper.appendChild(prevButton);

    const MAX_VISIBLE_PAGES = 5; 
    let startPage, endPage;

    if (totalPages <= MAX_VISIBLE_PAGES) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const maxPagesBeforeCurrentPage = Math.floor(MAX_VISIBLE_PAGES / 2);
        const maxPagesAfterCurrentPage = Math.ceil(MAX_VISIBLE_PAGES / 2) - 1;
        if (currentPage <= maxPagesBeforeCurrentPage) {
            startPage = 1;
            endPage = MAX_VISIBLE_PAGES;
        } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
            startPage = totalPages - MAX_VISIBLE_PAGES + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrentPage;
            endPage = currentPage + maxPagesAfterCurrentPage;
        }
    }

    if (startPage > 1) {
        const firstPageLink = document.createElement("a");
        firstPageLink.href = "#";
        firstPageLink.classList.add("db-pagination-count");
        firstPageLink.textContent = "1";
        firstPageLink.addEventListener("click", async (e) => {
            e.preventDefault();
            if (firstPageLink.classList.contains("disabled-loading") || firstPageLink.classList.contains("current")) return;
            paginationWrapper.querySelectorAll('.db-pagination-count').forEach(el => el.classList.add("disabled-loading"));
            firstPageLink.textContent = "..."; 
            await loadAndDisplayApplicantsForJob(jobId, allApplicantIdsForThisJob, applicantsContentElement.parentElement, paginationWrapper, 1, true);
        });
        paginationWrapper.appendChild(firstPageLink);
        if (startPage > 2) {
            const ellipsisSpan = document.createElement("span");
            ellipsisSpan.classList.add("db-pagination-count", "ellipsis"); 
            ellipsisSpan.textContent = "...";
            paginationWrapper.appendChild(ellipsisSpan);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLink = document.createElement("a");
        pageLink.href = "#";
        pageLink.classList.add("db-pagination-count");
        pageLink.textContent = i;
        if (i === currentPage) {
            pageLink.classList.add("current"); // Geänderte Klasse
        } else {
            pageLink.addEventListener("click", async (e) => {
                e.preventDefault();
                if (pageLink.classList.contains("disabled-loading")) return;
                paginationWrapper.querySelectorAll('.db-pagination-count').forEach(el => el.classList.add("disabled-loading"));
                pageLink.textContent = "..."; 
                await loadAndDisplayApplicantsForJob(jobId, allApplicantIdsForThisJob, applicantsContentElement.parentElement, paginationWrapper, i, true);
            });
        }
        paginationWrapper.appendChild(pageLink);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsisSpan = document.createElement("span");
            ellipsisSpan.classList.add("db-pagination-count", "ellipsis");
            ellipsisSpan.textContent = "...";
            paginationWrapper.appendChild(ellipsisSpan);
        }
        const lastPageLink = document.createElement("a");
        lastPageLink.href = "#";
        lastPageLink.classList.add("db-pagination-count");
        lastPageLink.textContent = totalPages;
        lastPageLink.addEventListener("click", async (e) => {
            e.preventDefault();
             if (lastPageLink.classList.contains("disabled-loading") || lastPageLink.classList.contains("current")) return;
            paginationWrapper.querySelectorAll('.db-pagination-count').forEach(el => el.classList.add("disabled-loading"));
            lastPageLink.textContent = "...";
            await loadAndDisplayApplicantsForJob(jobId, allApplicantIdsForThisJob, applicantsContentElement.parentElement, paginationWrapper, totalPages, true);
        });
        paginationWrapper.appendChild(lastPageLink);
    }

    const nextButton = document.createElement("a");
    nextButton.href = "#";
    nextButton.classList.add("db-pagination-count", "button-next"); 
    nextButton.textContent = "Weiter";
    if (currentPage === totalPages) {
        nextButton.classList.add("disabled");
    } else {
        nextButton.addEventListener("click", async (e) => {
            e.preventDefault();
            if (nextButton.classList.contains("disabled-loading")) return;
            nextButton.classList.add("disabled-loading");
            nextButton.textContent = "Lade...";
            await loadAndDisplayApplicantsForJob(jobId, allApplicantIdsForThisJob, applicantsContentElement.parentElement, paginationWrapper, currentPage + 1, true);
        });
    }
    paginationWrapper.appendChild(nextButton);
}

async function initiatePreloadForNextPage(jobId, allApplicantIdsForThisJob, currentPage, totalPages, paginationWrapper) {
    const nextPageToPreload = currentPage + 1;
    if (nextPageToPreload > totalPages) return; 

    const preloadKey = `${jobId}_${nextPageToPreload}`;
    if (preloadedApplicantData[jobId]?.[nextPageToPreload] || activePreloading[preloadKey]) {
        return;
    }

    activePreloading[preloadKey] = true;
    console.log(`DEBUG: Starte Preload für Job ${jobId}, Seite ${nextPageToPreload}`);

    try {
        await delay(API_CALL_DELAY_MS * 1.5); 

        const offset = (nextPageToPreload - 1) * currentApplicantPageSize;
        const idsToFetch = allApplicantIdsForThisJob.slice(offset, offset + currentApplicantPageSize);
        
        if (idsToFetch.length > 0) {
            const applicantPromises = idsToFetch.map(applicantId =>
                fetchWebflowItem(USER_COLLECTION_ID_MJ, applicantId)
            );
            const preloadedItems = await Promise.all(applicantPromises);

            if (!preloadedApplicantData[jobId]) {
                preloadedApplicantData[jobId] = {};
            }
            preloadedApplicantData[jobId][nextPageToPreload] = preloadedItems;
            console.log(`DEBUG: Preload ERFOLGREICH für Job ${jobId}, Seite ${nextPageToPreload}. ${preloadedItems.length} Items geladen.`);
        }
    } catch (error) {
        console.error(`DEBUG: Preload FEHLER für Job ${jobId}, Seite ${nextPageToPreload}:`, error);
    } finally {
        delete activePreloading[preloadKey];
    }
}


async function loadAndDisplayApplicantsForJob(jobId, allApplicantIdsForThisJob, applicantsListContainer, paginationWrapper, pageNumber = 1, isTriggeredByPagination = false) {
    console.log(`DEBUG: loadAndDisplayApplicantsForJob START - Job ID: ${jobId}, Page: ${pageNumber}, PageSize: ${currentApplicantPageSize}, TriggeredByPagination: ${isTriggeredByPagination}`);
    
    const mainToggleButton = document.querySelector(`.my-job-item[data-job-id="${jobId}"] .db-table-applicants`);
    if (mainToggleButton) mainToggleButton.style.pointerEvents = 'none';

    if (isTriggeredByPagination) {
        await delay(API_CALL_DELAY_MS);
    }
    
    // Finde oder erstelle den Container für die eigentlichen Bewerberzeilen
    let applicantsContentElement = applicantsListContainer.querySelector(".actual-applicants-content");
    if (!applicantsContentElement) {
        // Füge den Header hinzu, falls er noch nicht da ist (nur beim allerersten Laden für diesen Job-Container)
        if (!applicantsListContainer.querySelector(".db-table-header.db-table-applicant")) {
            const headerElement = createApplicantTableHeaderElement();
            applicantsListContainer.insertBefore(headerElement, applicantsListContainer.firstChild);
        }
        applicantsContentElement = document.createElement("div");
        applicantsContentElement.classList.add("actual-applicants-content");
        applicantsListContainer.appendChild(applicantsContentElement);
    }
    
    applicantsContentElement.innerHTML = ''; // Nur den Inhaltsbereich leeren
    applicantsListContainer.dataset.currentPage = pageNumber;


    const loadingMessage = document.createElement("p");
    loadingMessage.classList.add("applicants-message");
    loadingMessage.textContent = `Lade Bewerber (Seite ${pageNumber})...`;
    applicantsContentElement.appendChild(loadingMessage);

    let fetchedApplicantsDetails = [];
    const totalPages = Math.ceil(allApplicantIdsForThisJob.length / currentApplicantPageSize);

    if (preloadedApplicantData[jobId]?.[pageNumber]) {
        console.log(`DEBUG: Nutze vorgeladene Daten für Job ${jobId}, Seite ${pageNumber}`);
        fetchedApplicantsDetails = preloadedApplicantData[jobId][pageNumber];
        delete preloadedApplicantData[jobId][pageNumber]; 
    } else {
        const offset = (pageNumber - 1) * currentApplicantPageSize;
        const idsToFetch = allApplicantIdsForThisJob.slice(offset, offset + currentApplicantPageSize);

        if (idsToFetch.length > 0) {
            console.log(`DEBUG: Lade Seite ${pageNumber} für Job ${jobId}. Offset: ${offset}, Anzahl: ${idsToFetch.length}. IDs: ${idsToFetch.join(', ')}`);
            const applicantPromises = idsToFetch.map(applicantId =>
                fetchWebflowItem(USER_COLLECTION_ID_MJ, applicantId)
            );
            // Kurze Verzögerung vor dem Promise.all, um die API nicht sofort mit allen Anfragen zu überfluten,
            // falls es das erste Laden der Seite ist (nicht aus Preload).
            if (!isTriggeredByPagination && pageNumber === 1) await delay(100); 
            fetchedApplicantsDetails = await Promise.all(applicantPromises);
        }
    }
    
    loadingMessage.remove(); 

    // Sortierung nach Plus-Mitgliedern zuerst, dann nach Standardkriterien (z.B. Name oder Ladedatum)
    fetchedApplicantsDetails.sort((a, b) => {
        // Fehlerobjekte ans Ende
        if (a.error && !b.error) return 1;
        if (!a.error && b.error) return -1;
        if (a.error && b.error) return 0;

        // Gültige fieldData Objekte
        if (!a.fieldData && b.fieldData) return 1;
        if (a.fieldData && !b.fieldData) return -1;
        if (!a.fieldData && !b.fieldData) return 0;


        const aIsPlus = a.fieldData["plus-mitglied"] === true;
        const bIsPlus = b.fieldData["plus-mitglied"] === true;

        if (aIsPlus && !bIsPlus) return -1;
        if (!aIsPlus && bIsPlus) return 1;
        
        // Optionale Sekundärsortierung, z.B. nach Name
        // const nameA = a.fieldData.name || '';
        // const nameB = b.fieldData.name || '';
        // return nameA.localeCompare(nameB);
        return 0; // Beibehaltung der Reihenfolge, wenn Plus-Status gleich ist
    });
    
    let validApplicantsRenderedOnThisPage = 0;
    fetchedApplicantsDetails.forEach(applicant => {
        if (applicant && applicant.fieldData && !applicant.error) {
            const applicantRow = createApplicantRowElement(applicant.fieldData);
            applicantsContentElement.appendChild(applicantRow);
            requestAnimationFrame(() => { 
                applicantRow.style.opacity = "0"; 
                requestAnimationFrame(() => {
                    applicantRow.style.transition = "opacity 0.3s ease-in-out";
                    applicantRow.style.opacity = "1";
                });
            });
            validApplicantsRenderedOnThisPage++;
        } else if (applicant && applicant.error) {
            const errorMsg = document.createElement("p");
            errorMsg.classList.add("applicants-message");
            if (applicant.status === 429) {
                errorMsg.textContent = `Bewerberdaten (ID: ${applicant.id}) konnten wegen API-Limits nicht geladen werden.`;
            } else if (applicant.status === 404) {
                errorMsg.textContent = `Bewerber (ID: ${applicant.id}) wurde nicht gefunden.`;
            } else {
                errorMsg.textContent = applicant.message || `Daten für Bewerber ${applicant.id || 'unbekannt'} konnten nicht geladen werden.`;
            }
            applicantsContentElement.appendChild(errorMsg);
        }
    });
    
    console.log(`DEBUG: Job ${jobId}, Seite ${pageNumber}: ${validApplicantsRenderedOnThisPage} Bewerber gerendert.`);

    if (validApplicantsRenderedOnThisPage === 0 && allApplicantIdsForThisJob.length > 0 && fetchedApplicantsDetails.length > 0) {
        const noDataMsg = document.createElement("p");
        noDataMsg.classList.add("applicants-message");
        noDataMsg.textContent = "Keine gültigen Bewerberdaten für diese Seite gefunden.";
        applicantsContentElement.appendChild(noDataMsg);
    } else if (allApplicantIdsForThisJob.length === 0) {
        const noApplicantsMsg = document.createElement("p");
        noApplicantsMsg.classList.add("applicants-message");
        noApplicantsMsg.textContent = "Für diesen Job liegen keine Bewerbungen vor.";
        applicantsContentElement.appendChild(noApplicantsMsg);
         // Paginierung ausblenden, wenn keine Bewerber vorhanden sind
        if(paginationWrapper) paginationWrapper.style.display = "none";
    }
    
    await renderPaginationControls(jobId, allApplicantIdsForThisJob, applicantsContentElement, paginationWrapper, pageNumber, totalPages);
    
    if (mainToggleButton) mainToggleButton.style.pointerEvents = 'auto'; 
    applicantsListContainer.dataset.initialPageLoaded = 'true';

    if (validApplicantsRenderedOnThisPage > 0 || (allApplicantIdsForThisJob.length > 0 && fetchedApplicantsDetails.length === 0 && validApplicantsRenderedOnThisPage === 0) ) { 
        initiatePreloadForNextPage(jobId, allApplicantIdsForThisJob, pageNumber, totalPages, paginationWrapper);
    }
}


function renderMyJobsAndApplicants(jobItems) {
    const container = document.getElementById("jobs-list");
    if (!container) {
        console.error("❌ Container 'jobs-list' nicht gefunden.");
        return;
    }
    container.innerHTML = "";

    if (jobItems.length === 0) {
        const noJobsMsg = document.createElement("p");
        noJobsMsg.textContent = "Du hast noch keine Jobs erstellt oder es wurden keine Jobs gefunden.";
        noJobsMsg.classList.add("job-entry", "visible");
        container.appendChild(noJobsMsg);
        return;
    }

    const fragment = document.createDocumentFragment();
    let globalRateLimitMessageShown = false;

    jobItems.forEach(jobItem => {
        if (jobItem.error && jobItem.status === 429) { 
            console.warn(`Job (ID: ${jobItem.id || 'unbekannt'}) konnte wegen Rate Limit nicht geladen werden und wird nicht gerendert.`);
            if (!globalRateLimitMessageShown && !document.getElementById('global-rate-limit-message')) {
                const globalRateLimitInfo = document.createElement("p");
                globalRateLimitInfo.id = 'global-rate-limit-message';
                globalRateLimitInfo.textContent = "Hinweis: Einige Jobdaten konnten aufgrund von API-Anfragelimits nicht geladen werden.";
                globalRateLimitInfo.classList.add("job-entry", "visible", "error-message"); 
                if (container.firstChild) container.insertBefore(globalRateLimitInfo, container.firstChild);
                else container.appendChild(globalRateLimitInfo);
                globalRateLimitMessageShown = true;
            }
            return; 
        }
        
        if (jobItem.error) { 
             console.warn(`Job (ID: ${jobItem.id || 'unbekannt'}) konnte nicht geladen werden: ${jobItem.message}. Er wird nicht gerendert.`);
             return; 
        }

        const jobFieldData = jobItem.fieldData;
        if (!jobFieldData) {
            console.warn("Job-Item ohne fieldData übersprungen:", jobItem);
            return;
        }

        const jobWrapper = document.createElement("div");
        jobWrapper.classList.add("my-job-item", "job-entry");
        jobWrapper.dataset.jobId = jobItem.id; 

        const jobHeaderDiv = document.createElement("div");
        jobHeaderDiv.classList.add("db-table-row", "db-table-my-job");
        
        const jobInfoDataCell = document.createElement("div");
        jobInfoDataCell.classList.add("db-table-row-item", "justify-left");
        if (jobFieldData["job-image"]?.url || jobFieldData["job-image"]) {
            const jobImg = document.createElement("img");
            jobImg.classList.add("db-table-img", "is-margin-right-12");
            jobImg.src = jobFieldData["job-image"].url || jobFieldData["job-image"];
            jobImg.alt = jobFieldData.name || "Job Bild";
            jobInfoDataCell.appendChild(jobImg);
        }
        const jobNameSpan = document.createElement("span");
        jobNameSpan.classList.add("truncate");
        jobNameSpan.textContent = jobFieldData.name || "Unbenannter Job";
        jobInfoDataCell.appendChild(jobNameSpan);
        jobHeaderDiv.appendChild(jobInfoDataCell);

        const paymentCell = document.createElement("div");
        paymentCell.classList.add("db-table-row-item");
        paymentCell.textContent = jobFieldData["job-payment"] ? `${jobFieldData["job-payment"]} €` : "K.A.";
        jobHeaderDiv.appendChild(paymentCell);

        const categoryCell = document.createElement("div");
        categoryCell.classList.add("db-table-row-item");
        categoryCell.textContent = jobFieldData["industrie-kategorie"] || "K.A.";
        jobHeaderDiv.appendChild(categoryCell);

        const statusCell = document.createElement("div");
        statusCell.classList.add("db-table-row-item");
        const statusTag = document.createElement("div");
        statusTag.classList.add("job-tag");
        statusTag.textContent = jobFieldData["job-status"] || "Unbekannt";
        if (jobFieldData["job-status"] === "Aktiv") statusTag.classList.add("is-bg-light-green");
        if (jobFieldData["job-status"] === "Beendet") statusTag.classList.add("is-bg-light-red");
        statusCell.appendChild(statusTag);
        jobHeaderDiv.appendChild(statusCell);

        const applicantIdsForThisSpecificJob = jobFieldData["bewerber"] || [];
        const applicantsCountCell = document.createElement("div");
        applicantsCountCell.classList.add("db-table-row-item");
        applicantsCountCell.textContent = `Bewerber: ${applicantIdsForThisSpecificJob.length}`;
        jobHeaderDiv.appendChild(applicantsCountCell);

        jobWrapper.appendChild(jobHeaderDiv);
        const toggleButtonRow = document.createElement("div");
        toggleButtonRow.classList.add("applicants-toggle-row"); 
        const toggleDivElement = document.createElement("div");
        toggleDivElement.classList.add("db-table-applicants"); 
        toggleDivElement.innerHTML = `Bewerberliste anzeigen <span class="toggle-icon">▼</span>`;
        toggleButtonRow.appendChild(toggleDivElement);
        jobWrapper.appendChild(toggleButtonRow);

        const applicantsListContainer = document.createElement("div"); // Hauptcontainer für Header, Zeilen, Nachrichten
        applicantsListContainer.classList.add("applicants-list-container");
        applicantsListContainer.style.display = "none";
        applicantsListContainer.dataset.jobId = jobItem.id; 
        applicantsListContainer.dataset.initialPageLoaded = 'false'; 

        jobWrapper.appendChild(applicantsListContainer);
        
        let paginationWrapper = jobWrapper.querySelector(".db-table-pagination");
        if (!paginationWrapper) {
            paginationWrapper = document.createElement("div");
            paginationWrapper.classList.add("db-table-pagination");
            jobWrapper.appendChild(paginationWrapper); 
        }
        paginationWrapper.style.display = "none"; 

        fragment.appendChild(jobWrapper);

        toggleDivElement.addEventListener("click", async () => {
            const isHidden = applicantsListContainer.style.display === "none";
            const initialPageLoaded = applicantsListContainer.dataset.initialPageLoaded === 'true';

            if (isHidden) {
                applicantsListContainer.style.display = "block";
                toggleDivElement.innerHTML = `Bewerberliste ausblenden <span class="toggle-icon">▲</span>`;
                if (!initialPageLoaded) { 
                    toggleDivElement.style.pointerEvents = 'none';
                    await loadAndDisplayApplicantsForJob(jobItem.id, applicantIdsForThisSpecificJob, applicantsListContainer, paginationWrapper, 1, false);
                    toggleDivElement.style.pointerEvents = 'auto';
                } else {
                     paginationWrapper.style.display = (Math.ceil(applicantIdsForThisSpecificJob.length / currentApplicantPageSize) <= 1) ? "none" : "flex";
                }
            } else {
                applicantsListContainer.style.display = "none";
                paginationWrapper.style.display = "none";
                toggleDivElement.innerHTML = `Bewerberliste anzeigen <span class="toggle-icon">▼</span>`;
            }
        });
    });

    container.appendChild(fragment);

    requestAnimationFrame(() => {
        container.querySelectorAll(".my-job-item.job-entry:not(.job-error)").forEach(entry => entry.classList.add("visible"));
    });
}

// --- Hauptfunktion ---
async function displayMyJobsAndApplicants() {
    const container = document.getElementById("jobs-list");
    if (!container) {
        console.error("❌ Container 'jobs-list' für displayMyJobsAndApplicants nicht gefunden.");
        return;
    }
    renderMyJobsSkeletonLoader(container, SKELETON_JOBS_COUNT_MJ);

    try {
        if (typeof window.$memberstackDom === 'undefined') {
            await new Promise(resolve => {
                const interval = setInterval(() => {
                    if (typeof window.$memberstackDom !== 'undefined') { clearInterval(interval); resolve(); }
                }, 100);
            });
        }
        const member = await window.$memberstackDom.getCurrentMember();
        currentWebflowMemberId_MJ = member?.data?.customFields?.['webflow-member-id'];

        if (!currentWebflowMemberId_MJ) {
            console.error("❌ Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
            container.innerHTML = "<p class='error-message job-entry visible'>Benutzerdaten konnten nicht geladen werden.</p>";
            return;
        }
        console.log(`✅ MyJobs: Webflow Member ID: ${currentWebflowMemberId_MJ}`);

        await delay(API_CALL_DELAY_MS); 
        const currentUserItem = await fetchWebflowItem(USER_COLLECTION_ID_MJ, currentWebflowMemberId_MJ);

        if (!currentUserItem || (currentUserItem.error && currentUserItem.status !== 429 && currentUserItem.status !== 404) ) {
            console.error("❌ Benutzerdaten des aktuellen Users nicht gefunden oder kritischer Fehler beim Abruf.", currentUserItem);
            container.innerHTML = `<p class='error-message job-entry visible'>Benutzerdaten des aktuellen Users konnten nicht geladen werden.</p>`;
            return;
        }
        if (currentUserItem.error && currentUserItem.status === 429) {
            console.warn("Rate limit beim Abrufen des aktuellen Benutzers. Breche ab.");
            container.innerHTML = `<p class='error-message job-entry visible'>Zu viele Anfragen beim Laden der initialen Benutzerdaten. Bitte versuche es später erneut.</p>`;
            return;
        }
         if (!currentUserItem.fieldData && !(currentUserItem.error && currentUserItem.status === 404)) { 
            console.error("❌ Benutzerdaten des aktuellen Users (fieldData) nicht gefunden, obwohl User existiert.", currentUserItem);
            renderMyJobsAndApplicants([]); 
            return;
        }
        
        const postedJobIds = currentUserItem.fieldData ? currentUserItem.fieldData["posted-jobs"] || [] : [];
        console.log(`User hat ${postedJobIds.length} Jobs im Feld 'posted-jobs'.`);

        if (postedJobIds.length === 0) {
            renderMyJobsAndApplicants([]);
            return;
        }

        let myJobItems = [];
        for (const jobId of postedJobIds) {
            console.log(`Fetching job item: ${jobId}`);
            await delay(API_CALL_DELAY_MS); 
            const jobItem = await fetchWebflowItem(JOB_COLLECTION_ID_MJ, jobId);
            
            if (jobItem) { 
                myJobItems.push(jobItem);
            } else { 
                console.warn(`Job ${jobId} führte zu einer unerwarteten null-Antwort von fetchWebflowItem.`);
                 myJobItems.push({id: jobId, error: true, status: 'fetch_null_error', message: `Unerwartete null-Antwort für Job ${jobId}.`});
            }
        }

        console.log("--- Überprüfung der geladenen Job-Daten (myJobItems) ---");
        myJobItems.forEach(job => {
            if (job.error) {
                 console.log(`Job ID: ${job.id}, Fehler: ${job.message}, Status: ${job.status}`);
            } else if (job.fieldData) {
                 console.log(`Job ID: ${job.id}, Name: ${job.fieldData.name}, Bewerber IDs im Job-Objekt: ${JSON.stringify(job.fieldData["bewerber"] || [])}`);
            } else {
                 console.log(`Job ID: ${job.id}, Unerwarteter Zustand (weder fieldData noch error-Property). Item:`, job);
            }
        });
        console.log("-----------------------------------------------------");
        
        if (myJobItems.length === 0 && postedJobIds.length > 0) { 
            container.innerHTML = `<p class='info-message job-entry visible'>Keine Jobdaten konnten geladen oder verarbeitet werden.</p>`;
            return;
        }

        allMyJobsData_MJ = myJobItems; 
        renderMyJobsAndApplicants(allMyJobsData_MJ);

    } catch (error) {
        console.error("❌ Schwerwiegender Fehler in displayMyJobsAndApplicants:", error);
        if (container) {
            container.innerHTML = `<p class='error-message job-entry visible'>Ein allgemeiner Fehler ist aufgetreten: ${error.message}. Bitte versuche es später erneut.</p>`;
        }
    }
}

// --- Initialisierung ---
function initializePageSizeSelector() {
    const pageSizeSelector = document.getElementById('job-applicants-page-size-selector'); 
    if (pageSizeSelector) {
        pageSizeSelector.value = currentApplicantPageSize; 
        pageSizeSelector.addEventListener('change', (event) => {
            const newSize = parseInt(event.target.value, 10);
            if (newSize === 15 || newSize === 25) { 
                const oldSize = currentApplicantPageSize;
                currentApplicantPageSize = newSize;
                console.log(`DEBUG: Seitengröße geändert von ${oldSize} auf ${currentApplicantPageSize}`);
                
                const openApplicantContainer = document.querySelector('.applicants-list-container[style*="display: block"]');
                if (openApplicantContainer) {
                    const jobId = openApplicantContainer.dataset.jobId;
                    const jobData = allMyJobsData_MJ.find(job => job.id === jobId); 
                    const jobWrapper = openApplicantContainer.closest('.my-job-item');
                    const paginationWrapper = jobWrapper ? jobWrapper.querySelector(".db-table-pagination") : null;
                    const toggleDivElement = jobWrapper ? jobWrapper.querySelector(".db-table-applicants") : null;

                    if (jobData && jobData.fieldData && jobData.fieldData.bewerber && paginationWrapper && toggleDivElement) {
                        console.log(`DEBUG: Lade Job ${jobId} mit neuer Seitengröße ${currentApplicantPageSize} neu (Seite 1).`);
                        
                        toggleDivElement.style.pointerEvents = 'none';
                        paginationWrapper.querySelectorAll('.db-pagination-count').forEach(el => el.classList.add("disabled-loading"));
                        
                        openApplicantContainer.dataset.initialPageLoaded = 'false'; 
                        // Preload-Cache für diesen Job zurücksetzen, da sich die Seitengröße geändert hat
                        if(preloadedApplicantData[jobId]) delete preloadedApplicantData[jobId];

                        loadAndDisplayApplicantsForJob(jobId, jobData.fieldData.bewerber, openApplicantContainer, paginationWrapper, 1, false) 
                          .finally(() => {
                            toggleDivElement.style.pointerEvents = 'auto';
                          });
                    }
                }
            }
        });
    } else {
        console.warn("DEBUG: Element für Seitengrößenauswahl ('job-applicants-page-size-selector') nicht gefunden. Nutze Standard: " + currentApplicantPageSize);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    initializePageSizeSelector(); 
    displayMyJobsAndApplicants(); 
});

// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL_MJ = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL_MJ = "https://meine-kampagnen.oliver-258.workers.dev/";
const JOB_COLLECTION_ID_MJ = "6448faf9c5a8a17455c05525"; // Deine Job Collection ID
const USER_COLLECTION_ID_MJ = "6448faf9c5a8a15f6cc05526"; // Deine User Collection ID (für den eingeloggten User und Bewerber)
const SKELETON_JOBS_COUNT_MJ = 3;
const API_CALL_DELAY_MS = 550; 
// const MAX_ITEMS_PER_BATCH_REQUEST = 100; // Nicht mehr primär für Bewerberladung genutzt
let currentApplicantPageSize = 15; // Standard-Seitengröße, später anpassbar

let currentWebflowMemberId_MJ = null;
let allMyJobsData_MJ = []; // Speichert die geladenen Job-Items

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
        return null; // Rückgabe null, damit der Aufrufer dies prüfen kann
    }
    const apiUrl = `${API_BASE_URL_MJ}/${collectionId}/items/${itemId}/live`;
    const workerUrl = buildWorkerUrl_MJ(apiUrl);
    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`Item ${itemId} in Collection ${collectionId} nicht gefunden (404).`);
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
        const placeholder1 = document.createElement("div"); // Renamed from skeletonPlaceholder1
        placeholder1.classList.add("db-table-row-item");
        const skeletonText1 = document.createElement("div");
        skeletonText1.classList.add("skeleton-element", "skeleton-text", "skeleton-text-medium");
        placeholder1.appendChild(skeletonText1);
        jobHeader.appendChild(placeholder1);
        const placeholder2 = document.createElement("div"); // Renamed from skeletonPlaceholder2
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
        // Skeleton für Pagination-Bereich (optional, aber gut für UX)
        const skeletonPaginationRow = document.createElement("div");
        skeletonPaginationRow.classList.add("applicants-toggle-row-skeleton", "skeleton-element"); // Wiederverwendung der Klasse
        skeletonPaginationRow.style.height = "30px";
        skeletonPaginationRow.style.width = "200px"; // Etwas breiter für Paginierung
        skeletonPaginationRow.style.margin = "10px auto";
        jobWrapper.appendChild(skeletonPaginationRow);
        container.appendChild(jobWrapper);
    }
}

// --- Rendering-Funktionen ---
function createApplicantRowElement(applicantFieldData) {
    const applicantDiv = document.createElement("div");
    applicantDiv.classList.add("db-table-row", "db-table-applicant", "job-entry");
    applicantDiv.style.cursor = "pointer";

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
        errorDiv.style.color = "red";
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

async function renderPaginationControls(jobId, allApplicantIdsForThisJob, applicantsContainerElement, paginationWrapper, currentPage, totalPages) {
    if (!paginationWrapper) {
        console.warn(`DEBUG: Kein Pagination Wrapper für Job ${jobId} gefunden.`);
        return;
    }
    paginationWrapper.innerHTML = ''; // Bestehende Controls löschen

    if (totalPages <= 1) { // Keine Controls nötig, wenn nur eine Seite oder keine Seiten
        return;
    }

    // "Zurück" Button
    const prevButton = document.createElement("a");
    prevButton.href = "#"; // Für Webflow-Styling, JS verhindert Standardaktion
    prevButton.classList.add("db-pagination-count", "button-prev"); // Eigene Klasse für Styling
    prevButton.textContent = "Zurück";
    if (currentPage === 1) {
        prevButton.classList.add("disabled"); // Klasse für deaktiviertes Aussehen
        prevButton.style.pointerEvents = "none"; // Klick verhindern
        prevButton.style.opacity = "0.5";
    } else {
        prevButton.addEventListener("click", async (e) => {
            e.preventDefault();
            prevButton.style.pointerEvents = "none"; // Klick während des Ladens verhindern
            prevButton.textContent = "Lade...";
            await loadAndDisplayApplicantsForJob(jobId, allApplicantIdsForThisJob, applicantsContainerElement, paginationWrapper, currentPage - 1);
        });
    }
    paginationWrapper.appendChild(prevButton);

    // Seitenanzeige (z.B. "Seite 1 von 3")
    const pageInfo = document.createElement("div");
    pageInfo.classList.add("db-pagination-count", "page-info"); // Eigene Klasse für Styling
    pageInfo.textContent = `Seite ${currentPage} von ${totalPages}`;
    pageInfo.style.margin = "0 10px"; // Etwas Abstand
    paginationWrapper.appendChild(pageInfo);

    // "Weiter" Button
    const nextButton = document.createElement("a");
    nextButton.href = "#";
    nextButton.classList.add("db-pagination-count", "button-next"); // Eigene Klasse für Styling
    nextButton.textContent = "Weiter";
    if (currentPage === totalPages) {
        nextButton.classList.add("disabled");
        nextButton.style.pointerEvents = "none";
        nextButton.style.opacity = "0.5";
    } else {
        nextButton.addEventListener("click", async (e) => {
            e.preventDefault();
            nextButton.style.pointerEvents = "none";
            nextButton.textContent = "Lade...";
            await loadAndDisplayApplicantsForJob(jobId, allApplicantIdsForThisJob, applicantsContainerElement, paginationWrapper, currentPage + 1);
        });
    }
    paginationWrapper.appendChild(nextButton);
}


async function loadAndDisplayApplicantsForJob(jobId, allApplicantIdsForThisJob, applicantsContainerElement, paginationWrapper, pageNumber = 1) {
    console.log(`DEBUG: loadAndDisplayApplicantsForJob START - Job ID: ${jobId}, Page: ${pageNumber}, PageSize: ${currentApplicantPageSize}`);
    
    // Haupt-Toggle-Button während des Ladens deaktivieren (falls er noch nicht deaktiviert ist)
    const mainToggleButton = document.querySelector(`.my-job-item [data-job-id="${jobId}"] .db-table-applicants`);
    if (mainToggleButton) mainToggleButton.style.pointerEvents = 'none';


    applicantsContainerElement.innerHTML = ''; // Leere den Container für die neue Seite
    applicantsContainerElement.dataset.currentPage = pageNumber;


    const loadingMessage = document.createElement("p");
    loadingMessage.classList.add("applicants-message");
    loadingMessage.style.padding = "20px";
    loadingMessage.style.textAlign = "center";
    loadingMessage.textContent = `Lade Bewerber (Seite ${pageNumber})...`;
    applicantsContainerElement.appendChild(loadingMessage);

    const offset = (pageNumber - 1) * currentApplicantPageSize;
    const idsToFetch = allApplicantIdsForThisJob.slice(offset, offset + currentApplicantPageSize);
    let fetchedApplicantsDetails = [];

    if (idsToFetch.length > 0) {
        console.log(`DEBUG: Lade Seite ${pageNumber} für Job ${jobId}. Offset: ${offset}, Anzahl: ${idsToFetch.length}. IDs: ${idsToFetch.join(', ')}`);
        for (const applicantId of idsToFetch) {
            await delay(API_CALL_DELAY_MS);
            const applicantItem = await fetchWebflowItem(USER_COLLECTION_ID_MJ, applicantId);
            if (applicantItem) { // fetchWebflowItem gibt immer ein Objekt zurück (Item oder Fehlerobjekt)
                fetchedApplicantsDetails.push(applicantItem);
            } 
            // Der Fall, dass applicantItem null ist, sollte durch fetchWebflowItem nicht mehr auftreten
        }
    }

    loadingMessage.remove(); 

    fetchedApplicantsDetails.sort((a, b) => {
        if (a.error || !a.fieldData) return 1;
        if (b.error || !b.fieldData) return -1;
        const aIsPlus = a.fieldData["plus-mitglied"] === true;
        const bIsPlus = b.fieldData["plus-mitglied"] === true;
        if (aIsPlus && !bIsPlus) return -1;
        if (!aIsPlus && bIsPlus) return 1;
        return 0;
    });
    
    let validApplicantsRenderedOnThisPage = 0;
    fetchedApplicantsDetails.forEach(applicant => {
        if (applicant && applicant.fieldData && !applicant.error) {
            const applicantRow = createApplicantRowElement(applicant.fieldData);
            applicantsContainerElement.appendChild(applicantRow);
            requestAnimationFrame(() => { // Fade-in für neue Zeilen
                applicantRow.style.opacity = 0;
                requestAnimationFrame(() => {
                    applicantRow.style.transition = "opacity 0.3s ease-in-out";
                    applicantRow.style.opacity = 1;
                });
            });
            validApplicantsRenderedOnThisPage++;
        } else if (applicant && applicant.error) {
            const errorMsg = document.createElement("p");
            errorMsg.classList.add("applicants-message");
            errorMsg.style.color = "orange";
            errorMsg.style.padding = "5px 0";
            errorMsg.style.textAlign = "center";
            if (applicant.status === 429) {
                errorMsg.textContent = `Bewerberdaten (ID: ${applicant.id}) konnten wegen API-Limits nicht geladen werden.`;
            } else if (applicant.status === 404) {
                errorMsg.textContent = `Bewerber (ID: ${applicant.id}) wurde nicht gefunden.`;
            } else {
                errorMsg.textContent = applicant.message || `Daten für Bewerber ${applicant.id || 'unbekannt'} konnten nicht geladen werden.`;
            }
            applicantsContainerElement.appendChild(errorMsg);
        }
    });
    
    console.log(`DEBUG: Job ${jobId}, Seite ${pageNumber}: ${validApplicantsRenderedOnThisPage} Bewerber gerendert.`);

    if (validApplicantsRenderedOnThisPage === 0 && allApplicantIdsForThisJob.length > 0 && idsToFetch.length > 0) {
        const noDataMsg = document.createElement("p");
        noDataMsg.classList.add("applicants-message");
        noDataMsg.textContent = "Keine gültigen Bewerberdaten für diese Seite gefunden.";
        noDataMsg.style.padding = "10px 0";
        noDataMsg.style.textAlign = "center";
        applicantsContainerElement.appendChild(noDataMsg);
    } else if (allApplicantIdsForThisJob.length === 0) {
        const noApplicantsMsg = document.createElement("p");
        noApplicantsMsg.classList.add("applicants-message");
        noApplicantsMsg.textContent = "Für diesen Job liegen keine Bewerbungen vor.";
        noApplicantsMsg.style.padding = "10px 0";
        noApplicantsMsg.style.textAlign = "center";
        applicantsContainerElement.appendChild(noApplicantsMsg);
    }
    
    const totalPages = Math.ceil(allApplicantIdsForThisJob.length / currentApplicantPageSize);
    await renderPaginationControls(jobId, allApplicantIdsForThisJob, applicantsContainerElement, paginationWrapper, pageNumber, totalPages);
    
    if (mainToggleButton) mainToggleButton.style.pointerEvents = 'auto'; // Haupt-Toggle wieder aktivieren
    applicantsContainerElement.dataset.initialPageLoaded = 'true'; // Markieren, dass die erste Seite geladen wurde (oder eine Seite)
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
                globalRateLimitInfo.style.color = "orange";
                globalRateLimitInfo.style.textAlign = "center";
                globalRateLimitInfo.style.padding = "10px";
                globalRateLimitInfo.classList.add("job-entry", "visible");
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
        jobWrapper.dataset.jobId = jobItem.id; // Job-ID am Wrapper speichern

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
        toggleButtonRow.classList.add("applicants-toggle-row"); // Behält die Klasse für Styling
        const toggleDivElement = document.createElement("div");
        toggleDivElement.classList.add("db-table-applicants"); // Deine Klasse für den Klick-Bereich
        toggleDivElement.innerHTML = `Bewerberliste anzeigen <span class="toggle-icon">▼</span>`;
        toggleDivElement.style.cursor = "pointer";
        toggleButtonRow.appendChild(toggleDivElement);
        jobWrapper.appendChild(toggleButtonRow);

        const applicantsContainer = document.createElement("div");
        applicantsContainer.classList.add("applicants-list-container");
        applicantsContainer.style.display = "none";
        applicantsContainer.dataset.jobId = jobItem.id; 
        applicantsContainer.dataset.initialPageLoaded = 'false'; // Wichtig für Erstladung

        jobWrapper.appendChild(applicantsContainer);
        
        // Finde den von Webflow vorbereiteten Pagination-Wrapper
        // Annahme: Er ist ein direktes Kind von jobWrapper oder zumindest leicht auffindbar.
        // Wenn er nicht existiert, wird er dynamisch erstellt.
        let paginationWrapper = jobWrapper.querySelector(".db-table-pagination");
        if (!paginationWrapper) {
            console.warn(`Kein .db-table-pagination für Job ${jobItem.id} in Webflow gefunden. Erstelle dynamisch.`);
            paginationWrapper = document.createElement("div");
            paginationWrapper.classList.add("db-table-pagination");
            jobWrapper.appendChild(paginationWrapper); // Füge ihn am Ende des JobWrappers hinzu
        }
        paginationWrapper.style.display = "none"; // Initial ausblenden

        fragment.appendChild(jobWrapper);

        toggleDivElement.addEventListener("click", async () => {
            const isHidden = applicantsContainer.style.display === "none";
            const initialPageLoaded = applicantsContainer.dataset.initialPageLoaded === 'true';

            if (isHidden) {
                applicantsContainer.style.display = "block";
                paginationWrapper.style.display = "flex"; // Oder "block", je nach gewünschtem Layout
                toggleDivElement.innerHTML = `Bewerberliste ausblenden <span class="toggle-icon">▲</span>`;
                if (!initialPageLoaded) { 
                    toggleDivElement.style.pointerEvents = 'none';
                    await loadAndDisplayApplicantsForJob(jobItem.id, applicantIdsForThisSpecificJob, applicantsContainer, paginationWrapper, 1);
                    toggleDivElement.style.pointerEvents = 'auto';
                }
            } else {
                applicantsContainer.style.display = "none";
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
        
        if (myJobItems.length === 0 && postedJobIds.length > 0) { // Sollte nur passieren, wenn alle Job-Fetches fehlschlagen
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
// Event Listener für die Auswahl der Seitengröße (Beispiel)
function initializePageSizeSelector() {
    const pageSizeSelector = document.getElementById('job-applicants-page-size-selector'); // ID deines Select-Elements
    if (pageSizeSelector) {
        pageSizeSelector.value = currentApplicantPageSize; // Initialwert setzen
        pageSizeSelector.addEventListener('change', (event) => {
            const newSize = parseInt(event.target.value, 10);
            if (newSize === 15 || newSize === 25) {
                currentApplicantPageSize = newSize;
                console.log(`DEBUG: Seitengröße geändert auf ${currentApplicantPageSize}`);
                // Wenn ein Job geöffnet ist, dessen Bewerberliste angezeigt wird, müsste diese neu geladen werden.
                // Dies erfordert, den aktuell geöffneten Job-Container zu finden und dessen Paginierung neu zu starten.
                // Fürs Erste wird die neue Seitengröße beim nächsten Öffnen eines Jobs oder beim Blättern verwendet.
                // Um es sofort anzuwenden, wenn ein Job offen ist:
                const openApplicantContainer = document.querySelector('.applicants-list-container[style*="display: block"]');
                if (openApplicantContainer) {
                    const jobId = openApplicantContainer.dataset.jobId;
                    const jobData = allMyJobsData_MJ.find(job => job.id === jobId);
                    const jobWrapper = openApplicantContainer.closest('.my-job-item');
                    const paginationWrapper = jobWrapper ? jobWrapper.querySelector(".db-table-pagination") : null;

                    if (jobData && jobData.fieldData && jobData.fieldData.bewerber && paginationWrapper) {
                        console.log(`DEBUG: Lade Job ${jobId} mit neuer Seitengröße neu.`);
                        // Wichtig: Haupt-Toggle-Text und Zustand korrekt handhaben
                        const toggleDivElement = jobWrapper.querySelector(".db-table-applicants");
                        if(toggleDivElement) toggleDivElement.style.pointerEvents = 'none';
                        
                        loadAndDisplayApplicantsForJob(jobId, jobData.fieldData.bewerber, openApplicantContainer, paginationWrapper, 1)
                          .finally(() => {
                            if(toggleDivElement) toggleDivElement.style.pointerEvents = 'auto';
                          });
                    }
                }
            }
        });
    } else {
        console.warn("DEBUG: Element für Seitengrößenauswahl nicht gefunden. Nutze Standard: " + currentApplicantPageSize);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    initializePageSizeSelector(); // Initialisiere den Page-Size-Selector
    displayMyJobsAndApplicants(); // Lade dann die Jobs
});

// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL_MJ = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL_MJ = "https://bewerbungen.oliver-258.workers.dev/?url="; // Deine Worker URL
const JOB_COLLECTION_ID_MJ = "6448faf9c5a8a17455c05525"; // Deine Job Collection ID
const USER_COLLECTION_ID_MJ = "6448faf9c5a8a15f6cc05526"; // Deine User Collection ID (für den eingeloggten User und Bewerber)
const SKELETON_JOBS_COUNT_MJ = 3; // Anzahl der Skeleton-Job-Zeilen

let currentWebflowMemberId_MJ = null;
let allMyJobsData_MJ = []; // Speichert alle geladenen eigenen Jobs mit Bewerbern

// --- Hilfsfunktionen ---
function buildWorkerUrl_MJ(apiUrl) {
    return `${WORKER_BASE_URL_MJ}${encodeURIComponent(apiUrl)}`;
}

async function fetchWebflowCollection(collectionId, params = {}) {
    let allItems = [];
    let offset = 0;
    const limit = 100;

    try {
        while (true) {
            const queryParams = new URLSearchParams({ ...params, limit: limit.toString(), offset: offset.toString() }).toString();
            const apiUrl = `${API_BASE_URL_MJ}/${collectionId}/items/live?${queryParams}`;
            const workerUrl = buildWorkerUrl_MJ(apiUrl);

            const response = await fetch(workerUrl);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API-Fehler beim Abrufen der Collection ${collectionId}: ${response.status} - ${errorText}`);
                throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            allItems = allItems.concat(data.items || []);

            if ((data.items && data.items.length < limit) || !data.items || data.items.length === 0) {
                break;
            }
            offset += limit;
        }
        return allItems;
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen der Collection ${collectionId}: ${error.message}`);
        return [];
    }
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
                console.warn(`Item ${itemId} in Collection ${collectionId} nicht gefunden (404).`);
                return null;
            }
            const errorText = await response.text();
            console.error(`API-Fehler beim Abrufen von Item ${itemId} aus Collection ${collectionId}: ${response.status} - ${errorText}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ Netzwerkfehler oder anderer Fehler beim Abrufen des Items (${collectionId}/${itemId}): ${error.message}`);
        return null;
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

        const skeletonToggleRow = document.createElement("div");
        skeletonToggleRow.classList.add("applicants-toggle-row-skeleton", "skeleton-element");
        skeletonToggleRow.style.height = "30px";
        skeletonToggleRow.style.width = "150px";
        skeletonToggleRow.style.margin = "10px auto";
        jobWrapper.appendChild(skeletonToggleRow);

        container.appendChild(jobWrapper);
    }
    // HINWEIS: Die CSS-Regeln für Skeleton-Elemente und .job-entry MÜSSEN in deiner CSS-Datei sein.
}

// --- Rendering-Funktionen ---

// ***** NEU ANGEPASSTE FUNKTION *****
function createApplicantRowElement(applicantFieldData) {
    const applicantDiv = document.createElement("div");
    applicantDiv.classList.add("db-table-row", "db-table-applicant", "job-entry");

    // 1. Spalte: Bild + Name/Plus-Status
    const profileInfoDiv = document.createElement("div");
    profileInfoDiv.classList.add("db-table-row-item", "justify-left"); // "justify-left" für linksbündige Ausrichtung

    // Bild des Creators
    if (applicantFieldData["user-profile-img"]) {
        const applicantImg = document.createElement("img");
        applicantImg.classList.add("db-table-img", "is-margin-right-12");
        // Die URL kann direkt ein String sein oder ein Objekt mit einer .url Eigenschaft haben
        applicantImg.src = typeof applicantFieldData["user-profile-img"] === 'string' ? applicantFieldData["user-profile-img"] : applicantFieldData["user-profile-img"]?.url;
        applicantImg.alt = applicantFieldData.name || "Bewerberbild";
        applicantImg.style.width = "40px";
        applicantImg.style.height = "40px";
        applicantImg.style.borderRadius = "50%";
        applicantImg.style.objectFit = "cover";
        profileInfoDiv.appendChild(applicantImg);
    }

    // Container für Name und Plus-Status
    const namePlusStatusDiv = document.createElement("div");
    namePlusStatusDiv.classList.add("is-flexbox-vertical"); // Deine CSS-Klasse für vertikale Anordnung

    // Name des Creators
    const nameSpan = document.createElement("span");
    nameSpan.textContent = applicantFieldData.name || "Unbekannter Bewerber";
    namePlusStatusDiv.appendChild(nameSpan);

    // Plus-Mitglied-Status
    const plusStatusSpan = document.createElement("span");
    plusStatusSpan.textContent = applicantFieldData["plus-mitglied"] ? "Plus Mitglied" : "Standard"; // Oder "Kein Plus Mitglied" etc.
    plusStatusSpan.style.fontSize = "0.9em"; // Beispiel für kleinere Schrift
    plusStatusSpan.style.color = applicantFieldData["plus-mitglied"] ? "blue" : "#666"; // Beispiel für farbliche Unterscheidung
    namePlusStatusDiv.appendChild(plusStatusSpan);

    profileInfoDiv.appendChild(namePlusStatusDiv);
    applicantDiv.appendChild(profileInfoDiv);

    // 2. Spalte: City + Bundesland
    const locationDiv = document.createElement("div");
    locationDiv.classList.add("db-table-row-item");
    const city = applicantFieldData["user-city-2"] || "K.A.";
    const bundesland = applicantFieldData["bundesland-option"] || "K.A."; // Beachte: Könnte eine ID sein
    locationDiv.textContent = `${city}, ${bundesland}`;
    applicantDiv.appendChild(locationDiv);

    // 3. Spalte: Kategorie
    const categoryDiv = document.createElement("div");
    categoryDiv.classList.add("db-table-row-item");
    categoryDiv.textContent = applicantFieldData["creator-main-categorie"] || "K.A.";
    applicantDiv.appendChild(categoryDiv);

    // 4. Spalte: Social Media Kanäle
    const socialDiv = document.createElement("div");
    socialDiv.classList.add("db-table-row-item");
    if (applicantFieldData["homepage"]) {
        const socialLink = document.createElement("a");
        socialLink.href = applicantFieldData["homepage"];
        socialLink.textContent = "Profil"; // Oder den Hostnamen der URL anzeigen
        socialLink.target = "_blank"; // Link in neuem Tab öffnen
        socialLink.rel = "noopener noreferrer"; // Sicherheitsaspekt
        socialDiv.appendChild(socialLink);
    } else {
        socialDiv.textContent = "K.A.";
    }
    applicantDiv.appendChild(socialDiv);

    // 5. Spalte: Anzahl der Follower
    const followerDiv = document.createElement("div");
    followerDiv.classList.add("db-table-row-item");
    followerDiv.textContent = applicantFieldData["creator-follower"] || "K.A."; // Beachte: Könnte eine ID oder kodierter Wert sein
    applicantDiv.appendChild(followerDiv);

    // 6. Spalte: Alter
    const ageDiv = document.createElement("div");
    ageDiv.classList.add("db-table-row-item");
    ageDiv.textContent = applicantFieldData["creator-age"] || "K.A."; // Beachte: Könnte eine ID oder kodierter Wert sein
    applicantDiv.appendChild(ageDiv);

    return applicantDiv;
}
// ***** ENDE DER ANGEPASSTEN FUNKTION *****

function renderMyJobsAndApplicants(jobsWithApplicants) {
    const container = document.getElementById("jobs-list");
    if (!container) {
        console.error("❌ Container 'jobs-list' nicht gefunden.");
        return;
    }
    container.innerHTML = "";

    if (jobsWithApplicants.length === 0) {
        const noJobsMsg = document.createElement("p");
        noJobsMsg.textContent = "Du hast noch keine Jobs erstellt oder es wurden keine Jobs gefunden, die deinen Kriterien entsprechen.";
        noJobsMsg.classList.add("job-entry");
        container.appendChild(noJobsMsg);
        requestAnimationFrame(() => noJobsMsg.classList.add("visible"));
        return;
    }

    const fragment = document.createDocumentFragment();

    jobsWithApplicants.forEach(jobItem => {
        const jobFieldData = jobItem.fieldData;
        if (!jobFieldData) {
            console.warn("Job-Item ohne fieldData übersprungen:", jobItem);
            return;
        }

        const jobWrapper = document.createElement("div");
        jobWrapper.classList.add("my-job-item", "job-entry");

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

        const applicantsCountCell = document.createElement("div");
        applicantsCountCell.classList.add("db-table-row-item");
        applicantsCountCell.textContent = `Bewerber: ${jobItem.applicants.length}`;
        jobHeaderDiv.appendChild(applicantsCountCell);

        jobWrapper.appendChild(jobHeaderDiv);

        const toggleButtonRow = document.createElement("div");
        toggleButtonRow.classList.add("applicants-toggle-row");

        const toggleDivElement = document.createElement("div");
        toggleDivElement.classList.add("db-table-applicants"); // Deine gewünschte Klasse
        toggleDivElement.innerHTML = `Bewerberliste <span class="toggle-icon">▼</span>`;
        toggleDivElement.style.cursor = "pointer";
        toggleButtonRow.appendChild(toggleDivElement);
        jobWrapper.appendChild(toggleButtonRow);

        const applicantsContainer = document.createElement("div");
        applicantsContainer.classList.add("applicants-list-container");
        applicantsContainer.style.display = "none";

        if (jobItem.applicants.length > 0) {
            jobItem.applicants.forEach(applicant => {
                if (applicant && applicant.fieldData) {
                    // Hier wird die angepasste Funktion createApplicantRowElement verwendet
                    applicantsContainer.appendChild(createApplicantRowElement(applicant.fieldData));
                }
            });
        } else {
            const noApplicantsMsg = document.createElement("p");
            noApplicantsMsg.textContent = "Noch keine Bewerbungen für diesen Job.";
            noApplicantsMsg.style.padding = "10px 0";
            applicantsContainer.appendChild(noApplicantsMsg);
        }
        jobWrapper.appendChild(applicantsContainer);
        fragment.appendChild(jobWrapper);

        toggleDivElement.addEventListener("click", () => {
            const isHidden = applicantsContainer.style.display === "none";
            applicantsContainer.style.display = isHidden ? "block" : "none";
            toggleDivElement.querySelector(".toggle-icon").textContent = isHidden ? "▲" : "▼";
            if (isHidden) {
                const applicantEntries = applicantsContainer.querySelectorAll(".job-entry");
                applicantEntries.forEach(entry => entry.classList.remove("visible"));
                requestAnimationFrame(() => {
                    applicantEntries.forEach(entry => entry.classList.add("visible"));
                });
            }
        });
    });

    container.appendChild(fragment);
    requestAnimationFrame(() => {
        container.querySelectorAll(".my-job-item.job-entry").forEach(entry => entry.classList.add("visible"));
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

        const currentUserItem = await fetchWebflowItem(USER_COLLECTION_ID_MJ, currentWebflowMemberId_MJ);
        if (!currentUserItem || !currentUserItem.fieldData) {
            console.error("❌ Benutzerdaten des aktuellen Users nicht gefunden oder fieldData leer.");
            renderMyJobsAndApplicants([]);
            return;
        }

        const postedJobIds = currentUserItem.fieldData["posted-jobs"] || [];
        console.log(`User hat ${postedJobIds.length} Jobs im Feld 'posted-jobs'.`);

        if (postedJobIds.length === 0) {
            renderMyJobsAndApplicants([]);
            return;
        }

        const myJobItemsPromises = postedJobIds.map(jobId => fetchWebflowItem(JOB_COLLECTION_ID_MJ, jobId));
        let myJobItems = (await Promise.all(myJobItemsPromises)).filter(job => job !== null && job.fieldData);

        console.log(`Found ${myJobItems.length} valid jobs posted by this user.`);

        if (myJobItems.length === 0) {
            renderMyJobsAndApplicants([]);
            return;
        }

        const jobsWithApplicantsPromises = myJobItems.map(async (jobItem) => {
            const jobFieldData = jobItem.fieldData;
            let applicantsData = [];
            const applicantIds = jobFieldData["bewerber"] || []; // Das Feld in der Job Collection, das auf User Items (Bewerber) verweist

            if (applicantIds.length > 0) {
                const applicantPromises = applicantIds.map(applicantId =>
                    fetchWebflowItem(USER_COLLECTION_ID_MJ, applicantId) // Bewerberdaten aus der User Collection laden
                );
                applicantsData = (await Promise.all(applicantPromises)).filter(applicant => applicant !== null && applicant.fieldData);
            }
            return { ...jobItem, applicants: applicantsData };
        });

        allMyJobsData_MJ = await Promise.all(jobsWithApplicantsPromises);
        renderMyJobsAndApplicants(allMyJobsData_MJ);

    } catch (error) {
        console.error("❌ Schwerwiegender Fehler in displayMyJobsAndApplicants:", error);
        if (container) {
            container.innerHTML = `<p class='error-message job-entry visible'>Ein Fehler ist aufgetreten: ${error.message}.</p>`;
        }
    }
}

// --- Initialisierung ---
window.addEventListener("DOMContentLoaded", displayMyJobsAndApplicants);

// 🌐 Webflow API Integration für Video-Feed

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url=";
const USER_COLLECTION_ID = "67d806e65cadcadf2f41e659";

let currentWebflowMemberId = null;

// 🛠️ Hilfsfunktionen
function buildWorkerUrl(apiUrl) {
    return `${WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

async function fetchUserVideos(memberId) {
    if (!USER_COLLECTION_ID) {
        console.error("❌ Fehler: USER_COLLECTION_ID ist ungültig.");
        return [];
    }
    
    const apiUrl = `${API_BASE_URL}/${USER_COLLECTION_ID}/items/${memberId}/live`;
    const workerUrl = buildWorkerUrl(apiUrl);

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }
        const userData = await response.json();
        return userData?.fieldData?.["video-feed"] || [];
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen der Videos: ${error.message}`);
        return [];
    }
}

// 🖨️ Videos rendern
function renderVideos(videos) {
    const videoContainer = document.getElementById("video-feed");
    if (!videoContainer) {
        console.error("❌ Fehler: Container 'video-feed' nicht gefunden.");
        return;
    }
    videoContainer.innerHTML = "";

    videos.forEach(videoData => {
        if (!videoData || Object.keys(videoData).length === 0) return;

        const videoDiv = document.createElement("div");
        videoDiv.classList.add("video-item");

        const videoElement = document.createElement("video");
        videoElement.src = videoData["video-link"] || "";
        videoElement.controls = true;
        videoDiv.appendChild(videoElement);

        const infoDiv = document.createElement("div");
        infoDiv.classList.add("video-info");
        infoDiv.innerHTML = `
            <p><strong>${videoData["video-name"] || "Unbenanntes Video"}</strong></p>
            <p>Kategorie: ${videoData["video-kategorie"] || "Nicht angegeben"}</p>
            <p>Beschreibung: ${videoData["video-beschreibung"] || "Keine Beschreibung"}</p>
            <p>Creator: ${videoData["creator-name"] || "Unbekannt"}</p>
            <p>Memberstack ID: ${videoData["memberstack-id"] || "Nicht verfügbar"}</p>
            <p>Webflow ID: ${videoData["webflow-id"] || "Nicht verfügbar"}</p>
        `;
        videoDiv.appendChild(infoDiv);

        videoContainer.appendChild(videoDiv);
    });
}

// 🚀 Video-Feed für eingeloggten Nutzer laden
async function displayUserVideos() {
    try {
        const member = await window.$memberstackDom.getCurrentMember();
        currentWebflowMemberId = member?.data?.customFields?.['webflow-member-id'];

        if (!currentWebflowMemberId) {
            console.error("❌ Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
            return;
        }

        const videoFeed = await fetchUserVideos(currentWebflowMemberId);

        if (videoFeed.length > 0) {
            renderVideos(videoFeed);
        } else {
            const videoContainer = document.getElementById("video-feed");
            if (videoContainer) {
                videoContainer.innerHTML = "<p>🚫 Keine Videos gefunden.</p>";
            }
        }
    } catch (error) {
        console.error("❌ Fehler beim Laden des Video-Feeds:", error);
    }
}

// Starten, wenn DOM geladen ist
window.addEventListener("DOMContentLoaded", displayUserVideos);

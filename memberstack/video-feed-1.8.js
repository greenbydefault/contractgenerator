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

async function fetchUserVideos(memberstackId) {
    if (!USER_COLLECTION_ID) {
        console.error("❌ Fehler: USER_COLLECTION_ID ist ungültig.");
        return [];
    }
    
    console.log("🔍 API-Anfrage für Nutzer mit Memberstack ID:", memberstackId);
    const apiUrl = `${API_BASE_URL}/${USER_COLLECTION_ID}/items?live=true`;
    const workerUrl = buildWorkerUrl(apiUrl);

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log("✅ Erfolgreich abgerufene Nutzerdaten:", data);
        
        // Alle Items durchsuchen und das Item mit der passenden Memberstack-ID finden
        const userItem = data.items.find(item => item.fieldData["memberstack-id"] === memberstackId);
        
        if (!userItem) {
            console.error("❌ Kein passender Nutzer mit dieser Memberstack ID gefunden.");
            return [];
        }
        
        console.log("📦 Gefundenes Nutzer-Item:", userItem);
        
        // Prüfen, ob video-feed existiert
        if (!userItem.fieldData["video-feed"]) {
            console.error("❌ Kein gültiges Video-Feed-Feld gefunden.");
            return [];
        }
        
        // Falls video-feed ein einzelnes Video ist, es in ein Array umwandeln
        const videoFeed = Array.isArray(userItem.fieldData["video-feed"]) ? userItem.fieldData["video-feed"] : [userItem.fieldData];
        return videoFeed;
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
        if (!videoData || !videoData["video-link"]) return;

        const wrapperDiv = document.createElement("div");
        wrapperDiv.classList.add("db-upload-wrapper-item");

        const videoDiv = document.createElement("div");
        videoDiv.classList.add("db-upload-item-video");

        const videoElement = document.createElement("video");
        videoElement.src = `${videoData["video-link"]}`;
        videoElement.controls = true;
        videoDiv.appendChild(videoElement);

        const detailsDiv = document.createElement("div");
        detailsDiv.classList.add("db-upload-item-details");
        detailsDiv.innerHTML = `
            <p><strong>${videoData["video-name"] || "Unbenanntes Video"}</strong></p>
            <p>Kategorie: ${videoData["video-kategorie"] || "Nicht angegeben"}</p>
        `;

        wrapperDiv.appendChild(videoDiv);
        wrapperDiv.appendChild(detailsDiv);
        videoContainer.appendChild(wrapperDiv);
    });
}

// 🚀 Video-Feed für eingeloggten Nutzer laden
async function displayUserVideos() {
    try {
        const member = await window.$memberstackDom.getCurrentMember();
        const memberstackId = member?.data?.id;
        console.log("👤 Eingeloggter Nutzer Memberstack-ID:", memberstackId);

        if (!memberstackId) {
            console.error("❌ Kein 'memberstack-id' im Memberstack-Profil gefunden.");
            return;
        }

        const videoFeed = await fetchUserVideos(memberstackId);

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

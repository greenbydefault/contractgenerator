// 🌐 Webflow API Integration für Video-Feed

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url=";
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";

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
    
    console.log("🔍 API-Anfrage für Webflow Member ID:", memberId);
    const apiUrl = `${API_BASE_URL}/${USER_COLLECTION_ID}/items/${memberId}/live`;
    const workerUrl = buildWorkerUrl(apiUrl);

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }
        const userData = await response.json();
        console.log("✅ Erfolgreich abgerufene Benutzerdaten:", userData);
        
        // Prüfen, ob fieldData existiert
        if (!userData?.fieldData) {
            console.error("❌ Kein gültiges fieldData erhalten.");
            return [];
        }
        
        console.log("📦 userData.fieldData:", userData.fieldData);
        
        // Prüfen, ob video-feed existiert und gültige Werte enthält
        if (!userData.fieldData["video-feed"] || !Array.isArray(userData.fieldData["video-feed"])) {
            console.error("❌ Kein gültiges Video-Feed-Feld gefunden.");
            return [];
        }
        return userData.fieldData["video-feed"];
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

    videos.forEach(videoId => {
        if (!videoId) return;

        const videoDiv = document.createElement("div");
        videoDiv.classList.add("video-item");

        const videoElement = document.createElement("video");
        videoElement.src = `https://uploads-ssl.webflow.com/${videoId}`;
        videoElement.controls = true;
        videoDiv.appendChild(videoElement);

        videoContainer.appendChild(videoDiv);
    });
}

// 🚀 Video-Feed für eingeloggten Nutzer laden
async function displayUserVideos() {
    try {
        const member = await window.$memberstackDom.getCurrentMember();
        currentWebflowMemberId = member?.data?.customFields?.['webflow-member-id'];
        console.log("👤 Eingeloggter Nutzer Webflow-ID:", currentWebflowMemberId);

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

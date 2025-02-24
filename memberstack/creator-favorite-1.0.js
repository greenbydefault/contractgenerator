// 🌐 Optimierte Webflow API Integration für gefilterte Member-Ausgabe

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url=";
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";

// 🛠️ Hilfsfunktion für Worker-URL
function buildWorkerUrl(apiUrl) {
    return `${WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

// 📥 Daten der User-Collection abrufen und filtern
async function fetchAndFilterUsers() {
    const apiUrl = `${API_BASE_URL}/${USER_COLLECTION_ID}/items?limit=100`;
    const workerUrl = buildWorkerUrl(apiUrl);

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }

        const { items } = await response.json();

        // 🔍 Filtern nach user-is-a-brand=false und likes > 0
        const filteredUsers = items.filter(user => 
            user?.fieldData?.["user-is-a-brand"] === false && 
            (user?.fieldData?.likes || 0) > 0
        );

        renderUsers(filteredUsers);
    } catch (error) {
        console.error("❌ Fehler beim Abrufen und Filtern der Nutzer:", error.message);
    }
}

// 🖨️ Nutzer anzeigen
function renderUsers(users) {
    const container = document.getElementById("user-list");
    container.innerHTML = "";

    if (users.length === 0) {
        container.innerHTML = "<p>Keine passenden Mitglieder gefunden.</p>";
        return;
    }

    users.forEach(user => {
        const userData = user.fieldData;

        const userDiv = document.createElement("div");
        userDiv.classList.add("user-item");

        // Hidden Input für Jetboost
        const jetboostInput = document.createElement("input");
        jetboostInput.type = "hidden";
        jetboostInput.classList.add("jetboost-list-item");
        jetboostInput.value = user.slug;
        userDiv.appendChild(jetboostInput);

        // Nutzerdetails
        userDiv.innerHTML += `
            <p><strong>Name:</strong> ${userData.name || "Unbekannt"}</p>
            <p><strong>Kategorie:</strong> ${userData["creator-main-categorie"] || "Nicht angegeben"}</p>
            <p><strong>Typ:</strong> ${userData["creator-type"] || "Nicht angegeben"}</p>
            <p><strong>Stadt:</strong> ${userData["user-city-2"] || "Nicht angegeben"}</p>
        `;

        container.appendChild(userDiv);
    });
}

// 🌟 Start der Anwendung
window.addEventListener("DOMContentLoaded", fetchAndFilterUsers);

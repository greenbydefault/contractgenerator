// 🌐 Optimierte Webflow API Integration für gefilterte Member-Ausgabe

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url=";
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";

// 🛠️ Hilfsfunktion für Worker-URL
function buildWorkerUrl(apiUrl) {
    return `${WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

// 📥 Alle Seiten der User-Collection abrufen und filtern
async function fetchAllUsers() {
    let users = [];
    let nextPage = `${API_BASE_URL}/${USER_COLLECTION_ID}/items?limit=100`;

    try {
        while (nextPage) {
            const workerUrl = buildWorkerUrl(nextPage);
            const response = await fetch(workerUrl);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
            }

            const { items, pagination } = await response.json();
            console.log(`🔍 Abgerufene Nutzer: ${items.length}`);
            users = users.concat(items);

            nextPage = pagination?.nextPage ? `${API_BASE_URL}/${USER_COLLECTION_ID}/items?after=${pagination.nextPage}` : null;
        }

        console.log(`✅ Gesamtanzahl der abgerufenen Nutzer: ${users.length}`);
        return users;
    } catch (error) {
        console.error("❌ Fehler beim Abrufen der Nutzer:", error.message);
        return [];
    }
}

// 🔍 Filtern und Rendern der Nutzer
async function fetchAndFilterUsers() {
    const users = await fetchAllUsers();

    // Filter: user-is-a-brand = false und likes > 0
    const filteredUsers = users.filter(user => 
        user?.fieldData?.['user-is-a-brand'] === false &&
        (user?.fieldData?.likes || 0) > 0
    );

    console.log(`🎛️ Gefilterte Nutzer: ${filteredUsers.length}`);
    renderUsers(filteredUsers);
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
        const userSlug = user.slug || user._id; // Sicherstellen, dass der Slug vorhanden ist

        console.log(`👤 Nutzer: ${userData.name || 'Unbekannt'}, Slug: ${userSlug}`);

        const userDiv = document.createElement("div");
        userDiv.classList.add("user-item");

        // Hidden Input für Jetboost
        const jetboostInput = document.createElement("input");
        jetboostInput.type = "hidden";
        jetboostInput.classList.add("jetboost-list-item");
        jetboostInput.value = userSlug;
        userDiv.appendChild(jetboostInput);

        // Nutzerdetails
        userDiv.innerHTML += `
            <p><strong>Name:</strong> ${userData.name || "Unbekannt"}</p>
            <p><strong>Kategorie:</strong> ${userData['creator-main-categorie'] || "Nicht angegeben"}</p>
            <p><strong>Typ:</strong> ${userData['creator-type'] || "Nicht angegeben"}</p>
            <p><strong>Stadt:</strong> ${userData['user-city-2'] || "Nicht angegeben"}</p>
        `;

        container.appendChild(userDiv);
    });
}

// 🌟 Start der Anwendung
window.addEventListener("DOMContentLoaded", fetchAndFilterUsers);

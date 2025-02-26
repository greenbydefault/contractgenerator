// 🌐 Optimierte Webflow API Integration für gefilterte Member-Ausgabe

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url=";
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";
const BATCH_SIZE = 100; // Anzahl gleichzeitiger API-Anfragen
const RATE_LIMIT_DELAY = 500; // Wartezeit zwischen den Anfragen in Millisekunden

// 🛠️ Hilfsfunktion für Worker-URL
function buildWorkerUrl(apiUrl) {
    return `${WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

// 📥 Alle Seiten der User-Collection abrufen und filtern
async function fetchAllUsers() {
    let users = [];
    let offset = 0;
    const limit = 100;

    async function fetchPage(offset) {
        let apiUrl = `${API_BASE_URL}/${USER_COLLECTION_ID}/items/live?limit=${limit}&offset=${offset}`;
        const workerUrl = buildWorkerUrl(apiUrl);

        for (let retry = 0; retry < 5; retry++) {
            try {
                console.log(`🔄 Abruf der Seite mit Offset ${offset}`);
                const response = await fetch(workerUrl);

                if (response.ok) {
                    const { items } = await response.json();
                    console.log(`✅ Abgerufen: ${items.length} Nutzer bei Offset ${offset}`);
                    return items;
                }

                if (response.status === 429) {
                    console.warn(`⚠️ Rate Limit erreicht. Warte ${RATE_LIMIT_DELAY}ms...`);
                    await new Promise(res => setTimeout(res, RATE_LIMIT_DELAY * (retry + 1))); // Exponentielles Backoff
                } else {
                    throw new Error(`API-Fehler: ${response.status}`);
                }
            } catch (error) {
                console.error(`❌ Fehler bei Offset ${offset}: ${error.message}`);
            }
        }

        return [];
    }

    while (true) {
        const batchPromises = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
            batchPromises.push(fetchPage(offset));
            offset += limit;
        }

        const batchResults = await Promise.all(batchPromises);
        const batchUsers = batchResults.flat();

        users.push(...batchUsers);
        console.log(`📦 Aktuell gesammelte Nutzer: ${users.length}`);

        if (batchUsers.length < BATCH_SIZE * limit) break; // Ende, wenn weniger als erwartet zurückkommt
    }

    console.log(`🏁 Gesamte Nutzeranzahl: ${users.length}`);
    return users;
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

    // Erstelle den Collection Wrapper nur einmal
    const wrapperDiv = document.createElement("div");
    wrapperDiv.classList.add("db-favorite-list");

    users.forEach(user => {
        const userData = user.fieldData;
        const userSlug = user.slug || user._id;

        const userDiv = document.createElement("div");
        userDiv.classList.add("db-table-coll-item");
        userDiv.setAttribute("data-jetboost-favorite", userSlug);

        // Hidden Input für Jetboost
        const jetboostInput = document.createElement("input");
        jetboostInput.type = "hidden";
        jetboostInput.classList.add("jetboost-list-item");
        jetboostInput.value = userSlug;
        userDiv.appendChild(jetboostInput);

        // Nutzer Details mit Struktur
        const userRow = document.createElement("div");
        userRow.classList.add("db-table-row", "db-table-fav");

        userRow.innerHTML = `
            <div class="db-table-row-item is-txt-16"><strong>Name:</strong> ${userData.name || "Unbekannt"}</div>
            <div class="db-table-row-item is-txt-16"><strong>Kategorie:</strong> ${userData['creator-main-categorie'] || "Nicht angegeben"}</div>
            <div class="db-table-row-item is-txt-16"><strong>Typ:</strong> ${userData['creator-type'] || "Nicht angegeben"}</div>
            <div class="db-table-row-item is-txt-16"><strong>Stadt:</strong> ${userData['user-city-2'] || "Nicht angegeben"}</div>
        `;

        userDiv.appendChild(userRow);
        wrapperDiv.appendChild(userDiv);
    });

    container.appendChild(wrapperDiv);
}

// 🌟 Start der Anwendung
window.addEventListener("DOMContentLoaded", fetchAndFilterUsers);

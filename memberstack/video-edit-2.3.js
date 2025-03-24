// Hilfsfunktionen für den Fortschrittsbalken
// Aktualisiere den benutzerdefinierten Fortschrittsbalken
function updateCustomProgressBar(modalElement, progress, isSuccess = true, errorMessage = "", isWarning = false) {
    // Finde die Fortschrittsbalken-Elemente im aktuellen Modal-Kontext
    const progressBar = modalElement.querySelector(`[${window.WEBFLOW_API.PROGRESS_BAR_ATTR}]`);
    const progressText = modalElement.querySelector(`[${window.WEBFLOW_API.PROGRESS_TEXT_ATTR}]`);
    const progressPercentage = modalElement.querySelector(`[${window.WEBFLOW_API.PROGRESS_PERCENTAGE_ATTR}]`);
    const progressImg = modalElement.querySelector(`[${window.WEBFLOW_API.PROGRESS_IMG_ATTR}]`);
    
    if (!progressBar || !progressText || !progressPercentage) {
        console.warn("⚠️ Fortschrittsbalken-Elemente nicht gefunden");
        return;
    }
    
    // Konvertiere Fortschritt in Prozent
    const percent = Math.round(progress * 100);
    
    // Aktualisiere die Fortschrittsbalken-Breite
    progressBar.style.width = `${percent}%`;
    
    // Aktualisiere die Prozentanzeige
    progressPercentage.textContent = `${percent}%`;
    
    // Färbe den Balken je nach Status
    if (isWarning) {
        // Warnungszustand - gelb
        progressBar.style.backgroundColor = '#FFC107'; 
        progressText.textContent = errorMessage || "Aktion teilweise erfolgreich, aber es gibt ein Problem.";
    } else if (isSuccess) {
        // Erfolg - grün
        progressBar.style.backgroundColor = '#4CAF50'; 
        progressText.textContent = percent === 100 ? "Aktion erfolgreich abgeschlossen!" : "Wird bearbeitet...";
    } else {
        // Fehler - rot
        progressBar.style.backgroundColor = '#FF6974'; 
        progressText.textContent = errorMessage || "Es ist leider ein Fehler aufgetreten. Bitte versuche es erneut.";
    }

    // Optional: Bild aktualisieren, falls vorhanden
    if (progressImg) {
        // Hier könnte das Bild je nach Status geändert werden
        // z.B. progressImg.src = isSuccess ? 'success.png' : 'error.png';
    }
}

// Zeige den benutzerdefinierten Fortschrittsbalken an
function showCustomProgressBar(modalElement) {
    const progressWrapper = modalElement.querySelector(`[${window.WEBFLOW_API.PROGRESS_WRAPPER_ATTR}]`);
    
    if (progressWrapper) {
        progressWrapper.style.display = 'block';
        updateCustomProgressBar(modalElement, 0, true); // Initialisiere den Balken mit 0%
    } else {
        console.warn("⚠️ Fortschrittsbalken-Wrapper nicht gefunden");
    }
}

// Verstecke den benutzerdefinierten Fortschrittsbalken
function hideCustomProgressBar(modalElement) {
    const progressWrapper = modalElement.querySelector(`[${window.WEBFLOW_API.PROGRESS_WRAPPER_ATTR}]`);
    
    if (progressWrapper) {
        progressWrapper.style.display = 'none';
    }
}// 🔧 Konfiguration - Globale Konstanten
window.WEBFLOW_API = window.WEBFLOW_API || {};

// Grundkonfiguration
window.WEBFLOW_API = {
    ...window.WEBFLOW_API,
    BASE_URL: "https://api.webflow.com/v2/collections",
    WORKER_BASE_URL: "https://upload.oliver-258.workers.dev/?url=",
    COLLECTION_ID: "67d806e65cadcadf2f41e659", // Collection ID für Videos
    MEMBERS_COLLECTION_ID: "6448faf9c5a8a15f6cc05526", // Collection ID für Members
    DEBUG_MODE: true,
    
    // Edit-spezifische Werte
    EDIT_MODAL_ID: "upload-edit",
    EDIT_FORM_ID: "video-edit-form",
    EDIT_NAME_FIELD: "Name Edit",
    EDIT_CATEGORY_FIELD: "Kategorie Edit",
    EDIT_DESCRIPTION_FIELD: "Beschreibung Edit",
    EDIT_PUBLIC_FIELD: "Open Video Edit",
    EDIT_SAVE_BUTTON: "video-edit-save",
    EDIT_DELETE_BUTTON: "video-delete-button",
    DELETE_CONFIRM_MODAL_ID: "delete-confirm-modal",
    UPLOADCARE_WORKER_URL: "https://deleteuploadcare.oliver-258.workers.dev", // Dein Worker für Uploadcare-Operationen
    NAME_CHAR_LIMIT: 64,
    DESCRIPTION_CHAR_LIMIT: 144,
    
    // TEMPORÄRER BYPASS für Uploadcare-Löschung
    // Auf true setzen, um die Uploadcare-Löschung zu überspringen, falls der Worker Probleme macht
    SKIP_UPLOADCARE_DELETE: true
};

// Explizite Zuweisung des Kategorie-Mappings (separat, um Konflikte zu vermeiden)
window.WEBFLOW_API.CATEGORY_MAPPING = {
    "a6a0530c5c476df59cb16022541a8233": "Travel",
    "f7375698898acddde00653547c8fa793": "Entertainment",
    "0e068df04f18438e4a5b68d397782f36": "Food",
    "2f1f2fe0cd35ddd19ca98f4b85b16258": "Beauty",
    "d98ec62473786dfe4b680ffaff56df3d": "Fashion",
    "7a825bdb2886afb7afc15ace93407334": "Fitness",
    "172297c1eff716fecb37e1086835fb54": "Technology",
    "0150c802834f25c5eb9a235e5f333086": "Gaming",
    "827b3ec71e6dd2e64687ac4a2bcde003": "Art & Culture",
    "17907bdb5206dc3d81ffc984f810e58b": "Household",
    "d9e7f4c91b3e5a8022c3a6497f1d8b55": "Home & Living" 
};

// 🛠️ Hilfsfunktion zur Erstellung der Worker-URL (identisch zum Upload-Script)
function buildWorkerUrl(apiUrl) {
    return `${window.WEBFLOW_API.WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

// Speichert das aktuell bearbeitete Video
let currentVideoData = null;

// 📥 Video bearbeiten - Öffnet das Modal und füllt die Felder
async function editVideo(videoId) {
    if (!videoId) {
        console.error("❌ Keine Video-ID zum Bearbeiten übergeben");
        return;
    }

    console.log(`🔍 Lade Video-Informationen für ID: ${videoId}`);

    try {
        // Hole die Video-Informationen vom Webflow CMS
        const videoData = await getVideoById(videoId);
        
        if (!videoData) {
            throw new Error(`Video mit ID ${videoId} konnte nicht geladen werden`);
        }

        // Speichere das aktuelle Video für spätere Verwendung
        currentVideoData = videoData;

        // Öffne das Edit-Modal
        const editModal = document.querySelector(`[data-modal-id="${window.WEBFLOW_API.EDIT_MODAL_ID}"]`);
        if (editModal && window.modalManager) {
            window.modalManager.openModal(editModal);
        } else {
            console.warn("⚠️ Modal oder Modal-Manager nicht gefunden");
        }

        // Fülle die Formularfelder mit den vorhandenen Daten
        await fillEditForm(videoData);

        // Initialisiere die Zeichenzähler für die Text-Eingabefelder
        initCharacterCounters();

    } catch (error) {
        console.error("❌ Fehler beim Laden der Video-Informationen:", error);
        alert("Das Video konnte nicht geladen werden. Bitte versuche es später erneut.");
    }
}

// Hilfsfunktion zum Abrufen eines Videos anhand seiner ID
async function getVideoById(videoId) {
    try {
        const apiUrl = `${window.WEBFLOW_API.BASE_URL}/${window.WEBFLOW_API.COLLECTION_ID}/items/${videoId}`;
        const workerUrl = buildWorkerUrl(apiUrl);
        
        console.log(`🔍 Rufe Video mit ID ${videoId} ab...`);
        
        const response = await fetch(workerUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const responseText = await response.text();
        
        if (!response.ok) {
            console.error("📄 API-Antwort (Video abrufen):", responseText);
            throw new Error(`API-Fehler beim Abrufen des Videos: ${response.status} - ${responseText}`);
        }

        try {
            const videoData = JSON.parse(responseText);
            console.log("✅ Video erfolgreich abgerufen:", videoData);
            return videoData;
        } catch (e) {
            console.warn("⚠️ Konnte API-Antwort nicht als JSON parsen:", responseText);
            return null;
        }
    } catch (error) {
        console.error("❌ Fehler beim Abrufen des Videos:", error);
        return null;
    }
}

// Funktion zum Abrufen der Kategorie-Namen aus dem Mapping
function getCategoryName(categoryId) {
    if (!categoryId) return "";
    
    // Prüfe, ob die Kategorie-ID im Mapping existiert
    if (window.WEBFLOW_API.CATEGORY_MAPPING && window.WEBFLOW_API.CATEGORY_MAPPING[categoryId]) {
        return window.WEBFLOW_API.CATEGORY_MAPPING[categoryId];
    }
    
    // Fallback: Gib die ID zurück, wenn kein Mapping gefunden wurde
    console.warn(`⚠️ Keine Kategorie-Zuordnung für ID: ${categoryId}`);
    return categoryId;
}

// Formular mit Video-Daten füllen
async function fillEditForm(videoData) {
    if (!videoData || !videoData.fieldData) {
        console.warn("⚠️ Keine Video-Daten zum Füllen des Formulars");
        return;
    }

    // Suche nach dem Formular
    const form = document.getElementById(window.WEBFLOW_API.EDIT_FORM_ID) || 
                 document.querySelector(`[data-modal-id="${window.WEBFLOW_API.EDIT_MODAL_ID}"] form`);
    
    if (!form) {
        console.warn("⚠️ Edit-Formular nicht gefunden");
        return;
    }

    // Hilfsfunktion zum Setzen von Feldwerten
    function setFieldValue(fieldName, value) {
        // Suche nach verschiedenen Selector-Varianten
        const selectors = [
            `[name="${fieldName}"]`,
            `[data-name="${fieldName}"]`, 
            `#${fieldName.replace(/\s+/g, "-").toLowerCase()}`
        ];
        
        let field = null;
        
        // Versuche verschiedene Selektoren
        for (const selector of selectors) {
            field = form.querySelector(selector);
            if (field) break;
        }
        
        if (!field) {
            console.warn(`⚠️ Feld '${fieldName}' nicht gefunden`);
            return;
        }
        
        // Setze den Wert je nach Feldtyp
        if (field.type === 'checkbox') {
            field.checked = !!value;
        } else {
            field.value = value || "";
        }
        
        console.log(`✅ Feld '${fieldName}' gesetzt:`, value);
    }
    
    // Versuche, die Kategorie-ID in einen lesbaren Namen umzuwandeln
    let categoryValue = videoData.fieldData["video-kategorie"];
    let categoryName = categoryValue;
    
    // Versuche, den Kategorie-Namen aus dem Mapping zu finden
    if (categoryValue && typeof categoryValue === 'string') {
        console.log(`🔍 Suche Kategorie-Mapping für ID: ${categoryValue}`);
        console.log("📊 Verfügbare Kategorien:", window.WEBFLOW_API.CATEGORY_MAPPING);
        
        const mappedName = getCategoryName(categoryValue);
        if (mappedName !== categoryValue) {
            categoryName = mappedName;
            console.log(`✅ Kategorie-Name aus Mapping gefunden: ${categoryName} für ID: ${categoryValue}`);
        }
    }
    
    // Felder füllen
    setFieldValue(window.WEBFLOW_API.EDIT_NAME_FIELD, videoData.fieldData["video-name"] || videoData.fieldData["name"]);
    setFieldValue(window.WEBFLOW_API.EDIT_CATEGORY_FIELD, categoryName);
    setFieldValue(window.WEBFLOW_API.EDIT_DESCRIPTION_FIELD, videoData.fieldData["video-beschreibung"]);
    setFieldValue(window.WEBFLOW_API.EDIT_PUBLIC_FIELD, videoData.fieldData["offentliches-video"]);
}

// Initialisiere die Zeichenzähler für Name und Beschreibung
function initCharacterCounters() {
    const form = document.getElementById(window.WEBFLOW_API.EDIT_FORM_ID) || 
                 document.querySelector(`[data-modal-id="${window.WEBFLOW_API.EDIT_MODAL_ID}"] form`);
    
    if (!form) {
        console.warn("⚠️ Formular für Zeichenzähler nicht gefunden");
        return;
    }
    
    // Finde die Eingabefelder und ihre Counter-Elemente
    const nameField = findField(form, window.WEBFLOW_API.EDIT_NAME_FIELD);
    const descriptionField = findField(form, window.WEBFLOW_API.EDIT_DESCRIPTION_FIELD);
    
    if (nameField) {
        setupCharacterCounter(nameField, window.WEBFLOW_API.NAME_CHAR_LIMIT);
    }
    
    if (descriptionField) {
        setupCharacterCounter(descriptionField, window.WEBFLOW_API.DESCRIPTION_CHAR_LIMIT);
    }
    
    console.log("✅ Zeichenzähler initialisiert");
}

// Hilfsfunktion zum Finden eines Formularfeldes
function findField(form, fieldName) {
    const selectors = [
        `[name="${fieldName}"]`,
        `[data-name="${fieldName}"]`, 
        `#${fieldName.replace(/\s+/g, "-").toLowerCase()}`
    ];
    
    for (const selector of selectors) {
        const field = form.querySelector(selector);
        if (field) return field;
    }
    
    console.warn(`⚠️ Feld '${fieldName}' für Zeichenzähler nicht gefunden`);
    return null;
}

// Zeichenzähler für ein Feld einrichten
function setupCharacterCounter(field, limit) {
    // Prüfe, ob das Feld ein Counter-Element angegeben hat
    const counterSelector = field.getAttribute('data-char-counter');
    let counterElement = null;
    
    if (counterSelector) {
        // Wenn ein Selektor im data-Attribut angegeben ist, suche das Element
        counterElement = document.querySelector(counterSelector);
    } else {
        // Wenn kein Selektor angegeben ist, erstelle ein neues Element
        const counterEl = document.createElement('div');
        counterEl.className = 'char-counter';
        counterEl.style.marginTop = '5px';
        counterEl.style.fontSize = '12px';
        counterEl.style.color = '#666';
        
        // Füge das Counter-Element nach dem Feld ein
        field.parentNode.insertBefore(counterEl, field.nextSibling);
        counterElement = counterEl;
    }
    
    if (!counterElement) {
        console.warn("⚠️ Kein Counter-Element für Feld gefunden:", field);
        return;
    }
    
    // Setze den Grenzwert als Attribut am Feld
    field.setAttribute('data-char-limit', limit);
    
    // Initiale Aktualisierung des Zählers
    updateCharCounter(field, counterElement);
    
    // Event-Listener für Eingaben
    field.addEventListener('input', () => {
        updateCharCounter(field, counterElement);
    });
    
    console.log(`✅ Zeichenzähler für Feld eingerichtet, Limit: ${limit}`);
}

// Aktualisiert den Zeichenzähler für ein Feld
function updateCharCounter(field, counterElement) {
    const limit = parseInt(field.getAttribute('data-char-limit') || "0", 10);
    const currentLength = field.value.length;
    const remaining = limit - currentLength;
    
    // Aktualisiere den Text des Zählers
    counterElement.textContent = `${currentLength}/${limit} Zeichen`;
    
    // Visuelles Feedback zum Zeichenlimit
    if (remaining < 0) {
        // Über dem Limit
        counterElement.style.color = '#cc0000';
        field.style.borderColor = '#cc0000';
    } else if (remaining < limit * 0.1) {
        // Fast am Limit (weniger als 10% übrig)
        counterElement.style.color = '#ff9900';
        field.style.borderColor = '#ff9900';
    } else {
        // Genug Platz
        counterElement.style.color = '#666';
        field.style.borderColor = '';
    }
}

// Video-Daten aktualisieren
async function updateVideo(formData) {
    if (!currentVideoData || !currentVideoData.id) {
        console.error("❌ Keine aktuellen Video-Daten zum Aktualisieren");
        return null;
    }

    try {
        const videoId = currentVideoData.id;
        const apiUrl = `${window.WEBFLOW_API.BASE_URL}/${window.WEBFLOW_API.COLLECTION_ID}/items/${videoId}`;
        const workerUrl = buildWorkerUrl(apiUrl);
        
        // Erstelle einen neuen Slug falls der Name geändert wurde
        let slug = formData.name.toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
        
        // Die Webflow API erwartet dieses Format für ein Update
        const payload = {
            isArchived: currentVideoData.isArchived || false,
            isDraft: currentVideoData.isDraft || false,
            fieldData: {
                // Behalte alle bestehenden Felder bei
                ...currentVideoData.fieldData,
                // Überschreibe die zu ändernden Felder
                "name": formData.name || currentVideoData.fieldData["name"],
                "slug": slug || currentVideoData.fieldData["slug"],
                "video-name": formData.name || currentVideoData.fieldData["video-name"],
                "video-kategorie": formData.kategorie || currentVideoData.fieldData["video-kategorie"],
                "video-beschreibung": formData.beschreibung || currentVideoData.fieldData["video-beschreibung"],
                "offentliches-video": formData.openVideo
            }
        };

        if (window.WEBFLOW_API.DEBUG_MODE) {
            console.log("📤 Sende Update-Daten an Webflow API:", payload);
        }

        // Versuche zuerst mit PATCH, dann mit PUT wenn PATCH fehlschlägt
        let response;
        try {
            console.log("🔄 Versuche Update mit PATCH...");
            response = await fetch(workerUrl, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
        } catch (corsError) {
            console.warn("⚠️ PATCH fehlgeschlagen, versuche mit PUT...", corsError);
            
            response = await fetch(workerUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
        }

        const responseText = await response.text();
        
        if (!response.ok) {
            console.error("📄 API-Antwort (Video-Update):", responseText);
            throw new Error(`API-Fehler beim Aktualisieren des Videos: ${response.status} - ${responseText}`);
        }

        try {
            const responseData = JSON.parse(responseText);
            console.log("✅ Video erfolgreich aktualisiert:", responseData);
            return responseData;
        } catch (e) {
            console.warn("⚠️ Konnte API-Antwort nicht als JSON parsen:", responseText);
            return { success: true, raw: responseText };
        }
    } catch (error) {
        console.error("❌ Fehler beim Aktualisieren des Videos:", error);
        throw error;
    }
}

/**
 * Uploadcare-Datei UUID aus Video-URL extrahieren
 * @param {string} videoUrl - Die URL des Videos
 * @returns {string|null} Die Uploadcare UUID oder null, wenn keine gefunden wurde
 */
function extractUploadcareUuid(videoUrl) {
    if (!videoUrl) return null;

    // Überprüfen, ob es eine Uploadcare-URL ist
    if (videoUrl.includes('ucarecdn.com')) {
        // Extrahiere die UUID aus der URL (Format: https://ucarecdn.com/UUID/filename)
        const uuidMatch = videoUrl.match(/ucarecdn\.com\/([a-f0-9-]+)/i);
        if (uuidMatch && uuidMatch[1]) {
            return uuidMatch[1];
        }
    }
    
    // Überprüfe auf einen direkten Uploadcare-Dateilink (cdnX.uploadcare)
    if (videoUrl.includes('uploadcare')) {
        const uuidMatch = videoUrl.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (uuidMatch && uuidMatch[1]) {
            return uuidMatch[1];
        }
    }

    console.warn("⚠️ Konnte keine Uploadcare UUID aus der URL extrahieren:", videoUrl);
    return null;
}

/**
 * Lösche eine Datei von Uploadcare
 * @param {string} fileUuid - Die UUID der zu löschenden Datei
 * @returns {Promise<boolean>} True, wenn erfolgreich gelöscht
 */
async function deleteUploadcareFile(fileUuid) {
    if (!fileUuid) {
        console.error("❌ Keine Uploadcare-UUID zum Löschen angegeben");
        return false;
    }

    try {
        console.log(`🗑️ Lösche Uploadcare-Datei mit UUID: ${fileUuid}`);
        
        // Verwende den Worker für die Uploadcare-API
        // Wichtig: Der aktuelle Worker akzeptiert nur POST und OPTIONS, nicht DELETE oder GET für die Löschfunktion
        const response = await fetch(`${window.WEBFLOW_API.UPLOADCARE_WORKER_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.uploadcare-v0.7+json'
            },
            // Sende die UUID im Body statt als URL-Parameter
            body: JSON.stringify({
                uuid: fileUuid,
                action: 'delete'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Fehler beim Löschen der Uploadcare-Datei:", response.status, errorText);
            return false;
        }

        console.log(`✅ Uploadcare-Datei ${fileUuid} erfolgreich gelöscht`);
        return true;
    } catch (error) {
        console.error("❌ Fehler beim Löschen der Uploadcare-Datei:", error);
        return false;
    }
}

// Hilfsfunktion zum Entfernen eines Videos aus dem Member-Feed
async function removeVideoFromMemberFeed(memberId, videoId) {
    if (!memberId || !videoId) {
        console.error("❌ Member ID oder Video ID fehlt");
        return null;
    }

    try {
        // Prüfen, ob es sich um eine Memberstack-ID handelt (beginnt mit "mem_")
        const isMemberstackId = memberId.startsWith("mem_");
        
        let member;
        
        if (isMemberstackId) {
            console.log("🔍 Memberstack-ID erkannt. Suche nach zugehörigem Webflow-Member...");
            
            // Nach Webflow-Member mit dieser Memberstack-ID suchen
            const filterQuery = `{"memberstack-id":{"eq":"${memberId}"}}`;
            const apiUrl = `${window.WEBFLOW_API.BASE_URL}/${window.WEBFLOW_API.MEMBERS_COLLECTION_ID}/items?live=true&limit=1&filter=${encodeURIComponent(filterQuery)}`;
            const workerUrl = buildWorkerUrl(apiUrl);
            
            const response = await fetch(workerUrl);
            
            if (!response.ok) {
                throw new Error(`Konnte keinen Member mit Memberstack-ID ${memberId} finden`);
            }
            
            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                throw new Error(`Kein Member mit Memberstack-ID ${memberId} gefunden`);
            }
            
            member = data.items[0];
            console.log(`✅ Webflow-Member mit ID ${member.id} gefunden für Memberstack-ID ${memberId}`);
        } else {
            // Es ist bereits eine Webflow-ID, direkt abfragen
            const apiUrl = `${window.WEBFLOW_API.BASE_URL}/${window.WEBFLOW_API.MEMBERS_COLLECTION_ID}/items/${memberId}`;
            const workerUrl = buildWorkerUrl(apiUrl);
            
            const response = await fetch(workerUrl);
            
            if (!response.ok) {
                throw new Error(`Konnte Member mit ID ${memberId} nicht abrufen`);
            }
            
            member = await response.json();
        }
        
        if (!member) {
            throw new Error(`Kein Member gefunden`);
        }
        
        // Hole die aktuelle Video-Feed-Liste
        const currentVideoFeed = member.fieldData["video-feed"] || [];
        
        // Prüfe, ob das Video im Feed ist
        if (!currentVideoFeed.includes(videoId)) {
            console.log(`⚠️ Video ${videoId} ist nicht im Feed des Members`);
            return member; // Keine Änderung notwendig
        }
        
        // Entferne das Video aus der Liste
        const updatedVideoFeed = currentVideoFeed.filter(id => id !== videoId);
        
        console.log(`🔄 Aktualisiere Video-Feed für Member ${member.id}:`, updatedVideoFeed);
        
        // Erstelle die API-URL zum Aktualisieren des Members
        const updateUrl = `${window.WEBFLOW_API.BASE_URL}/${window.WEBFLOW_API.MEMBERS_COLLECTION_ID}/items/${member.id}`;
        const updateWorkerUrl = buildWorkerUrl(updateUrl);
        
        // Baue den Payload für das Update mit PATCH - nur das zu ändernde Feld
        const payload = {
            isArchived: false,
            isDraft: false,
            fieldData: {
                // Nur das Feld aktualisieren, das wir ändern möchten
                "video-feed": updatedVideoFeed
            }
        };
        
        if (window.WEBFLOW_API.DEBUG_MODE) {
            console.log("📤 Sende Member-Update an Webflow API:", payload);
        }
        
        // Versuche zuerst mit PATCH, dann mit PUT, wenn PATCH fehlschlägt
        let updateResponse;
        try {
            console.log("🔄 Versuche Update mit PATCH...");
            updateResponse = await fetch(updateWorkerUrl, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
        } catch (corsError) {
            console.warn("⚠️ PATCH fehlgeschlagen, versuche mit PUT...", corsError);
            
            // Bei PUT müssen wir alle Felder beibehalten
            const putPayload = {
                isArchived: member.isArchived || false,
                isDraft: member.isDraft || false,
                fieldData: {
                    // Füge alle bestehenden Felder bei (kopiere das gesamte fieldData)
                    ...member.fieldData,
                    // Überschreibe nur das video-feed Feld
                    "video-feed": updatedVideoFeed
                }
            };
            
            updateResponse = await fetch(updateWorkerUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(putPayload)
            });
        }

        if (!updateResponse.ok) {
            const responseText = await updateResponse.text();
            console.error("📄 API-Antwort (Member-Update):", responseText);
            throw new Error(`API-Fehler bei Member-Update: ${updateResponse.status} - ${responseText}`);
        }
        
        console.log("✅ Member erfolgreich aktualisiert - Video aus Feed entfernt");
        return await updateResponse.json();
    } catch (error) {
        console.error("❌ Fehler beim Aktualisieren des Member Video-Feeds:", error);
        throw error;
    }
}

// Video löschen
async function deleteVideo(videoId) {
    if (!videoId) {
        console.error("❌ Keine Video-ID zum Löschen übergeben");
        return false;
    }

    try {
        console.log(`🗑️ Lösche Video mit ID: ${videoId}`);
        
        // 1. Zuerst Video-Daten abrufen (falls noch nicht geladen)
        const videoData = currentVideoData || await getVideoById(videoId);
        if (!videoData) {
            throw new Error("Video-Daten konnten nicht geladen werden");
        }
        
        // 2. Uploadcare-Datei löschen, falls vorhanden UND SKIP_UPLOADCARE_DELETE nicht aktiviert ist
        if (videoData && videoData.fieldData["video-link"] && !window.WEBFLOW_API.SKIP_UPLOADCARE_DELETE) {
            const videoUrl = videoData.fieldData["video-link"];
            const fileUuid = extractUploadcareUuid(videoUrl);
            
            if (fileUuid) {
                console.log(`🔍 Uploadcare-UUID gefunden: ${fileUuid}`);
                try {
                    // Wir brechen ab, wenn die Uploadcare-Datei nicht gelöscht werden kann
                    const uploadcareDeleted = await deleteUploadcareFile(fileUuid);
                    if (!uploadcareDeleted) {
                        console.error("❌ Uploadcare-Datei konnte nicht gelöscht werden. Breche Löschvorgang ab.");
                        return false;
                    }
                    console.log("✅ Uploadcare-Datei erfolgreich gelöscht. Fahre mit Webflow-Löschung fort.");
                } catch (uploadcareError) {
                    console.error("❌ Fehler beim Löschen der Uploadcare-Datei:", uploadcareError);
                    console.error("❌ Abbruch des Löschvorgangs, um Dateninkonsistenzen zu vermeiden.");
                    return false;
                }
            }
        } else if (window.WEBFLOW_API.SKIP_UPLOADCARE_DELETE) {
            console.warn("⚠️ SKIP_UPLOADCARE_DELETE ist aktiviert. Uploadcare-Dateien werden nicht gelöscht!");
            console.warn("⚠️ Dies kann zu 'Datei-Leichen' in Uploadcare führen!");
        }
        
        // 3. Versuche, das Video aus dem Member-Feed zu entfernen
        if (videoData && (videoData.fieldData["webflow-id"] || videoData.fieldData["memberstack-id"])) {
            try {
                const webflowMemberId = videoData.fieldData["webflow-id"];
                const memberstackMemberId = videoData.fieldData["memberstack-id"];
                
                console.log("👤 Entferne Video aus dem Member-Feed...");
                
                // Versuche mit beiden IDs, falls verfügbar
                if (webflowMemberId) {
                    await removeVideoFromMemberFeed(webflowMemberId, videoId);
                }
                
                if (memberstackMemberId && memberstackMemberId !== webflowMemberId) {
                    await removeVideoFromMemberFeed(memberstackMemberId, videoId);
                }
            } catch (memberError) {
                console.warn("⚠️ Fehler beim Entfernen aus dem Member-Feed:", memberError);
                // Wir können hier weitermachen
            }
        }
        
        // 4. Das Video im CMS löschen
        const apiUrl = `${window.WEBFLOW_API.BASE_URL}/${window.WEBFLOW_API.COLLECTION_ID}/items/${videoId}`;
        const workerUrl = buildWorkerUrl(apiUrl);
        
        const response = await fetch(workerUrl, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        });
        
        // Bei DELETE gibt die API möglicherweise keinen Inhalt zurück (204 No Content)
        if (response.status === 204 || response.ok) {
            console.log("✅ Video erfolgreich gelöscht");
            
            // Zeige Warnung, wenn die Uploadcare-Datei nicht gelöscht wurde
            if (window.WEBFLOW_API.SKIP_UPLOADCARE_DELETE) {
                console.warn("✅ Video gelöscht, aber Uploadcare-Datei bleibt bestehen!");
            }
            
            return true;
        }
        
        const responseText = await response.text();
        console.error("📄 API-Antwort (Video löschen):", responseText);
        throw new Error(`API-Fehler beim Löschen des Videos: ${response.status} - ${responseText}`);
    } catch (error) {
        console.error("❌ Fehler beim Löschen des Videos:", error);
        return false;
    }
}

// Event-Listener für Edit-Button initialisieren
function initVideoEditButtons() {
    // Suchen nach allen Edit-Buttons mit data-video-id Attribut
    const editButtons = document.querySelectorAll('[data-video-edit]');
    
    editButtons.forEach(button => {
        const videoId = button.getAttribute('data-video-edit');
        if (videoId) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Verhindert, dass das Event an übergeordnete Elemente weitergegeben wird
                editVideo(videoId);
            });
        }
    });
    
    console.log(`✅ ${editButtons.length} Video-Edit-Buttons initialisiert`);
}

// Event-Listener für Save-Button initialisieren
function initSaveButton() {
    // Finde den Save-Button im Edit-Modal
    const saveButton = document.getElementById(window.WEBFLOW_API.EDIT_SAVE_BUTTON);
    
    if (!saveButton) {
        const editModal = document.querySelector(`[data-modal-id="${window.WEBFLOW_API.EDIT_MODAL_ID}"]`);
        if (editModal) {
            // Suche nach einem Button im Modal
            const fallbackButton = editModal.querySelector('input[type="submit"], button[type="submit"]');
            if (fallbackButton) {
                console.log("✅ Verwende Fallback-Button zum Speichern");
                initSaveButtonListener(fallbackButton);
                return;
            }
        }
        
        console.warn("⚠️ Kein Save-Button gefunden");
        return;
    }
    
    initSaveButtonListener(saveButton);
}

function initSaveButtonListener(button) {
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (!currentVideoData) {
            console.error("❌ Keine aktuellen Video-Daten zum Speichern");
            return;
        }
        
        // Finde das Modal-Element
        const editModal = document.querySelector(`[data-modal-id="${window.WEBFLOW_API.EDIT_MODAL_ID}"]`);
        if (!editModal) {
            console.error("❌ Edit-Modal nicht gefunden");
            return;
        }
        
        // Formular finden
        const form = document.getElementById(window.WEBFLOW_API.EDIT_FORM_ID) || 
                     document.querySelector(`[data-modal-id="${window.WEBFLOW_API.EDIT_MODAL_ID}"] form`);
        
        if (!form) {
            console.error("❌ Edit-Formular nicht gefunden");
            return;
        }
        
        // Validiere die Zeichenlänge
        const nameField = findField(form, window.WEBFLOW_API.EDIT_NAME_FIELD);
        const descField = findField(form, window.WEBFLOW_API.EDIT_DESCRIPTION_FIELD);
        
        if (nameField && nameField.value.length > window.WEBFLOW_API.NAME_CHAR_LIMIT) {
            // Zeige Fehlermeldung mit dem Fortschrittsbalken
            showCustomProgressBar(editModal);
            updateCustomProgressBar(editModal, 0.3, false, `Der Name darf maximal ${window.WEBFLOW_API.NAME_CHAR_LIMIT} Zeichen lang sein.`);
            nameField.focus();
            
            // Nach 3 Sekunden den Fortschrittsbalken ausblenden
            setTimeout(() => {
                hideCustomProgressBar(editModal);
            }, 3000);
            return;
        }
        
        if (descField && descField.value.length > window.WEBFLOW_API.DESCRIPTION_CHAR_LIMIT) {
            // Zeige Fehlermeldung mit dem Fortschrittsbalken
            showCustomProgressBar(editModal);
            updateCustomProgressBar(editModal, 0.3, false, `Die Beschreibung darf maximal ${window.WEBFLOW_API.DESCRIPTION_CHAR_LIMIT} Zeichen lang sein.`);
            descField.focus();
            
            // Nach 3 Sekunden den Fortschrittsbalken ausblenden
            setTimeout(() => {
                hideCustomProgressBar(editModal);
            }, 3000);
            return;
        }
        
        // Ändere den Button-Text während des Speicherns
        const originalText = button.value || button.textContent;
        button.disabled = true;
        if (button.type === 'submit') {
            button.value = "Wird gespeichert...";
        } else {
            button.textContent = "Wird gespeichert...";
        }
        
        // Zeige den Fortschrittsbalken an
        showCustomProgressBar(editModal);
        updateCustomProgressBar(editModal, 0.1, true, "Speichere Änderungen...");
        
        try {
            // Hole die Formulardaten
            const formData = {
                name: getValue(form, window.WEBFLOW_API.EDIT_NAME_FIELD, currentVideoData.fieldData["video-name"] || ""),
                kategorie: getValue(form, window.WEBFLOW_API.EDIT_CATEGORY_FIELD, currentVideoData.fieldData["video-kategorie"] || ""),
                beschreibung: getValue(form, window.WEBFLOW_API.EDIT_DESCRIPTION_FIELD, currentVideoData.fieldData["video-beschreibung"] || ""),
                openVideo: getChecked(form, window.WEBFLOW_API.EDIT_PUBLIC_FIELD)
            };
            
            // Validiere die Daten
            if (!formData.name) {
                // Zeige Fehlermeldung mit dem Fortschrittsbalken
                updateCustomProgressBar(editModal, 0.3, false, "Bitte gib einen Namen für das Video ein.");
                
                // Button zurücksetzen
                button.disabled = false;
                if (button.type === 'submit') {
                    button.value = originalText;
                } else {
                    button.textContent = originalText;
                }
                
                // Nach 3 Sekunden den Fortschrittsbalken ausblenden
                setTimeout(() => {
                    hideCustomProgressBar(editModal);
                }, 3000);
                return;
            }
            
            console.log("📝 Formulardaten zum Speichern:", formData);
            updateCustomProgressBar(editModal, 0.4, true, "Daten werden verarbeitet...");
            
            // Führe das Update durch
            const result = await updateVideo(formData);
            
            if (result) {
                console.log("✅ Video erfolgreich aktualisiert:", result);
                updateCustomProgressBar(editModal, 1.0, true, "Änderungen erfolgreich gespeichert!");
                
                // Nach einer kurzen Verzögerung das Modal schließen und die Seite neu laden
                setTimeout(() => {
                    // Schließe das Modal
                    if (editModal && window.modalManager) {
                        window.modalManager.closeModal(editModal);
                    }
                    
                    // Seite neu laden, um die Änderungen anzuzeigen
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }, 1500);
            } else {
                throw new Error("Unbekannter Fehler beim Aktualisieren des Videos");
            }
        } catch (error) {
            console.error("❌ Fehler beim Speichern:", error);
            updateCustomProgressBar(editModal, 0.5, false, "Fehler beim Speichern der Änderungen. Bitte versuche es erneut.");
        } finally {
            // Button zurücksetzen
            button.disabled = false;
            if (button.type === 'submit') {
                button.value = originalText;
            } else {
                button.textContent = originalText;
            }
        }
    });
    
    console.log("✅ Save-Button initialisiert");
}

// Event-Listener für Delete-Button initialisieren
function initDeleteButton() {
    // Finde den Delete-Button im Edit-Modal
    const deleteButton = document.getElementById(window.WEBFLOW_API.EDIT_DELETE_BUTTON);
    
    if (!deleteButton) {
        console.warn("⚠️ Kein Delete-Button gefunden");
        return;
    }
    
    deleteButton.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (!currentVideoData) {
            console.error("❌ Keine aktuellen Video-Daten zum Löschen");
            
            // Finde das Modal-Element
            const editModal = document.querySelector(`[data-modal-id="${window.WEBFLOW_API.EDIT_MODAL_ID}"]`);
            if (editModal) {
                // Zeige Fehlermeldung mit dem Fortschrittsbalken
                showCustomProgressBar(editModal);
                updateCustomProgressBar(editModal, 0.5, false, "Keine Video-Daten gefunden. Bitte lade die Seite neu.");
            }
            return;
        }
        
        // Bestätigungsdialog in Form des Fortschrittsbalkens
        const editModal = document.querySelector(`[data-modal-id="${window.WEBFLOW_API.EDIT_MODAL_ID}"]`);
        if (editModal) {
            // Zeige Bestätigungsdialog mit dem Fortschrittsbalken
            showCustomProgressBar(editModal);
            updateCustomProgressBar(editModal, 0, true, "Möchtest du dieses Video wirklich löschen?");
            
            // Verstecke den Lösch-Button vorübergehend
            deleteButton.style.display = 'none';
            
            // Erstelle Ja/Nein-Buttons
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'confirm-buttons';
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.gap = '10px';
            buttonContainer.style.marginTop = '15px';
            
            // Ja-Button (Bestätigung)
            const confirmButton = document.createElement('button');
            confirmButton.textContent = 'Ja, löschen';
            confirmButton.style.backgroundColor = '#FF6974';
            confirmButton.style.color = 'white';
            confirmButton.style.padding = '8px 16px';
            confirmButton.style.border = 'none';
            confirmButton.style.borderRadius = '4px';
            confirmButton.style.cursor = 'pointer';
            
            // Nein-Button (Abbrechen)
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Abbrechen';
            cancelButton.style.backgroundColor = '#E0E0E0';
            cancelButton.style.color = 'black';
            cancelButton.style.padding = '8px 16px';
            cancelButton.style.border = 'none';
            cancelButton.style.borderRadius = '4px';
            cancelButton.style.cursor = 'pointer';
            
            // Event-Listener für die Buttons
            confirmButton.addEventListener('click', () => {
                // Entferne die Buttons
                buttonContainer.remove();
                // Zeige den Lösch-Button wieder an
                deleteButton.style.display = '';
                // Führe die Löschung durch
                handleVideoDelete(currentVideoData.id, deleteButton);
            });
            
            cancelButton.addEventListener('click', () => {
                // Entferne die Buttons
                buttonContainer.remove();
                // Verstecke den Fortschrittsbalken
                hideCustomProgressBar(editModal);
                // Zeige den Lösch-Button wieder an
                deleteButton.style.display = '';
            });
            
            // Füge die Buttons zum Container hinzu
            buttonContainer.appendChild(cancelButton);
            buttonContainer.appendChild(confirmButton);
            
            // Finde den Fortschrittsbalken-Wrapper
            const progressWrapper = editModal.querySelector(`[${window.WEBFLOW_API.PROGRESS_WRAPPER_ATTR}]`);
            if (progressWrapper) {
                // Füge die Buttons nach dem Fortschrittsbalken ein
                progressWrapper.appendChild(buttonContainer);
            }
        } else {
            // Fallback auf den alten Bestätigungsdialog
            if (confirm("Bist du sicher, dass du dieses Video löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.")) {
                handleVideoDelete(currentVideoData.id, deleteButton);
            }
        }
    });
    
    console.log("✅ Delete-Button initialisiert");
}

// Hilfsfunktion zum Durchführen des Löschens
async function handleVideoDelete(videoId, button) {
    if (!videoId) {
        console.error("❌ Keine Video-ID zum Löschen");
        return;
    }
    
    // Finde das Modal-Element
    const editModal = document.querySelector(`[data-modal-id="${window.WEBFLOW_API.EDIT_MODAL_ID}"]`);
    if (!editModal) {
        console.error("❌ Edit-Modal nicht gefunden");
        return;
    }
    
    // Ändere den Button-Text während des Löschens
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Wird gelöscht...";
    
    // Zeige den Fortschrittsbalken an
    showCustomProgressBar(editModal);
    updateCustomProgressBar(editModal, 0.1, true, "Video wird gelöscht...");
    
    try {
        // Führe das Löschen durch
        updateCustomProgressBar(editModal, 0.3, true, "Löschvorgang gestartet...");
        
        // Führe das Löschen schrittweise durch und aktualisiere den Fortschrittsbalken
        const result = await deleteVideo(videoId, (progress, message) => {
            // Callback für Fortschrittsbalken-Updates
            updateCustomProgressBar(editModal, progress, true, message);
        });
        
        if (result.success) {
            console.log("✅ Video erfolgreich gelöscht");
            
            // Erfolgreicher Abschluss - zeige 100%
            updateCustomProgressBar(editModal, 1.0, true, result.message || "Video erfolgreich gelöscht!");
            
            // Schließe das Modal nach kurzer Verzögerung
            setTimeout(() => {
                if (editModal && window.modalManager) {
                    window.modalManager.closeModal(editModal);
                    
                    // Optional: Seite neu laden, um die Änderungen anzuzeigen
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
            }, 1500); // Verzögerung, damit der Nutzer die Erfolgsmeldung sehen kann
        } else {
            // Teilweise Erfolg mit Warnung
            if (result.warning) {
                updateCustomProgressBar(editModal, 0.9, true, result.message, true);
                
                // Schließe das Modal nach längerer Verzögerung
                setTimeout(() => {
                    if (editModal && window.modalManager) {
                        window.modalManager.closeModal(editModal);
                        
                        // Optional: Seite neu laden
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                    }
                }, 3000); // Längere Verzögerung bei Warnungen
            } else {
                // Echter Fehler
                updateCustomProgressBar(editModal, 0.5, false, result.message || "Fehler beim Löschen des Videos. Bitte versuche es erneut.");
                
                // Setze den Button zurück nach einer Verzögerung
                setTimeout(() => {
                    button.disabled = false;
                    button.textContent = originalText;
                }, 3000);
            }
        }
    } catch (error) {
        console.error("❌ Fehler beim Löschen:", error);
        
        // Zeige Fehlermeldung
        updateCustomProgressBar(editModal, 0.5, false, "Fehler beim Löschen des Videos. Bitte versuche es erneut.");
        
        // Setze den Button zurück nach einer Verzögerung
        setTimeout(() => {
            button.disabled = false;
            button.textContent = originalText;
        }, 3000);
    }
}

// Hilfsfunktionen zum Abrufen von Feldwerten
function getValue(form, fieldName, defaultValue = "") {
    // Suche nach verschiedenen Selector-Varianten
    const selectors = [
        `[name="${fieldName}"]`,
        `[data-name="${fieldName}"]`, 
        `#${fieldName.replace(/\s+/g, "-").toLowerCase()}`
    ];
    
    let field = null;
    
    // Versuche verschiedene Selektoren
    for (const selector of selectors) {
        field = form.querySelector(selector);
        if (field) break;
    }
    
    if (!field) {
        console.warn(`⚠️ Feld '${fieldName}' nicht gefunden. Verwende Standardwert: '${defaultValue}'`);
        return defaultValue;
    }
    
    return field.value || defaultValue;
}

function getChecked(form, fieldName) {
    // Suche nach verschiedenen Selector-Varianten
    const selectors = [
        `[name="${fieldName}"]`,
        `[data-name="${fieldName}"]`, 
        `#${fieldName.replace(/\s+/g, "-").toLowerCase()}`
    ];
    
    let field = null;
    
    // Versuche verschiedene Selektoren
    for (const selector of selectors) {
        field = form.querySelector(selector);
        if (field && field.type === 'checkbox') break;
    }
    
    if (!field || field.type !== 'checkbox') {
        console.warn(`⚠️ Checkbox '${fieldName}' nicht gefunden. Standard: false`);
        return false;
    }
    
    return field.checked;
}

// Initialisierung beim Laden des Dokuments
document.addEventListener("DOMContentLoaded", () => {
    console.log("🔧 Video Edit/Delete Script wird initialisiert...");
    
    // Initialisiere die Edit-Buttons
    initVideoEditButtons();
    
    // Initialisiere den Save-Button
    initSaveButton();
    
    // Initialisiere den Delete-Button
    initDeleteButton();
    
    // EditVideo-Funktion global verfügbar machen
    window.editVideo = editVideo;
    
    // Event-Listener für Edit-Requests aus anderen Skripten
    document.addEventListener('videoEditRequest', function(e) {
        if (e.detail && e.detail.videoId) {
            console.log("🔧 Edit-Event empfangen für Video ID:", e.detail.videoId);
            editVideo(e.detail.videoId);
        }
    });
    
    // Prüfe, ob Fortschrittsbalken-Elemente vorhanden sind und erstelle sie falls nötig
    initProgressBars();
    
    console.log("✅ Video Edit/Delete Script vollständig initialisiert");
});

// Initialisierung der Fortschrittsbalken
function initProgressBars() {
    // Finde alle Modals, die Fortschrittsbalken benötigen könnten
    const editModal = document.querySelector(`[data-modal-id="${window.WEBFLOW_API.EDIT_MODAL_ID}"]`);
    if (editModal) {
        createProgressBarIfNeeded(editModal);
    }
    
    const deleteModal = document.querySelector(`[data-modal-id="${window.WEBFLOW_API.DELETE_CONFIRM_MODAL_ID}"]`);
    if (deleteModal) {
        createProgressBarIfNeeded(deleteModal);
    }
}

// Erstelle Fortschrittsbalken-Elemente, falls sie nicht vorhanden sind
function createProgressBarIfNeeded(modalElement) {
    // Prüfe, ob bereits ein Fortschrittsbalken vorhanden ist
    const existingWrapper = modalElement.querySelector(`[${window.WEBFLOW_API.PROGRESS_WRAPPER_ATTR}]`);
    if (existingWrapper) {
        console.log("✅ Fortschrittsbalken bereits vorhanden");
        return;
    }
    
    console.log("🔧 Erstelle neuen Fortschrittsbalken im Modal");
    
    // Erstelle die Fortschrittsbalken-Elemente
    const wrapper = document.createElement('div');
    wrapper.setAttribute(window.WEBFLOW_API.PROGRESS_WRAPPER_ATTR, '');
    wrapper.style.display = 'none';
    wrapper.style.marginTop = '20px';
    wrapper.style.marginBottom = '20px';
    
    const barContainer = document.createElement('div');
    barContainer.style.backgroundColor = '#f0f0f0';
    barContainer.style.borderRadius = '4px';
    barContainer.style.overflow = 'hidden';
    barContainer.style.height = '8px';
    barContainer.style.marginBottom = '10px';
    
    const bar = document.createElement('div');
    bar.setAttribute(window.WEBFLOW_API.PROGRESS_BAR_ATTR, '');
    bar.style.backgroundColor = '#4CAF50';
    bar.style.height = '100%';
    bar.style.width = '0%';
    bar.style.transition = 'width 0.3s ease';
    
    const infoContainer = document.createElement('div');
    infoContainer.style.display = 'flex';
    infoContainer.style.justifyContent = 'space-between';
    infoContainer.style.alignItems = 'center';
    
    const text = document.createElement('div');
    text.setAttribute(window.WEBFLOW_API.PROGRESS_TEXT_ATTR, '');
    text.textContent = 'Bereit...';
    text.style.fontSize = '14px';
    
    const percentage = document.createElement('div');
    percentage.setAttribute(window.WEBFLOW_API.PROGRESS_PERCENTAGE_ATTR, '');
    percentage.textContent = '0%';
    percentage.style.fontSize = '14px';
    percentage.style.fontWeight = 'bold';
    
    // Optional: Bild-Element für Status-Icons
    const img = document.createElement('div');
    img.setAttribute(window.WEBFLOW_API.PROGRESS_IMG_ATTR, '');
    
    // Zusammenbauen der Elemente
    barContainer.appendChild(bar);
    infoContainer.appendChild(text);
    infoContainer.appendChild(percentage);
    
    wrapper.appendChild(barContainer);
    wrapper.appendChild(infoContainer);
    wrapper.appendChild(img);
    
    // Finde eine geeignete Stelle zum Einfügen des Fortschrittsbalkens
    // Bevorzugt nach dem Haupttitel oder vor den Buttons
    const insertTarget = modalElement.querySelector('.w-form') || 
                         modalElement.querySelector('form') || 
                         modalElement.firstElementChild;
    
    if (insertTarget) {
        insertTarget.appendChild(wrapper);
        console.log("✅ Fortschrittsbalken erfolgreich hinzugefügt");
    } else {
        console.warn("⚠️ Konnte keinen geeigneten Einfügepunkt für den Fortschrittsbalken finden");
        modalElement.appendChild(wrapper);
    }
}

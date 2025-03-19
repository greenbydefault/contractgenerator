// 🌐 Webflow API Integration zur Bearbeitung und Löschung eines CMS Collection Items

// 🔧 Konfiguration - Globale Konstanten (ergänzend zum Upload-Script)
window.WEBFLOW_API = window.WEBFLOW_API || {
    BASE_URL: "https://api.webflow.com/v2/collections",
    WORKER_BASE_URL: "https://upload.oliver-258.workers.dev/?url=",
    COLLECTION_ID: "67d806e65cadcadf2f41e659", // Collection ID für Videos
    MEMBERS_COLLECTION_ID: "6448faf9c5a8a15f6cc05526", // Collection ID für Members
    DEBUG_MODE: true
};

// Erweitere die Konfiguration um Edit-spezifische Werte
window.WEBFLOW_API = {
    ...window.WEBFLOW_API,
    EDIT_MODAL_ID: "upload-edit",
    EDIT_FORM_ID: "video-edit-form",
    EDIT_NAME_FIELD: "Name Edit",
    EDIT_CATEGORY_FIELD: "Kategorie Edit",
    EDIT_DESCRIPTION_FIELD: "Beschreibung Edit",
    EDIT_PUBLIC_FIELD: "Open Video Edit",
    EDIT_SAVE_BUTTON: "video-edit-save",
    EDIT_DELETE_BUTTON: "video-delete-button",
    DELETE_CONFIRM_MODAL_ID: "delete-confirm-modal"
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
        fillEditForm(videoData);

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

// Formular mit Video-Daten füllen
function fillEditForm(videoData) {
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

    // Felder füllen
    setFieldValue(window.WEBFLOW_API.EDIT_NAME_FIELD, videoData.fieldData["video-name"] || videoData.fieldData["name"]);
    setFieldValue(window.WEBFLOW_API.EDIT_CATEGORY_FIELD, videoData.fieldData["video-kategorie"]);
    setFieldValue(window.WEBFLOW_API.EDIT_DESCRIPTION_FIELD, videoData.fieldData["video-beschreibung"]);
    setFieldValue(window.WEBFLOW_API.EDIT_PUBLIC_FIELD, videoData.fieldData["offentliches-video"]);
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

// Video löschen
async function deleteVideo(videoId) {
    if (!videoId) {
        console.error("❌ Keine Video-ID zum Löschen übergeben");
        return false;
    }

    try {
        console.log(`🗑️ Lösche Video mit ID: ${videoId}`);
        
        // 1. Zuerst das Video aus dem Member-Feed entfernen
        const videoData = currentVideoData || await getVideoById(videoId);
        
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
                // Wir machen trotzdem mit dem Löschen des Videos weiter
            }
        }
        
        // 2. Das Video im CMS löschen
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

// Hilfsfunktion zum Entfernen eines Videos aus dem Member-Feed
async function removeVideoFromMemberFeed(memberId, videoId) {
    if (!memberId || !videoId) {
        console.error("❌ Member ID oder Video ID fehlt");
        return null;
    }

    try {
        // Importiere die getMemberByWebflowId-Funktion aus dem Upload-Script
        if (typeof getMemberByWebflowId !== 'function') {
            console.warn("⚠️ getMemberByWebflowId-Funktion nicht verfügbar, versuche alternative Implementierung");
            
            // Hole den Member direkt
            const apiUrl = `${window.WEBFLOW_API.BASE_URL}/${window.WEBFLOW_API.MEMBERS_COLLECTION_ID}/items/${memberId}`;
            const workerUrl = buildWorkerUrl(apiUrl);
            
            const response = await fetch(workerUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            
            if (!response.ok) {
                throw new Error(`Konnte Member mit ID ${memberId} nicht abrufen`);
            }
            
            var member = await response.json();
        } else {
            // Verwende die vorhandene Funktion
            var member = await getMemberByWebflowId(memberId);
        }
        
        if (!member) {
            throw new Error(`Kein Member mit ID ${memberId} gefunden`);
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
        
        console.log(`🔄 Aktualisiere Video-Feed für Member ${memberId}:`, updatedVideoFeed);
        
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
        
        // Formular finden
        const form = document.getElementById(window.WEBFLOW_API.EDIT_FORM_ID) || 
                     document.querySelector(`[data-modal-id="${window.WEBFLOW_API.EDIT_MODAL_ID}"] form`);
        
        if (!form) {
            console.error("❌ Edit-Formular nicht gefunden");
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
                alert("Bitte gib einen Namen für das Video ein.");
                return;
            }
            
            console.log("📝 Formulardaten zum Speichern:", formData);
            
            // Führe das Update durch
            const result = await updateVideo(formData);
            
            if (result) {
                console.log("✅ Video erfolgreich aktualisiert:", result);
                
                // Schließe das Modal
                const editModal = document.querySelector(`[data-modal-id="${window.WEBFLOW_API.EDIT_MODAL_ID}"]`);
                if (editModal && window.modalManager) {
                    window.modalManager.closeModal(editModal);
                }
                
                // Optional: Seite neu laden, um die Änderungen anzuzeigen
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                throw new Error("Unbekannter Fehler beim Aktualisieren des Videos");
            }
        } catch (error) {
            console.error("❌ Fehler beim Speichern:", error);
            alert("Fehler beim Speichern der Änderungen. Bitte versuche es erneut.");
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
            return;
        }
        
        // Bestätigungsdialog anzeigen
        if (confirm("Bist du sicher, dass du dieses Video löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.")) {
            handleVideoDelete(currentVideoData.id, deleteButton);
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
    
    // Ändere den Button-Text während des Löschens
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Wird gelöscht...";
    
    try {
        // Führe das Löschen durch
        const result = await deleteVideo(videoId);
        
        if (result) {
            console.log("✅ Video erfolgreich gelöscht");
            
            // Schließe das Modal
            const editModal = document.querySelector(`[data-modal-id="${window.WEBFLOW_API.EDIT_MODAL_ID}"]`);
            if (editModal && window.modalManager) {
                window.modalManager.closeModal(editModal);
            }
            
            // Optional: Seite neu laden, um die Änderungen anzuzeigen
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            throw new Error("Unbekannter Fehler beim Löschen des Videos");
        }
    } catch (error) {
        console.error("❌ Fehler beim Löschen:", error);
        alert("Fehler beim Löschen des Videos. Bitte versuche es erneut.");
    } finally {
        // Button zurücksetzen
        button.disabled = false;
        button.textContent = originalText;
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
    
    console.log("✅ Video Edit/Delete Script vollständig initialisiert");
});

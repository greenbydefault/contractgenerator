// 🌐 Webflow API Integration zur Erstellung eines CMS Collection Items

// 🔧 Konfiguration - Globale Konstanten
window.WEBFLOW_API = {
    BASE_URL: "https://api.webflow.com/v2/collections",
    WORKER_BASE_URL: "https://upload.oliver-258.workers.dev/?url=",
    VIDEO_CONVERT_WORKER_URL: "https://video-convert.oliver-258.workers.dev",
    COLLECTION_ID: "67d806e65cadcadf2f41e659", // Collection ID für Videos
    MEMBERS_COLLECTION_ID: "6448faf9c5a8a15f6cc05526", // Collection ID für Members
    FORM_ID: "db-upload-video",
    SUCCESS_DIV_ID: "db-upload-susscess",
    DEBUG_MODE: true
};

// Uploadcare Datei-Informationen speichern
let uploadcareFileUuid = "";
let uploadcareFileCdnUrl = "";
let uploadcareProcessedUrl = ""; // URL mit Videokonvertierung
let isVideoProcessing = false;

// 🛠️ Hilfsfunktion zur Erstellung der Worker-URL
function buildWorkerUrl(apiUrl) {
    return `${window.WEBFLOW_API.WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

// Funktion zur Videokonvertierung mit dem Cloudflare Worker
async function convertVideoWithWorker(uuid) {
    if (!uuid) {
        console.warn("⚠️ Keine UUID für Videokonvertierung vorhanden");
        return null;
    }

    try {
        isVideoProcessing = true;
        console.log("🎬 Starte Videokonvertierung für UUID:", uuid);

        // Sende Anfrage an den Cloudflare Worker
        const response = await fetch(window.WEBFLOW_API.VIDEO_CONVERT_WORKER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                uuid: uuid,
                format: "mp4",
                quality: "lighter",
                size: "360x640"
            })
        });

        // Verarbeite die Antwort
        if (!response.ok) {
            throw new Error(`Worker-Fehler: ${response.status}`);
        }

        const data = await response.json();
        console.log("Worker-Antwort erhalten:", data);
        
        isVideoProcessing = false;

        if (data.status === "success" && data.result) {
            // Verarbeite die Antwort, wobei result ein Array sein kann
            let convertedUuid = null;
            
            if (Array.isArray(data.result) && data.result.length > 0) {
                // Nimm das erste Element des Arrays
                const firstResult = data.result[0];
                // Prüfe, ob es eine UUID enthält
                if (firstResult && firstResult.uuid) {
                    convertedUuid = firstResult.uuid;
                }
            } else if (data.result.uuid) {
                // Falls result direkt ein Objekt mit uuid ist
                convertedUuid = data.result.uuid;
            }
            
            if (convertedUuid) {
                console.log("✅ Videokonvertierung erfolgreich, UUID:", convertedUuid);
                // Setze die neue URL
                uploadcareProcessedUrl = `https://ucarecdn.com/${convertedUuid}/`;
                
                // Aktualisiere versteckte Felder
                updateHiddenFields();
                
                return { uuid: convertedUuid };
            } else {
                console.warn("⚠️ Keine UUID in der Worker-Antwort gefunden:", data);
                return null;
            }
        } else {
            console.warn("⚠️ Unerwartetes Format der Worker-Antwort:", data);
            return null;
        }
    } catch (error) {
        isVideoProcessing = false;
        console.error("❌ Fehler bei der Videokonvertierung:", error);
        return null;
    }
}

// Funktion zum Abrufen eines Members anhand der Webflow ID
async function getMemberByWebflowId(webflowId) {
    if (!webflowId) {
        console.error("❌ Keine Webflow ID angegeben");
        return null;
    }

    try {
        // Versuche zuerst, den Member direkt über die ID zu holen
        // (falls webflowId eigentlich die Webflow Item-ID ist)
        const directApiUrl = `${window.WEBFLOW_API.BASE_URL}/${window.WEBFLOW_API.MEMBERS_COLLECTION_ID}/items/${webflowId}`;
        const directWorkerUrl = buildWorkerUrl(directApiUrl);
        
        console.log(`🔍 Versuche direkten Zugriff auf Member mit ID: ${webflowId}`);
        
        let response = await fetch(directWorkerUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        
        if (response.ok) {
            const responseText = await response.text();
            try {
                const member = JSON.parse(responseText);
                console.log("✅ Member direkt gefunden:", member);
                return member;
            } catch (e) {
                console.warn("⚠️ Konnte API-Antwort nicht als JSON parsen:", responseText);
            }
        }
        
        // Wenn direkter Zugriff fehlschlägt, hole alle Member und filtere manuell
        console.log(`🔍 Direkter Zugriff fehlgeschlagen, suche Member mit Webflow ID: ${webflowId}`);
        
        const listApiUrl = `${window.WEBFLOW_API.BASE_URL}/${window.WEBFLOW_API.MEMBERS_COLLECTION_ID}/items`;
        const listWorkerUrl = buildWorkerUrl(listApiUrl);
        
        response = await fetch(listWorkerUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const responseText = await response.text();
        
        if (!response.ok) {
            console.error("📄 API-Antwort (Member-Liste):", responseText);
            throw new Error(`API-Fehler bei Member-Suche: ${response.status} - ${responseText}`);
        }

        // Versuche, die Antwort als JSON zu parsen
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            console.warn("⚠️ Konnte API-Antwort nicht als JSON parsen:", responseText);
            return null;
        }
        
        // Manuell nach dem Member mit der entsprechenden Webflow-ID oder Memberstack-ID suchen
        let foundMember = null;
        let exactMatch = false;
        let partialMatch = null;
        
        if (responseData.items && responseData.items.length > 0) {
            // Ausgabe der ersten 3 Members im Debug-Modus
            if (window.WEBFLOW_API.DEBUG_MODE) {
                console.log("Debug: Beispiel für Member-Daten (erste 3):");
                for (let i = 0; i < Math.min(3, responseData.items.length); i++) {
                    console.log(responseData.items[i]);
                }
            }
            
            // Erstes versuchen wir eine exakte Übereinstimmung zu finden
            for (const member of responseData.items) {
                if (member.fieldData) {
                    // Prüfe alle möglichen ID-Felder
                    const memberWebflowId = member.fieldData["webflow-id"];
                    const memberstackId = member.fieldData["memberstack-id"];
                    
                    if (memberWebflowId === webflowId || memberstackId === webflowId || member.id === webflowId) {
                        foundMember = member;
                        exactMatch = true;
                        break;
                    }
                    
                    // Versuche auch eine Teilübereinstimmung für Memberstack IDs
                    // (z.B. wenn das Präfix "mem_" fehlt oder anders ist)
                    if (memberstackId && webflowId && 
                        (memberstackId.includes(webflowId) || webflowId.includes(memberstackId))) {
                        partialMatch = member;
                    }
                }
            }
            
            // Wenn keine exakte Übereinstimmung, aber eine Teilübereinstimmung gefunden wurde
            if (!exactMatch && partialMatch) {
                foundMember = partialMatch;
                console.log("🔍 Keine exakte Übereinstimmung, aber Teilübereinstimmung gefunden");
            }
        }
        
        if (foundMember) {
            const matchType = exactMatch ? "exakte Übereinstimmung" : "Teilübereinstimmung";
            console.log(`✅ Member in der Liste gefunden (${matchType}):`, foundMember);
            return foundMember;
        } else {
            console.warn(`⚠️ Kein Member mit ID ${webflowId} gefunden`);
            
            // Debug-Ausgabe für alle verfügbaren Member-IDs
            if (window.WEBFLOW_API.DEBUG_MODE && responseData.items) {
                console.log("Verfügbare Member IDs:");
                responseData.items.forEach(member => {
                    console.log(`Member ID: ${member.id}, Webflow-ID: ${member.fieldData ? member.fieldData["webflow-id"] : "nicht gesetzt"}, Memberstack-ID: ${member.fieldData ? member.fieldData["memberstack-id"] : "nicht gesetzt"}`);
                });
            }
            
            return null;
        }
    } catch (error) {
        console.error("❌ Fehler beim Abrufen des Members:", error);
        return null;
    }
}

// Funktion zum Aktualisieren des Video-Feeds eines Members
async function updateMemberVideoFeed(memberId, videoId) {
    if (!memberId || !videoId) {
        console.error("❌ Member ID oder Video ID fehlt");
        return null;
    }

    try {
        // Hole zuerst den aktuellen Member
        const member = await getMemberByWebflowId(memberId);
        
        if (!member) {
            throw new Error(`Kein Member mit ID ${memberId} gefunden`);
        }
        
        // Hole die aktuelle Video-Feed-Liste
        const currentVideoFeed = member.fieldData["video-feed"] || [];
        
        // Prüfe, ob das Video bereits im Feed ist
        if (currentVideoFeed.includes(videoId)) {
            console.log(`⚠️ Video ${videoId} ist bereits im Feed des Members`);
            return member; // Keine Änderung notwendig
        }
        
        // Füge das neue Video zur Liste hinzu
        const updatedVideoFeed = [...currentVideoFeed, videoId];
        
        console.log(`🔄 Aktualisiere Video-Feed für Member ${memberId}:`, updatedVideoFeed);
        
        // Erstelle die API-URL zum Aktualisieren des Members
        const apiUrl = `${window.WEBFLOW_API.BASE_URL}/${window.WEBFLOW_API.MEMBERS_COLLECTION_ID}/items/${member.id}`;
        const workerUrl = buildWorkerUrl(apiUrl);
        
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
            
            response = await fetch(workerUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(putPayload)
            });
        }

        const responseText = await response.text();
        
        if (!response.ok) {
            console.error("📄 API-Antwort (Member-Update):", responseText);
            throw new Error(`API-Fehler bei Member-Update: ${response.status} - ${responseText}`);
        }

        // Versuche, die Antwort als JSON zu parsen
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            console.warn("⚠️ Konnte API-Antwort nicht als JSON parsen:", responseText);
            responseData = { raw: responseText };
        }
        
        console.log("✅ Member erfolgreich aktualisiert:", responseData);
        return responseData;
    } catch (error) {
        console.error("❌ Fehler beim Aktualisieren des Member Video-Feeds:", error);
        throw error;
    }
}

// 📡 Funktion zur Erstellung eines CMS Items
async function createCMSItem(formData) {
    const apiUrl = `${window.WEBFLOW_API.BASE_URL}/${window.WEBFLOW_API.COLLECTION_ID}/items/live`;
    const workerUrl = buildWorkerUrl(apiUrl);
    
    // Die Webflow API erwartet dieses Format für ein Single Item
    // WICHTIG: Hier sind die korrekten Feldnamen aus der Webflow-Kollektion
    const payload = {
        isArchived: false,
        isDraft: false,
        fieldData: {
            "name": formData.name || "Unbenanntes Video",
            "slug": formData.slug || "unbenanntes-video",
            "video-name": formData.name || "Unbenanntes Video",
            "video-kategorie": formData.kategorie || "",
            "video-beschreibung": formData.beschreibung || "Keine Beschreibung",
            "offentliches-video": formData.openVideo || false,
            "video-contest": formData.videoContest || false,
            "webflow-id": formData.webflowMemberId || "",
            "memberstack-id": formData.memberstackMemberId || "",
            "creator-name": formData.memberName || "Unbekannter Nutzer",
            "video-link": formData.videoLink || ""
        }
    };

    if (window.WEBFLOW_API.DEBUG_MODE) {
        console.log("📤 Sende Daten an Webflow API:", payload);
    }

    try {
        const response = await fetch(workerUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
                // Der API-Token wird im Worker gesetzt
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text(); // Immer zuerst als Text holen
        
        if (!response.ok) {
            console.error("📄 API-Antwort:", responseText);
            throw new Error(`API-Fehler: ${response.status} - ${responseText}`);
        }

        // Versuche, die Antwort als JSON zu parsen
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            console.warn("⚠️ Konnte API-Antwort nicht als JSON parsen:", responseText);
            responseData = { raw: responseText };
        }
        
        if (window.WEBFLOW_API.DEBUG_MODE) {
            console.log("✅ CMS Item erfolgreich erstellt:", responseData);
        }
        
        return responseData;
    } catch (error) {
        console.error("❌ Fehler beim Erstellen des CMS Items:", error);
        throw error;
    }
}

// 🔍 Funktion zur Analyse des Formulars und aller Felder
function analyzeForm(form) {
    console.log("🔍 Formular-Analyse:");
    
    // Alle Input-Elemente im Formular auflisten
    const allInputs = form.querySelectorAll("input, textarea, select");
    console.log(`Gefundene Formularelemente: ${allInputs.length}`);
    
    allInputs.forEach((input, index) => {
        console.log(`${index + 1}. Element:`, {
            tag: input.tagName,
            type: input.type || "N/A",
            name: input.name || "Kein Name",
            id: input.id || "Keine ID",
            "data-name": input.getAttribute("data-name") || "Kein data-name",
            value: input.type === 'checkbox' ? input.checked : (input.value || "Kein Wert")
        });
    });
}

// Initialisiere Uploadcare und setze Event-Listener
function initUploadcare() {
    // Prüfe, ob das Uploadcare-Element existiert
    const uploaderCtx = document.querySelector('[id*="uploaderCtx"]');
    if (!uploaderCtx) {
        console.warn("⚠️ Uploadcare Context Provider nicht gefunden");
        return;
    }

    console.log("✅ Uploadcare Context Provider gefunden", uploaderCtx);

    // Funktion zum Abrufen der Dateiinformationen
    function getUploadcareFileInfo() {
        try {
            const api = uploaderCtx.getAPI();
            const state = api.getOutputCollectionState();
            
            if (state.successCount > 0) {
                // Nimm die erste erfolgreiche Datei
                const fileEntry = state.successEntries[0];
                
                // Speichere die UUID und CDN URL
                uploadcareFileUuid = fileEntry.uuid || "";
                uploadcareFileCdnUrl = fileEntry.cdnUrl || "";
                
                console.log("🎯 Uploadcare Datei gefunden:", {
                    name: fileEntry.name,
                    uuid: uploadcareFileUuid,
                    originalCdnUrl: uploadcareFileCdnUrl
                });
                
                // Aktualisiere versteckte Felder im Formular, falls vorhanden
                updateHiddenFields();
                
                // Zeige Dateiinformationen an
                displayFileInfo(fileEntry);
                
                return fileEntry;
            }
            
            // Prüfe, ob derzeit eine Datei hochgeladen wird
            if (state.uploadingCount > 0) {
                const uploadingFile = state.uploadingEntries[0];
                displayFileInfo(uploadingFile, true);
            }
            
            return null;
        } catch (error) {
            console.error("❌ Fehler beim Abrufen der Uploadcare-Dateiinformationen:", error);
            return null;
        }
    }

    // Zeige Dateiinformation an
    function displayFileInfo(fileEntry, isUploading = false) {
        const fileInfoDiv = document.getElementById('fileInfo');
        if (!fileInfoDiv) return;
        
        let statusText = "";
        
        if (isUploading) {
            statusText = `<span style="color: #0066cc;">Wird hochgeladen (${Math.round(fileEntry.uploadProgress)}%)...</span>`;
        } else if (isVideoProcessing) {
            statusText = '<span style="color: #ff9900;">Video wird optimiert...</span>';
        } else {
            statusText = '<span style="color: green;">✓ Erfolgreich hochgeladen</span>';
        }
        
        fileInfoDiv.innerHTML = `
            <div style="margin-top: 10px; padding: 10px; border-radius: 5px; border: 1px solid #ddd; background-color: #f9f9f9;">
                <p><strong>Datei:</strong> ${fileEntry.name}</p>
                <p><strong>Größe:</strong> ${formatFileSize(fileEntry.size)}</p>
                <p><strong>Status:</strong> ${statusText}</p>
            </div>
        `;
    }

    // Formatiere Dateigröße
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Event-Listener für erfolgreiche Uploads
    uploaderCtx.addEventListener('file-upload-success', async (event) => {
        console.log("🚀 Uploadcare Upload erfolgreich:", event.detail);
        const fileEntry = getUploadcareFileInfo();
        
        // Deaktiviere den Submit-Button während der Konvertierung
        const form = document.getElementById(window.WEBFLOW_API.FORM_ID);
        const submitButton = form ? form.querySelector('input[type="submit"], button[type="submit"]') : null;
        let originalValue = ""; // Initialisiere originalValue
        
        if (submitButton) {
            submitButton.disabled = true;
            originalValue = submitButton.value || submitButton.textContent; // Speichere Original-Wert
            submitButton.value = submitButton.type === 'submit' ? "Video wird optimiert..." : originalValue;
            submitButton.textContent = submitButton.type !== 'submit' ? "Video wird optimiert..." : submitButton.textContent;
        }
        
        // Wenn Video hochgeladen, starte die Konvertierung
        if (fileEntry && uploadcareFileUuid) {
            try {
                // Zeige Konvertierungsstatus an
                isVideoProcessing = true;
                if (fileEntry) {
                    displayFileInfo(fileEntry, false);
                }
                
                // Starte die Videokonvertierung mit dem Worker
                const result = await convertVideoWithWorker(uploadcareFileUuid);
                
                // Aktualisiere die Anzeige nach der Konvertierung
                if (fileEntry) {
                    displayFileInfo(fileEntry, false);
                }
            } catch (error) {
                console.error("❌ Fehler bei der Videokonvertierung:", error);
            } finally {
                // Reaktiviere den Submit-Button
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.value = submitButton.type === 'submit' ? originalValue : submitButton.value;
                    submitButton.textContent = submitButton.type !== 'submit' ? originalValue : submitButton.textContent;
                }
            }
        }
    });
    
    // Event-Listener für Upload-Fortschritt
    uploaderCtx.addEventListener('file-upload-progress', (event) => {
        console.log("📊 Upload-Fortschritt:", event.detail);
        getUploadcareFileInfo();
    });
    
    // Event-Listener für Start des Uploads
    uploaderCtx.addEventListener('file-upload-start', () => {
        console.log("🏁 Upload gestartet");
    });
    
    // Event-Listener für Upload-Fehler
    uploaderCtx.addEventListener('file-upload-failed', (event) => {
        console.error("❌ Upload fehlgeschlagen:", event.detail);
    });
    
    // Regelmäßige Überprüfung für Uploads
    setInterval(getUploadcareFileInfo, 1000);
}

// Aktualisiere den benutzerdefinierten Fortschrittsbalken
function updateCustomProgressBar(progress, isSuccess = true, errorMessage = "", isWarning = false) {
    const progressBar = document.querySelector('.db-modal-progessbar');
    const progressText = document.querySelector('.db-modal-progress-text');
    const progressPercentage = document.querySelector('.db-modal-progress-percentage');
    const progressImg = document.querySelector('.db-modal-progress-img');
    
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
        progressText.textContent = errorMessage || "Video hochgeladen, aber es gibt ein Problem mit deinem Profil.";
    } else if (isSuccess) {
        // Erfolg - grün
        progressBar.style.backgroundColor = '#4CAF50'; 
        progressText.textContent = percent === 100 ? "Erfolgreich hochgeladen!" : "Wird hochgeladen...";
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
function showCustomProgressBar() {
    const progressWrapper = document.querySelector('.db-modal-progress-wrapper');
    
    if (progressWrapper) {
        progressWrapper.style.display = 'block';
        updateCustomProgressBar(0, true); // Initialisiere den Balken mit 0%
    } else {
        console.warn("⚠️ Fortschrittsbalken-Wrapper nicht gefunden");
    }
}

// Verstecke den benutzerdefinierten Fortschrittsbalken
function hideCustomProgressBar() {
    const progressWrapper = document.querySelector('.db-modal-progress-wrapper');
    
    if (progressWrapper) {
        progressWrapper.style.display = 'none';
    }
}

// Funktion zum Hinzufügen eines "Fenster schließen" Buttons
function addCloseButton() {
    // Prüfe, ob bereits ein Close-Button existiert
    if (document.getElementById('db-close-window-button')) {
        return; // Button existiert bereits
    }
    
    // Erstelle den Button
    const closeButton = document.createElement('a');
    closeButton.id = 'db-close-window-button';
    closeButton.className = 'db-button-medium-white-border w-button';
    closeButton.href = '#';
    closeButton.textContent = 'Fenster schließen';
    closeButton.style.marginTop = '20px';
    closeButton.style.display = 'inline-block';
    
    // Füge Event-Listener hinzu - falls in einem Modal, schließe dieses
    closeButton.addEventListener('click', (event) => {
        event.preventDefault();
        
        // Versuche, das Modal zu schließen (falls vorhanden)
        const modal = document.querySelector('.w-modal-stack');
        if (modal) {
            // Suche nach Webflow-Close-Button und klicke darauf
            const webflowCloseButton = modal.querySelector('.w-modal-close');
            if (webflowCloseButton) {
                webflowCloseButton.click();
                return;
            }
        }
        
        // Fallback: Versuche, ein anderes übergeordnetes Element auszublenden
        const container = document.getElementById(window.WEBFLOW_API.FORM_ID).closest('.db-upload-container, .modal-content, .form-container');
        if (container) {
            container.style.display = 'none';
        }
    });
    
    // Füge den Button zum DOM hinzu
    const form = document.getElementById(window.WEBFLOW_API.FORM_ID);
    if (form) {
        // Füge nach dem Erfolgs-DIV ein, falls vorhanden
        const successDiv = document.getElementById(window.WEBFLOW_API.SUCCESS_DIV_ID);
        if (successDiv) {
            successDiv.parentNode.insertBefore(closeButton, successDiv.nextSibling);
        } else {
            // Ansonsten ans Ende des Formulars
            form.appendChild(closeButton);
        }
    }
}

// Aktualisiere versteckte Felder im Formular
function updateHiddenFields() {
    const form = document.getElementById(window.WEBFLOW_API.FORM_ID);
    if (!form) return;
    
    // Suche nach versteckten Feldern für die UUID und CDN URL
    const videoLinkInput = form.querySelector("input[name='Video Link'], input[name='VideoLink'], input[name='video-link']");
    if (videoLinkInput) {
        // Bevorzuge die konvertierte URL, falls vorhanden
        videoLinkInput.value = uploadcareProcessedUrl || uploadcareFileCdnUrl;
        console.log("✅ Verstecktes Feld 'Video Link' aktualisiert:", videoLinkInput.value);
    }
    
    // Optional: Feld für die UUID finden und aktualisieren
    const uuidInput = form.querySelector("input[name='File UUID'], input[name='FileUUID'], input[name='file-uuid']");
    if (uuidInput) {
        uuidInput.value = uploadcareFileUuid;
        console.log("✅ Verstecktes Feld 'File UUID' aktualisiert:", uploadcareFileUuid);
    }
}

// Kategorien-ID extrahieren oder leeren String verwenden
function getKategorieId() {
    const form = document.getElementById(window.WEBFLOW_API.FORM_ID);
    // Versuche verschiedene Selektoren für das Kategorie-Feld
    const kategorieSelectors = [
        "select[name='Kategorie']",
        "select[data-name='Kategorie']",
        "input[name='Kategorie']",
        "input[data-name='Kategorie']"
    ];
    
    for (const selector of kategorieSelectors) {
        const element = form.querySelector(selector);
        if (element) {
            console.log(`🔍 Kategorie-Feld gefunden mit Selektor: ${selector}`, element.value);
            return element.value;
        }
    }
    
    // Wenn nicht gefunden, versuche einen festen Wert
    console.warn("⚠️ Kein Kategorie-Feld gefunden. Standard-Kategorie wird verwendet.");
    return "2f1f2fe0cd35ddd19ca98f4b85b16258"; // Standard-Kategorie-ID
}

// 📥 Event Listener für das Formular
document.addEventListener("DOMContentLoaded", () => {
    // Wichtig: Prüfe und gib Information über die Konfiguration aus
    console.log("🔧 Webflow API Konfiguration:", window.WEBFLOW_API);
    
    // Initialisiere Uploadcare-Integration
    initUploadcare();
    
    const form = document.getElementById(window.WEBFLOW_API.FORM_ID);
    if (!form) {
        console.error(`❌ Formular mit ID '${window.WEBFLOW_API.FORM_ID}' nicht gefunden.`);
        return;
    }

    console.log("✅ Member Video Upload Script geladen für Formular:", form.id);
    
    // Formularanalyse durchführen
    analyzeForm(form);

    // Erstelle den Container für Dateiinformationen, falls er nicht existiert
    if (!document.getElementById('fileInfo')) {
        const fileInfoDiv = document.createElement('div');
        fileInfoDiv.id = 'fileInfo';
        form.appendChild(fileInfoDiv);
    }

    // Verstecke den benutzerdefinierten Fortschrittsbalken initial
    hideCustomProgressBar();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        console.log("🚀 Formular wird gesendet...");
        
        // Prüfe, ob ein Video hochgeladen wurde
        if (!uploadcareFileUuid) {
            alert("Bitte lade zuerst ein Video hoch, bevor du das Formular absendest.");
            return;
        }
        
        // Prüfe, ob die Videokonvertierung noch läuft
        if (isVideoProcessing) {
            alert("Die Videooptimierung läuft noch. Bitte warte einen Moment.");
            return;
        }
        
        // Stelle sicher, dass wir die neueste URL verwenden
        const currentVideoLink = uploadcareProcessedUrl || uploadcareFileCdnUrl;
        if (uploadcareProcessedUrl) {
            console.log("✓ Verwende die konvertierte Video-URL:", uploadcareProcessedUrl);
        } else if (uploadcareFileCdnUrl) {
            console.log("⚠️ Keine konvertierte URL gefunden, verwende Original:", uploadcareFileCdnUrl);
        } else {
            showCustomProgressBar();
            updateCustomProgressBar(0.3, false, "Kein Video-Link gefunden. Bitte versuche es erneut oder kontaktiere den Support.");
            return;
        }
        
        // Hilfsfunktionen zur Felderermittlung
        function getValue(selector, defaultValue = "") {
            const element = form.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ Feld '${selector}' nicht gefunden. Setze Standardwert: '${defaultValue}'`);
                return defaultValue;
            }
            console.log(`🔍 Feld '${selector}' gefunden:`, element.value);
            return element.value;
        }

        function getChecked(selector) {
            const element = form.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ Checkbox '${selector}' nicht gefunden. Standard: false`);
                return false;
            }
            console.log(`🔍 Checkbox '${selector}' gefunden:`, element.checked);
            return element.checked;
        }
        
        // Alternative Selektoren für die Checkbox-Feldsuche 
        function findCheckbox(possibleNames) {
            for (const name of possibleNames) {
                // Versuche verschiedene Selektoren
                const selectors = [
                    `input[name='${name}']`,
                    `input[data-name='${name}']`,
                    `input#${name}`,
                    `input[placeholder='${name}']`
                ];
                
                for (const selector of selectors) {
                    const element = form.querySelector(selector);
                    if (element && element.type === 'checkbox') {
                        console.log(`🔍 Checkbox gefunden mit Selektor: ${selector}`);
                        return element.checked;
                    }
                }
            }
            
            console.warn(`⚠️ Keine Checkbox mit Namen ${possibleNames.join(', ')} gefunden`);
            return false;
        }

        // Ausblenden des erfolgs-DIVs, falls vorhanden
        const successDiv = document.getElementById(window.WEBFLOW_API.SUCCESS_DIV_ID);
        if (successDiv) {
            successDiv.style.display = 'none';
        }

        // Videoname abrufen oder Default verwenden
        const videoName = getValue("input[name='Name']", "Unbenanntes Video");
        
        // Erstelle einen Slug aus Videoname und UUID
        let slug = videoName.toLowerCase()
            .replace(/\s+/g, "-")        // Leerzeichen zu Bindestrichen
            .replace(/[^a-z0-9-]/g, "")  // Nur alphanumerische und Bindestriche
            .replace(/-+/g, "-")         // Mehrfache Bindestriche zu einem
            .replace(/^-|-$/g, "");      // Bindestriche am Anfang und Ende entfernen
            
        // Füge UUID hinzu
        if (uploadcareFileUuid) {
            slug = `${slug}-${uploadcareFileUuid.slice(0, 8)}`; // Nimm die ersten 8 Zeichen der UUID
        }

        // Ermittle die Formulardaten mit den korrekten Selektoren
        const webflowMemberId = getValue("input[name='Webflow Member ID']", "");
        const memberstackMemberId = getValue("input[name='Memberstack Member ID']", "");
        const videoLink = getVideoLink(); // Diese Funktion nutzt die konvertierte URL, falls vorhanden
        
        // Debugge die IDs
        console.log("🔍 Webflow Member ID:", webflowMemberId);
        console.log("🔍 Memberstack Member ID:", memberstackMemberId);
        
        // Validiere kritische Felder - Prüfe auf Fehler vor dem API-Aufruf
        let errorMessage = "";
        
        if (!videoLink) {
            errorMessage = "Video Link konnte nicht ermittelt werden. Bitte versuche das Video erneut hochzuladen.";
            console.error("❌ " + errorMessage);
        }
        
        // Wenn Fehler gefunden wurden, zeige Fehlermeldung an und breche ab
        if (errorMessage) {
            showCustomProgressBar();
            updateCustomProgressBar(0.3, false, errorMessage);
            return;
        }
        
        const formData = {
            name: videoName,
            slug: slug,
            kategorie: getKategorieId(),
            beschreibung: getValue("textarea[name='Beschreibung']") || getValue("input[name='Beschreibung']", "Keine Beschreibung"),
            openVideo: findCheckbox(['open video', 'Open Video', 'öffentliches video', 'Öffentliches Video']),
            videoContest: findCheckbox(['video contest', 'Video Contest']),
            webflowMemberId: webflowMemberId,
            memberstackMemberId: memberstackMemberId,
            memberName: getValue("input[name='Member Name']", "Unbekannter Nutzer"),
            videoLink: videoLink
        };

        if (window.WEBFLOW_API.DEBUG_MODE) {
            console.log("📝 Erfasste Formulardaten:", formData);
        }

        // Zeige den benutzerdefinierten Fortschrittsbalken nach dem Absenden des Formulars
        showCustomProgressBar();

        try {
            // Fortschrittssimulation für die API-Anfrage
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 0.1; // Erhöhe um 10%
                if (progress > 0.9) {
                    clearInterval(progressInterval);
                }
                updateCustomProgressBar(progress, true);
            }, 300);

            // 1. Tatsächliche API-Anfrage zum Erstellen des Videos
            console.log("📹 Erstelle neues Video in Webflow CMS...");
            const videoResult = await createCMSItem(formData);
            
            // Setze den Fortschritt auf 70% nach dem erfolgreichen Video-Upload
            clearInterval(progressInterval);
            updateCustomProgressBar(0.7, true);
            
            // Extrahiere die ID des neu erstellten Videos
            const newVideoId = videoResult.id;
            if (!newVideoId) {
                throw new Error("Video wurde erstellt, aber keine ID erhalten");
            }
            
            console.log("✅ Video erfolgreich erstellt mit ID:", newVideoId);
            
            // Prüfe, ob Member-IDs vorhanden sind
            let hasMemberId = !!(webflowMemberId || memberstackMemberId);
            
            if (!hasMemberId) {
                console.warn("⚠️ Keine Member IDs gefunden, überspringe Member-Update");
                // Zeige Warnung im Fortschrittsbalken, aber markiere als erfolgreich
                updateCustomProgressBar(1.0, true, "Video erfolgreich hochgeladen, aber es wurde kein Mitgliedsprofil gefunden.", true);
                
                // Zeige Erfolgs-DIV an, falls vorhanden
                if (successDiv) {
                    successDiv.style.display = 'block';
                }
                return;
            }
            
            // 2. Aktualisiere den Member mit dem neuen Video
            console.log("👤 Füge Video zum Member-Profil hinzu...");
            updateCustomProgressBar(0.8, true);
            
            try {
                // Versuche zuerst mit Webflow ID, dann mit Memberstack ID
                let memberUpdateResult = null;
                
                if (webflowMemberId) {
                    console.log("🔍 Versuche Update mit Webflow Member ID:", webflowMemberId);
                    try {
                        memberUpdateResult = await updateMemberVideoFeed(webflowMemberId, newVideoId);
                    } catch (e) {
                        console.warn("⚠️ Fehler beim Update mit Webflow ID:", e.message);
                    }
                }
                
                if (!memberUpdateResult && memberstackMemberId) {
                    console.log("🔍 Webflow ID fehlgeschlagen, versuche mit Memberstack ID:", memberstackMemberId);
                    try {
                        memberUpdateResult = await updateMemberVideoFeed(memberstackMemberId, newVideoId);
                    } catch (e) {
                        console.warn("⚠️ Fehler beim Update mit Memberstack ID:", e.message);
                    }
                }
                
                if (!memberUpdateResult && memberstackMemberId) {
                    // Als letzten Ausweg, versuche alle Member zu durchsuchen und nach ähnlichen IDs zu suchen
                    console.log("🔄 Versuche manuelle Suche nach ähnlichen Memberstack IDs...");
                    
                    try {
                        // Hole die Liste aller Member
                        const listApiUrl = `${window.WEBFLOW_API.BASE_URL}/${window.WEBFLOW_API.MEMBERS_COLLECTION_ID}/items`;
                        const listWorkerUrl = buildWorkerUrl(listApiUrl);
                        
                        const response = await fetch(listWorkerUrl, {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json"
                            }
                        });
                        
                        if (response.ok) {
                            const responseData = await response.json();
                            
                            if (responseData.items && responseData.items.length > 0) {
                                // Streifen das "mem_" Präfix ab, falls vorhanden
                                const cleanedMemberstackId = memberstackMemberId.replace(/^mem_/, '');
                                
                                console.log("🔍 Suche nach Mitgliedern mit ID-Teil:", cleanedMemberstackId);
                                
                                // Suche nach Mitgliedern mit ähnlicher ID
                                for (const member of responseData.items) {
                                    if (member.fieldData && member.fieldData["memberstack-id"]) {
                                        const dbMemberstackId = member.fieldData["memberstack-id"];
                                        const cleanedDbId = dbMemberstackId.replace(/^mem_/, '');
                                        
                                        // Prüfe auf Teilübereinstimmung
                                        if (cleanedDbId.includes(cleanedMemberstackId) || 
                                            cleanedMemberstackId.includes(cleanedDbId)) {
                                            console.log("✅ Ähnliche ID gefunden:", dbMemberstackId);
                                            
                                            try {
                                                memberUpdateResult = await updateMemberVideoFeed(member.id, newVideoId);
                                                if (memberUpdateResult) {
                                                    console.log("✅ Mitgliedsprofil erfolgreich aktualisiert mit ähnlicher ID");
                                                    break;
                                                }
                                            } catch (e) {
                                                console.warn("⚠️ Update fehlgeschlagen trotz ähnlicher ID:", e.message);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.warn("⚠️ Fehler bei der manuellen Suche:", e.message);
                    }
                }
                
                if (memberUpdateResult) {
                    console.log("✅ Member-Profil erfolgreich aktualisiert:", memberUpdateResult);
                    
                    // Alles erfolgreich - setze Fortschritt auf 100%
                    updateCustomProgressBar(1.0, true);
                    
                    // Zeige Erfolgs-DIV an, falls vorhanden
                    if (successDiv) {
                        successDiv.style.display = 'block';
                    }
                    
                    // Füge "Fenster schließen" Button hinzu
                    addCloseButton();
                } else {
                    // Member nicht gefunden oder Update fehlgeschlagen, aber Video wurde trotzdem erstellt
                    console.warn("⚠️ Video wurde erstellt, aber Member-Update fehlgeschlagen: Member nicht gefunden");
                    
                    // Zeige Warnung im Fortschrittsbalken, aber markiere als erfolgreich
                    updateCustomProgressBar(0.9, true, "Video erfolgreich hochgeladen, aber die Zuordnung zu deinem Profil ist fehlgeschlagen.", true);
                    
                    // Zeige Erfolgs-DIV trotzdem an, falls vorhanden
                    if (successDiv) {
                        successDiv.style.display = 'block';
                    }
                    
                    // Füge "Fenster schließen" Button hinzu
                    addCloseButton();
                }
            } catch (memberError) {
                console.error("⚠️ Video wurde erstellt, aber Member-Update fehlgeschlagen:", memberError);
                
                // Zeige Warnung im Fortschrittsbalken, aber markiere als erfolgreich
                updateCustomProgressBar(0.9, true, "Video erfolgreich hochgeladen, aber die Zuordnung zu deinem Profil ist fehlgeschlagen.", true);
                
                // Zeige Erfolgs-DIV trotzdem an, falls vorhanden
                if (successDiv) {
                    successDiv.style.display = 'block';
                }
            }
            
            // Optional: Formular zurücksetzen oder zur Bestätigungsseite weiterleiten
            // setTimeout(() => {
            //     window.location.href = "/upload-success";
            // }, 2000);
        } catch (error) {
            console.error("❌ Fehler beim Hochladen:", error);
            
            // Versuche eine spezifische Fehlermeldung zu extrahieren
            let errorMessage = "Es ist leider ein Fehler beim Hochladen aufgetreten. Bitte versuche es erneut.";
            
            if (error && error.message) {
                // Versuche, eine benutzerfreundlichere Meldung aus dem Fehler zu extrahieren
                if (error.message.includes("401")) {
                    errorMessage = "Authentifizierungsfehler. Bitte versuche es erneut oder kontaktiere den Support.";
                } else if (error.message.includes("404")) {
                    errorMessage = "Die API konnte nicht gefunden werden. Bitte kontaktiere den Support.";
                } else if (error.message.includes("500")) {
                    errorMessage = "Serverfehler beim Verarbeiten des Videos. Bitte versuche es später erneut.";
                } else if (error.message.includes("Member")) {
                    errorMessage = "Dein Mitgliedsprofil konnte nicht gefunden werden. Bitte versuche es erneut oder kontaktiere den Support.";
                }
            }
            
            // Zeige Fehlerstatus im Fortschrittsbalken
            updateCustomProgressBar(0.3, false, errorMessage);
        }
    });
});

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

/**
 * WebflowUploader - Eine verbesserte Klasse zur Verwaltung von Video-Uploads in Webflow
 * 
 * Features:
 * - Bessere Code-Organisation durch Klassenstruktur
 * - Verbesserte Performance durch DOM-Caching
 * - Erweiterte UI/UX mit besseren Statusmeldungen
 * - Automatischer Reload nach erfolgreichem Upload
 * - Verbesserte Fehlerbehandlung mit nutzerfreundlichen Meldungen
 */
class WebflowUploader {
    constructor(config) {
        // Konfiguration und Zustände
        this.config = config || window.WEBFLOW_API;
        this.uploadcareFileUuid = "";
        this.uploadcareFileCdnUrl = "";
        this.uploadcareProcessedUrl = "";
        this.isVideoProcessing = false;
        this.isUploading = false;
        
        // DOM-Cache für bessere Performance
        this.domElements = {};
        
        // Event-Handler binden
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.initUploadcare = this.initUploadcare.bind(this);
        
        // Initialisieren sobald DOM bereit ist
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }
    
    /**
     * Initialisiert den Uploader und Cache der DOM-Elemente
     */
    initialize() {
        console.log("🔧 Webflow API Konfiguration:", this.config);
        
        // DOM-Elemente cachen für bessere Performance
        this.cacheElements();
        
        if (!this.domElements.form) {
            console.error(`❌ Formular mit ID '${this.config.FORM_ID}' nicht gefunden.`);
            return;
        }

        console.log("✅ Member Video Upload Script geladen für Formular:", this.domElements.form.id);
        
        // Formularanalyse durchführen (nur im Debug-Modus)
        if (this.config.DEBUG_MODE) {
            this.analyzeForm(this.domElements.form);
        }

        // Erstelle den Container für Dateiinformationen, falls er nicht existiert
        if (!document.getElementById('fileInfo')) {
            const fileInfoDiv = document.createElement('div');
            fileInfoDiv.id = 'fileInfo';
            fileInfoDiv.className = 'db-file-info'; // Klasse für Styling
            this.domElements.form.appendChild(fileInfoDiv);
            this.domElements.fileInfo = fileInfoDiv;
        }

        // Event-Listener für das Formular
        this.domElements.form.addEventListener("submit", this.handleFormSubmit);
        
        // Initialisiere Uploadcare-Integration
        this.initUploadcare();
        
        // Verstecke den benutzerdefinierten Fortschrittsbalken initial
        this.hideCustomProgressBar();
        
        // Prüfe, ob ein erfolgreicher Upload stattgefunden hat
        this.checkForSuccessfulUpload();
    }
    
    /**
     * Prüft, ob ein erfolgreicher Upload stattgefunden hat und zeigt ggf. eine Meldung an
     */
    checkForSuccessfulUpload() {
        const successFlag = localStorage.getItem('videoUploadSuccess');
        const uploadTime = localStorage.getItem('videoUploadTime');
        
        if (successFlag === 'true' && uploadTime) {
            // Prüfe, ob das Success-Flag kürzlich gesetzt wurde (in den letzten 5 Sekunden)
            const timeDiff = Date.now() - parseInt(uploadTime, 10);
            
            if (timeDiff < 5000) { // 5 Sekunden
                // Zeige eine Erfolgsmeldung nach dem Reload
                const successMessage = document.createElement('div');
                successMessage.className = 'reload-success-message';
                successMessage.innerHTML = `
                    <div class="success-message-content">
                        <div class="success-icon">✓</div>
                        <p>Dein Video wurde erfolgreich hochgeladen!</p>
                        <button class="close-message">Schließen</button>
                    </div>
                `;
                
                // Styling
                const style = document.createElement('style');
                style.textContent = `
                    .reload-success-message {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: rgba(76, 175, 80, 0.9);
                        color: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        z-index: 9999;
                        animation: slideIn 0.5s forwards;
                    }
                    .success-message-content {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .success-icon {
                        font-size: 24px;
                        font-weight: bold;
                    }
                    .close-message {
                        margin-left: 10px;
                        background: rgba(255, 255, 255, 0.3);
                        border: none;
                        padding: 5px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        color: white;
                    }
                    .close-message:hover {
                        background: rgba(255, 255, 255, 0.5);
                    }
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `;
                
                document.head.appendChild(style);
                document.body.appendChild(successMessage);
                
                // Schließen-Button Funktionalität
                const closeButton = successMessage.querySelector('.close-message');
                if (closeButton) {
                    closeButton.addEventListener('click', () => {
                        successMessage.remove();
                        // Lösche den Success-Flag
                        localStorage.removeItem('videoUploadSuccess');
                        localStorage.removeItem('videoUploadTime');
                    });
                }
                
                // Automatisch ausblenden nach 5 Sekunden
                setTimeout(() => {
                    if (document.body.contains(successMessage)) {
                        successMessage.style.animation = 'slideOut 0.5s forwards';
                        successMessage.addEventListener('animationend', () => {
                            if (document.body.contains(successMessage)) {
                                successMessage.remove();
                            }
                        });
                        
                        // Füge die slideOut Animation zum Stylesheet hinzu
                        style.textContent += `
                            @keyframes slideOut {
                                from { transform: translateX(0); opacity: 1; }
                                to { transform: translateX(100%); opacity: 0; }
                            }
                        `;
                        
                        // Lösche den Success-Flag
                        localStorage.removeItem('videoUploadSuccess');
                        localStorage.removeItem('videoUploadTime');
                    }
                }, 5000);
            } else {
                // Flag ist zu alt, löschen
                localStorage.removeItem('videoUploadSuccess');
                localStorage.removeItem('videoUploadTime');
            }
        }
    }
    
    /**
     * Erstellt Cache für DOM-Elemente zur Performance-Optimierung
     */
    cacheElements() {
        // Formular
        this.domElements.form = document.getElementById(this.config.FORM_ID);
        
        // Success div
        this.domElements.successDiv = document.getElementById(this.config.SUCCESS_DIV_ID);
        
        // Progress bar Elemente
        this.domElements.progressWrapper = document.querySelector('.db-modal-progress-wrapper');
        this.domElements.progressBar = document.querySelector('.db-modal-progessbar');
        this.domElements.progressText = document.querySelector('.db-modal-progress-text');
        this.domElements.progressPercentage = document.querySelector('.db-modal-progress-percentage');
        this.domElements.progressImg = document.querySelector('.db-modal-progress-img');
        
        // Submit Button
        if (this.domElements.form) {
            this.domElements.submitButton = this.domElements.form.querySelector('input[type="submit"], button[type="submit"]');
        }
        
        // Fileinfo div
        this.domElements.fileInfo = document.getElementById('fileInfo');
        
        // Uploadcare Element
        this.domElements.uploaderCtx = document.querySelector('[id*="uploaderCtx"]');
    }
    
    /**
     * Erstellt die Worker-URL für API-Anfragen
     * @param {string} apiUrl - Die zu umhüllende API-URL
     * @returns {string} Die vollständige Worker-URL
     */
    buildWorkerUrl(apiUrl) {
        return `${this.config.WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
    }
    
    /**
     * Analysiert das Formular und gibt Details zu allen Eingabefeldern aus
     * @param {HTMLFormElement} form - Das zu analysierende Formular
     */
    analyzeForm(form) {
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
    
    /**
     * Initialisiert Uploadcare und setzt Event-Listener
     */
    initUploadcare() {
        if (!this.domElements.uploaderCtx) {
            console.warn("⚠️ Uploadcare Context Provider nicht gefunden");
            return;
        }

        console.log("✅ Uploadcare Context Provider gefunden", this.domElements.uploaderCtx);

        // Event-Listener für erfolgreiche Uploads
        this.domElements.uploaderCtx.addEventListener('file-upload-success', this.handleUploadSuccess.bind(this));
        
        // Event-Listener für Upload-Fortschritt
        this.domElements.uploaderCtx.addEventListener('file-upload-progress', this.handleUploadProgress.bind(this));
        
        // Event-Listener für Start des Uploads
        this.domElements.uploaderCtx.addEventListener('file-upload-start', () => {
            console.log("🏁 Upload gestartet");
            this.isUploading = true;
        });
        
        // Event-Listener für Upload-Fehler
        this.domElements.uploaderCtx.addEventListener('file-upload-failed', (event) => {
            console.error("❌ Upload fehlgeschlagen:", event.detail);
            this.isUploading = false;
            this.showCustomProgressBar();
            this.updateCustomProgressBar(0.1, false, "Upload fehlgeschlagen. Bitte versuche es erneut.");
        });
        
        // Regelmäßige Überprüfung für Uploads (weniger häufig für bessere Performance)
        setInterval(() => this.getUploadcareFileInfo(), 2000);
    }
    
    /**
     * Behandelt erfolgreiche Uploads von Uploadcare
     * @param {Event} event - Das Upload-Ereignis
     */
    async handleUploadSuccess(event) {
        console.log("🚀 Uploadcare Upload erfolgreich:", event.detail);
        this.isUploading = false;
        const fileEntry = this.getUploadcareFileInfo();
        
        // Deaktiviere den Submit-Button während der Konvertierung
        if (this.domElements.submitButton) {
            const originalValue = this.domElements.submitButton.value || this.domElements.submitButton.textContent;
            this.domElements.submitButton.disabled = true;
            
            if (this.domElements.submitButton.type === 'submit') {
                this.domElements.submitButton.value = "Video wird optimiert...";
            } else {
                this.domElements.submitButton.textContent = "Video wird optimiert...";
            }
            
            // Wenn Video hochgeladen, starte die Konvertierung
            if (fileEntry && this.uploadcareFileUuid) {
                try {
                    // Zeige Konvertierungsstatus an
                    this.isVideoProcessing = true;
                    this.showCustomProgressBar();
                    this.updateCustomProgressBar(0.4, true, "Video wird optimiert...");
                    
                    if (fileEntry) {
                        this.displayFileInfo(fileEntry, false);
                    }
                    
                    // Starte die Videokonvertierung mit dem Worker
                    const result = await this.convertVideoWithWorker(this.uploadcareFileUuid);
                    
                    // Aktualisiere die Anzeige nach der Konvertierung
                    if (fileEntry) {
                        this.displayFileInfo(fileEntry, false);
                    }
                    
                    if (result) {
                        this.updateCustomProgressBar(0.6, true, "Video erfolgreich optimiert!");
                    }
                } catch (error) {
                    console.error("❌ Fehler bei der Videokonvertierung:", error);
                    this.updateCustomProgressBar(0.3, false, "Videooptimierung fehlgeschlagen. Du kannst trotzdem fortfahren.");
                } finally {
                    // Reaktiviere den Submit-Button
                    if (this.domElements.submitButton) {
                        this.domElements.submitButton.disabled = false;
                        
                        if (this.domElements.submitButton.type === 'submit') {
                            this.domElements.submitButton.value = originalValue;
                        } else {
                            this.domElements.submitButton.textContent = originalValue;
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Behandelt Upload-Fortschrittsereignisse
     * @param {Event} event - Das Fortschrittsereignis
     */
    handleUploadProgress(event) {
        console.log("📊 Upload-Fortschritt:", event.detail);
        
        if (this.isUploading) {
            // Berechne den Fortschritt (0-0.4, um Platz für Konvertierung zu lassen)
            const progress = Math.min(0.4, event.detail.progress * 0.4);
            
            this.showCustomProgressBar();
            this.updateCustomProgressBar(progress, true, "Video wird hochgeladen...");
        }
        
        this.getUploadcareFileInfo();
    }
    
    /**
     * Ruft die Dateiinformationen von Uploadcare ab
     * @returns {Object|null} Die Dateiinformationen oder null bei Fehler
     */
    getUploadcareFileInfo() {
        try {
            const api = this.domElements.uploaderCtx.getAPI();
            const state = api.getOutputCollectionState();
            
            if (state.successCount > 0) {
                // Nimm die erste erfolgreiche Datei
                const fileEntry = state.successEntries[0];
                
                // Speichere die UUID und CDN URL
                this.uploadcareFileUuid = fileEntry.uuid || "";
                this.uploadcareFileCdnUrl = fileEntry.cdnUrl || "";
                
                console.log("🎯 Uploadcare Datei gefunden:", {
                    name: fileEntry.name,
                    uuid: this.uploadcareFileUuid,
                    originalCdnUrl: this.uploadcareFileCdnUrl
                });
                
                // Aktualisiere versteckte Felder im Formular
                this.updateHiddenFields();
                
                // Zeige Dateiinformationen an
                this.displayFileInfo(fileEntry);
                
                return fileEntry;
            }
            
            // Prüfe, ob derzeit eine Datei hochgeladen wird
            if (state.uploadingCount > 0) {
                const uploadingFile = state.uploadingEntries[0];
                this.displayFileInfo(uploadingFile, true);
            }
            
            return null;
        } catch (error) {
            console.error("❌ Fehler beim Abrufen der Uploadcare-Dateiinformationen:", error);
            return null;
        }
    }
    
    /**
     * Aktualisiert versteckte Felder im Formular
     */
    updateHiddenFields() {
        if (!this.domElements.form) return;
        
        // Suche nach versteckten Feldern für die UUID und CDN URL
        const videoLinkInput = this.domElements.form.querySelector("input[name='Video Link'], input[name='VideoLink'], input[name='video-link']");
        if (videoLinkInput) {
            // Bevorzuge die konvertierte URL, falls vorhanden
            videoLinkInput.value = this.uploadcareProcessedUrl || this.uploadcareFileCdnUrl;
            console.log("✅ Verstecktes Feld 'Video Link' aktualisiert:", videoLinkInput.value);
        }
        
        // Optional: Feld für die UUID finden und aktualisieren
        const uuidInput = this.domElements.form.querySelector("input[name='File UUID'], input[name='FileUUID'], input[name='file-uuid']");
        if (uuidInput) {
            uuidInput.value = this.uploadcareFileUuid;
            console.log("✅ Verstecktes Feld 'File UUID' aktualisiert:", this.uploadcareFileUuid);
        }
    }
    
    /**
     * Zeigt Dateiinformation an
     * @param {Object} fileEntry - Die Dateiinformationen
     * @param {boolean} isUploading - Ob die Datei gerade hochgeladen wird
     */
    displayFileInfo(fileEntry, isUploading = false) {
        if (!this.domElements.fileInfo) return;
        
        let statusText = "";
        let statusClass = "";
        
        if (isUploading) {
            statusText = `Wird hochgeladen (${Math.round(fileEntry.uploadProgress)}%)...`;
            statusClass = "uploading";
        } else if (this.isVideoProcessing) {
            statusText = 'Video wird optimiert...';
            statusClass = "processing";
        } else {
            statusText = 'Erfolgreich hochgeladen';
            statusClass = "success";
        }
        
        this.domElements.fileInfo.innerHTML = `
            <div class="file-info-container">
                <p class="is-txt-16"><strong>Datei:</strong> ${this.sanitizeHTML(fileEntry.name)}</p>
                <p class="is-txt-16"><strong>Größe:</strong> ${this.formatFileSize(fileEntry.size)}</p>
                <p class="is-txt-16"><strong>Status:</strong> <span class="status-${statusClass}">${statusText}</span></p>
            </div>
        `;
    }
    
    /**
     * Sichert HTML-Strings gegen Injection ab
     * @param {string} html - Der zu sichernde String
     * @returns {string} Der gesicherte String
     */
    sanitizeHTML(html) {
        const doc = document.createElement('div');
        doc.textContent = html;
        return doc.innerHTML;
    }
    
    /**
     * Formatiert Dateigröße in lesbare Einheiten
     * @param {number} bytes - Die Dateigröße in Bytes
     * @returns {string} Die formatierte Dateigröße
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Konvertiert ein Video mit dem Cloudflare Worker
     * @param {string} uuid - Die UUID der zu konvertierenden Datei
     * @returns {Object|null} Das Konvertierungsergebnis oder null bei Fehler
     */
    async convertVideoWithWorker(uuid) {
        if (!uuid) {
            console.warn("⚠️ Keine UUID für Videokonvertierung vorhanden");
            return null;
        }

        try {
            this.isVideoProcessing = true;
            console.log("🎬 Starte Videokonvertierung für UUID:", uuid);

            // Sende Anfrage an den Cloudflare Worker
            const response = await fetch(this.config.VIDEO_CONVERT_WORKER_URL, {
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
            
            this.isVideoProcessing = false;

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
                    this.uploadcareProcessedUrl = `https://ucarecdn.com/${convertedUuid}/`;
                    
                    // Aktualisiere versteckte Felder
                    this.updateHiddenFields();
                    
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
            this.isVideoProcessing = false;
            console.error("❌ Fehler bei der Videokonvertierung:", error);
            return null;
        }
    }
    
    /**
     * Lädt die Seite nach einem erfolgreichen Upload neu
     */
    reloadPageAfterSuccess() {
        // Verzögerung für bessere UX, damit der Nutzer den Erfolg sehen kann
        setTimeout(() => {
            // Lokalen Storage-Eintrag setzen, um nach dem Reload anzuzeigen, dass Upload erfolgreich war
            localStorage.setItem('videoUploadSuccess', 'true');
            localStorage.setItem('videoUploadTime', Date.now().toString());
            
            // Seite neu laden
            window.location.reload();
        }, 3000); // 3 Sekunden Verzögerung, damit der Nutzer den Erfolg sehen kann
    }
    
    /**
     * Sammelt alle Formulardaten und bereitet sie für die API vor
     * @returns {Object|null} Die gesammelten Formulardaten oder null bei Fehler
     */
    getFormData() {
        if (!this.domElements.form) return null;
        
        /**
         * Hilfsfunktion zum Abrufen von Formularfeldwerten
         * @param {string} selector - Der CSS-Selektor für das Feld
         * @param {string} defaultValue - Der Standardwert, falls das Feld nicht gefunden wird
         * @returns {string} Der Wert des Feldes oder der Standardwert
         */
        const getValue = (selector, defaultValue = "") => {
            const element = this.domElements.form.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ Feld '${selector}' nicht gefunden. Setze Standardwert: '${defaultValue}'`);
                return defaultValue;
            }
            return element.value;
        };

        /**
         * Hilfsfunktion zum Abrufen von Checkbox-Werten
         * @param {string} selector - Der CSS-Selektor für die Checkbox
         * @returns {boolean} Der Zustand der Checkbox (true/false)
         */
        const getChecked = (selector) => {
            const element = this.domElements.form.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ Checkbox '${selector}' nicht gefunden. Standard: false`);
                return false;
            }
            return element.checked;
        };
        
        /**
         * Hilfsfunktion zum Finden einer Checkbox anhand mehrerer möglicher Namen
         * @param {Array} possibleNames - Array möglicher Namen für die Checkbox
         * @returns {boolean} Der Zustand der ersten gefundenen Checkbox
         */
        const findCheckbox = (possibleNames) => {
            for (const name of possibleNames) {
                // Versuche verschiedene Selektoren
                const selectors = [
                    `input[name='${name}']`,
                    `input[data-name='${name}']`,
                    `input#${name}`,
                    `input[placeholder='${name}']`
                ];
                
                for (const selector of selectors) {
                    const element = this.domElements.form.querySelector(selector);
                    if (element && element.type === 'checkbox') {
                        return element.checked;
                    }
                }
            }
            
            console.warn(`⚠️ Keine Checkbox mit Namen ${possibleNames.join(', ')} gefunden`);
            return false;
        };
        
        // Videoname abrufen oder Default verwenden
        const videoName = getValue("input[name='Name']", "Unbenanntes Video");
        
        // Erstelle einen Slug aus Videoname und UUID
        let slug = videoName.toLowerCase()
            .replace(/\s+/g, "-")        // Leerzeichen zu Bindestrichen
            .replace(/[^a-z0-9-]/g, "")  // Nur alphanumerische und Bindestriche
            .replace(/-+/g, "-")         // Mehrfache Bindestriche zu einem
            .replace(/^-|-$/g, "");      // Bindestriche am Anfang und Ende entfernen
            
        // Füge UUID hinzu für Eindeutigkeit
        if (this.uploadcareFileUuid) {
            slug = `${slug}-${this.uploadcareFileUuid.slice(0, 8)}`; // Nimm die ersten 8 Zeichen der UUID
        }

        // Ermittle die IDs
        const webflowMemberId = getValue("input[name='Webflow Member ID']", "");
        const memberstackMemberId = getValue("input[name='Memberstack Member ID']", "");
        const videoLink = this.getVideoLink(); // Diese Methode nutzt die konvertierte URL
        
        // Debugge die IDs
        console.log("🔍 Webflow Member ID:", webflowMemberId);
        console.log("🔍 Memberstack Member ID:", memberstackMemberId);
        
        // Validiere kritische Felder
        if (!videoLink) {
            const errorMessage = "Video Link konnte nicht ermittelt werden. Bitte versuche das Video erneut hochzuladen.";
            console.error("❌ " + errorMessage);
            this.showCustomProgressBar();
            this.updateCustomProgressBar(0.3, false, errorMessage);
            return null;
        }
        
        // Erstelle das Formulardaten-Objekt
        return {
            name: videoName,
            slug: slug,
            kategorie: this.getKategorieId(),
            beschreibung: getValue("textarea[name='Beschreibung']") || getValue("input[name='Beschreibung']", "Keine Beschreibung"),
            openVideo: findCheckbox(['open video', 'Open Video', 'öffentliches video', 'Öffentliches Video']),
            videoContest: findCheckbox(['video contest', 'Video Contest']),
            webflowMemberId: webflowMemberId,
            memberstackMemberId: memberstackMemberId,
            memberName: getValue("input[name='Member Name']", "Unbekannter Nutzer"),
            videoLink: videoLink
        };

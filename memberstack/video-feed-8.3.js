/**
 * Webflow API Integration für Video-Feed
 * Optimierte Version 8.1
 * 
 * Ein modulares, robustes Script zur Verwaltung von Video-Uploads und deren Anzeige
 * mit verbesserter Fehlerbehandlung, Debugging und Konfigurationsmöglichkeiten.
 */

// Sofort ausgeführte Funktion zum Schutz des globalen Namensraums
(function() {
  'use strict';

  /**
   * Debug-Konfiguration
   * Kann zentral aktiviert/deaktiviert werden
   */
  const DEBUG = {
    enabled: true,
    prefix: '📋 Video-Feed:',
    levels: {
      info: true,
      warn: true,
      error: true
    },
    
    /**
     * Loggt eine Nachricht, wenn Debugging aktiviert ist
     * @param {string} message - Die Log-Nachricht
     * @param {any} data - Optionale Daten zum Loggen
     * @param {string} level - Log-Level (info, warn, error)
     */
    log: function(message, data = null, level = 'info') {
      if (!this.enabled || !this.levels[level]) return;
      
      const prefix = this.prefix;
      
      switch (level) {
        case 'warn':
          console.warn(`${prefix} ${message}`, data !== null ? data : '');
          break;
        case 'error':
          console.error(`${prefix} ${message}`, data !== null ? data : '');
          break;
        default:
          console.log(`${prefix} ${message}`, data !== null ? data : '');
      }
    },
    
    /**
     * Aktiviert oder deaktiviert das Debugging
     * @param {boolean} enabled - true zum Aktivieren, false zum Deaktivieren
     */
    setEnabled: function(enabled) {
      this.enabled = enabled;
      console.log(`${this.prefix} Debugging ${enabled ? 'aktiviert' : 'deaktiviert'}`);
    }
  };
  
  /**
   * Standard-Konfigurationswerte
   */
  const DEFAULT_CONFIG = {
    // API-Endpunkte
    BASE_URL: 'https://api.webflow.com/v2/collections',
    WORKER_BASE_URL: 'https://bewerbungen.oliver-258.workers.dev/?url=',
    
    // Collection-IDs
    MEMBER_COLLECTION_ID: '6448faf9c5a8a15f6cc05526',
    VIDEO_COLLECTION_ID: '67d806e65cadcadf2f41e659',
    
    // Memberships - explizit als Zahl
    FREE_MEMBER_LIMIT: 1,
    PAID_MEMBER_LIMIT: 12,
    
    // UI-Element-IDs
    VIDEO_CONTAINER_ID: 'video-feed',
    UPLOAD_LIMIT_TITLE_ID: 'upload-limit-title',
    UPLOAD_COUNTER_ID: 'uploads-counter',
    UPLOAD_PROGRESS_ID: 'uploads-progress',
    UPLOAD_LIMIT_MESSAGE_ID: 'upload-limit-message',
    PLAN_STATUS_ID: 'plan-status',
    
    // Cache-Konfiguration
    CACHE_ENABLED: false, // Cache standardmäßig deaktiviert
    CACHE_EXPIRATION: 5 * 60 * 1000, // 5 Minuten (wird nur verwendet wenn Cache aktiviert ist)
    
    // Kategorien-Mapping - vollständige Liste aller möglichen IDs für die Kategorien
    CATEGORY_MAPPING: {
      // Travel - verschiedene mögliche ID-Formate
      'a1c318daa4a4fdc904d0ea6ae57e9eb6': 'Travel',
      'a1c318': 'Travel',
      'a1c318da': 'Travel',
      'a1c318daa4a4': 'Travel',
      // Entertainment
      'f7375698898acddde00653547c8fa793': 'Entertainment',
      'f73756': 'Entertainment',
      // Food
      '0e068df04f18438e4a5b68d397782f36': 'Food',
      '0e068d': 'Food',
      // Beauty
      '2f1f2fe0cd35ddd19ca98f4b85b16258': 'Beauty',
      '2f1f2f': 'Beauty',
      // Fashion
      'd98ec62473786dfe4b680ffaff56df3d': 'Fashion',
      'd98ec6': 'Fashion',
      // Fitness
      '7a825bdb2886afb7afc15ace93407334': 'Fitness',
      '7a825b': 'Fitness',
      // Technology
      '172297c1eff716fecb37e1086835fb54': 'Technology',
      '172297': 'Technology',
      // Gaming
      '0150c802834f25c5eb9a235e5f333086': 'Gaming',
      '0150c8': 'Gaming',
      // Art & Culture
      '827b3ec71e6dd2e64687ac4a2bcde003': 'Art & Culture',
      '827b3e': 'Art & Culture',
      // Household
      '17907bdb5206dc3d81ffc984f810e58b': 'Household',
      '17907b': 'Household',
      // Home & Living
      'd9e7f4c91b3e5a8022c3a6497f1d8b55': 'Home & Living',
      'd9e7f4': 'Home & Living'
    }
  };

  /**
   * Cache-Klasse für API-Antworten und andere Daten
   */
  class SimpleCache {
    constructor(config) {
      this.items = {};
      this.expiration = config.CACHE_EXPIRATION || 300000; // Default 5 Minuten
      this.enabled = config.CACHE_ENABLED !== undefined ? config.CACHE_ENABLED : true;
      DEBUG.log('Cache initialisiert mit Expiration: ' + this.expiration + 'ms, Aktiviert: ' + this.enabled);
    }

    /**
     * Aktiviert oder deaktiviert den Cache
     * @param {boolean} enabled - true zum Aktivieren, false zum Deaktivieren
     */
    setEnabled(enabled) {
      this.enabled = enabled;
      DEBUG.log(`Cache ist jetzt ${enabled ? 'aktiviert' : 'deaktiviert'}`);
      if (!enabled) {
        this.clear();
      }
    }

    /**
     * Holt einen Wert aus dem Cache
     * @param {string} key - Der Cache-Schlüssel
     * @returns {any|null} - Der gecachte Wert oder null wenn nicht vorhanden/abgelaufen/deaktiviert
     */
    get(key) {
      // Wenn Cache deaktiviert ist, immer null zurückgeben
      if (!this.enabled) {
        DEBUG.log(`Cache deaktiviert, überspringe Cache-Lookup für '${key}'`);
        return null;
      }

      const item = this.items[key];
      if (!item) return null;
      
      // Prüfen ob abgelaufen
      if (Date.now() - item.timestamp > this.expiration) { 
        DEBUG.log(`Cache-Eintrag für '${key}' abgelaufen`, null, 'info');
        delete this.items[key];
        return null;
      }
      
      DEBUG.log(`Cache-Hit für '${key}'`, null, 'info');
      return item.data;
    }

    /**
     * Speichert einen Wert im Cache
     * @param {string} key - Der Cache-Schlüssel
     * @param {any} data - Die zu cachenden Daten
     */
    set(key, data) {
      // Wenn Cache deaktiviert ist, nicht speichern
      if (!this.enabled) {
        DEBUG.log(`Cache deaktiviert, überspringe Speichern für '${key}'`);
        return;
      }

      this.items[key] = {
        timestamp: Date.now(),
        data: data
      };
      DEBUG.log(`Neuer Cache-Eintrag für '${key}' erstellt`, null, 'info');
    }

    /**
     * Leert den Cache vollständig
     */
    clear() {
      this.items = {};
      DEBUG.log('Cache wurde geleert', null, 'info');
    }
  }

  /**
   * UI-Manager-Klasse - Zuständig für alle DOM-Interaktionen
   */
  class UIManager {
    constructor(config) {
      this.config = config;
      this.elements = {};
      this.initialized = false;
    }
    
    /**
     * Initialisiert alle UI-Elemente
     * @returns {Object} - Objekt mit den gefundenen UI-Elementen
     */
    init() {
      if (this.initialized) return this.elements;
      
      DEBUG.log('Initialisiere UI-Elemente');
      
      // Wichtige UI-Elemente suchen und zwischenspeichern
      this.findElement('videoContainer', this.config.VIDEO_CONTAINER_ID, '.db-upload-wrapper');
      this.findElement('uploadLimitTitle', this.config.UPLOAD_LIMIT_TITLE_ID);
      this.findElement('uploadCounter', this.config.UPLOAD_COUNTER_ID);
      this.findElement('uploadProgress', this.config.UPLOAD_PROGRESS_ID);
      this.findElement('uploadLimitMessage', this.config.UPLOAD_LIMIT_MESSAGE_ID);
      this.findElement('planStatus', this.config.PLAN_STATUS_ID);
      
      // Log gefundene Elemente
      DEBUG.log('UI-Elemente gefunden:', 
        Object.entries(this.elements).reduce((acc, [key, value]) => {
          acc[key] = Boolean(value);
          return acc;
        }, {})
      );
      
      this.initialized = true;
      return this.elements;
    }
    
    /**
     * Sucht ein Element per ID mit Fallback auf Klasse
     * @param {string} name - Name für das gespeicherte Element
     * @param {string} id - ID des Elements
     * @param {string} fallbackSelector - Optionaler Fallback-Selektor
     * @returns {HTMLElement|null} - Das gefundene Element oder null
     */
    findElement(name, id, fallbackSelector = null) {
      if (!id && !fallbackSelector) {
        DEBUG.log(`Keine ID oder Fallback für ${name} angegeben`, null, 'warn');
        return null;
      }
      
      // Versuche per ID zu finden
      if (id) {
        const element = document.getElementById(id);
        if (element) {
          this.elements[name] = element;
          return element;
        }
        DEBUG.log(`Element mit ID '${id}' nicht gefunden`, null, 'warn');
      }
      
      // Wenn kein Element per ID gefunden, versuche Fallback-Selektor
      if (fallbackSelector) {
        const element = document.querySelector(fallbackSelector);
        if (element) {
          DEBUG.log(`Element '${name}' über Fallback-Selektor gefunden: ${fallbackSelector}`, null, 'info');
          this.elements[name] = element;
          return element;
        }
        DEBUG.log(`Element mit Fallback-Selektor '${fallbackSelector}' nicht gefunden`, null, 'warn');
      }
      
      return null;
    }
    
    /**
     * Zeigt den Mitgliedschaftsplan-Status an
     * @param {string} status - Der Status (Free/Plus)
     */
    updatePlanStatus(status) {
      if (!this.elements.planStatus) {
        DEBUG.log('Plan-Status Element nicht gefunden!', null, 'warn');
        return;
      }
      
      this.elements.planStatus.textContent = status;
      DEBUG.log(`Plan-Status aktualisiert: ${status}`);
      
      // Optional: Klassen für Styling hinzufügen
      this.elements.planStatus.classList.remove('plan-free', 'plan-plus');
      this.elements.planStatus.classList.add(status === 'Plus' ? 'plan-plus' : 'plan-free');
    }
    
    /**
     * Aktualisiert den Upload-Counter und Fortschrittsbalken
     * @param {number} videoCount - Anzahl der Videos
     * @param {number} maxUploads - Maximale Anzahl von Uploads
     * @returns {boolean} - true, wenn das Limit erreicht ist
     */
    updateUploadCounter(videoCount, maxUploads) {
      DEBUG.log('Aktualisiere Upload-Counter:', { videoCount, maxUploads });
      
      // Stelle sicher, dass die Zahlen für die Anzeige gültig sind
      const validVideoCount = isNaN(videoCount) ? 0 : videoCount;
      const validMaxUploads = isNaN(maxUploads) ? DEFAULT_CONFIG.PAID_MEMBER_LIMIT : maxUploads;
      
      DEBUG.log(`Verwende validierte Werte: ${validVideoCount}/${validMaxUploads}`);
      
      // Upload-Counter aktualisieren
      if (this.elements.uploadCounter) {
        this.elements.uploadCounter.textContent = `${validVideoCount}/${validMaxUploads}`;
        DEBUG.log('Upload-Counter aktualisiert:', `${validVideoCount}/${validMaxUploads}`);
      } else {
        DEBUG.log('⚠️ Upload-Counter Element nicht gefunden!', null, 'warn');
      }
      
      // Fortschrittsbalken aktualisieren
      if (this.elements.uploadProgress) {
        // Prozentsatz berechnen (max 100%)
        const progressPercent = Math.min(
          validMaxUploads > 0 ? (validVideoCount / validMaxUploads) * 100 : 0, 
          100
        );
        
        // Farbklassen basierend auf Fortschritt
        this.elements.uploadProgress.classList.remove("progress-low", "progress-medium", "progress-high", "progress-full");
        
        if (progressPercent >= 100) {
          this.elements.uploadProgress.classList.add("progress-full");
        } else if (progressPercent >= 70) {
          this.elements.uploadProgress.classList.add("progress-high");
        } else if (progressPercent >= 40) {
          this.elements.uploadProgress.classList.add("progress-medium");
        } else {
          this.elements.uploadProgress.classList.add("progress-low");
        }
        
        // Breite aktualisieren - Animation durch CSS
        this.elements.uploadProgress.style.width = `${progressPercent}%`;
        DEBUG.log('Fortschrittsbalken aktualisiert:', `${progressPercent}%`);
      } else {
        DEBUG.log('⚠️ Upload-Progress Element nicht gefunden!', null, 'warn');
      }
      
      // Limit-Status bestimmen
      const isLimitReached = validVideoCount >= validMaxUploads;
      
      // Upload-Buttons je nach Limit-Status ein/ausblenden
      const uploadButtons = document.querySelectorAll('[data-modal-toggle="new-upload"]');
      uploadButtons.forEach(button => {
        button.style.display = isLimitReached ? "none" : "";
      });
      DEBUG.log(`Upload-Buttons: ${isLimitReached ? 'ausgeblendet' : 'angezeigt'} (${uploadButtons.length})`);
      
      // Upload-Limit-Meldung aktualisieren
      if (this.elements.uploadLimitMessage) {
        this.elements.uploadLimitMessage.style.display = isLimitReached ? "block" : "none";
        this.elements.uploadLimitMessage.textContent = isLimitReached ? "Upload-Limit erreicht" : "";
        this.elements.uploadLimitMessage.classList.toggle("limit-reached", isLimitReached);
        DEBUG.log(`Limit-Meldung: ${isLimitReached ? 'angezeigt' : 'ausgeblendet'}`);
      } else {
        DEBUG.log('⚠️ Limit-Message Element nicht gefunden!', null, 'warn');
      }
      
      return isLimitReached;
    }
    
    /**
     * Zeigt eine Ladeanimation im Container an
     */
    showLoading() {
      if (!this.elements.videoContainer) {
        DEBUG.log('Video-Container nicht gefunden, kann Ladeanimation nicht anzeigen', null, 'warn');
        return;
      }
      
      // Container leeren
      this.elements.videoContainer.innerHTML = '';
      
      // CSS für Skeleton Loader hinzufügen, falls noch nicht vorhanden
      if (!document.getElementById('skeleton-loader-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'skeleton-loader-styles';
        styleElement.textContent = `
          .skeleton-item {
            position: relative;
            overflow: hidden;
          }
          .skeleton-video-pulse, .skeleton-text-pulse, .skeleton-button-pulse {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: skeleton-pulse 1.5s ease-in-out infinite;
            border-radius: 4px;
          }
          .skeleton-video-pulse {
            width: 100%;
            height: 100%;
            min-height: 180px;
          }
          .skeleton-button-pulse {
            width: 32px;
            height: 32px;
            border-radius: 50%;
          }
          @keyframes skeleton-pulse {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `;
        document.head.appendChild(styleElement);
      }
      
      // DocumentFragment für bessere Performance
      const fragment = document.createDocumentFragment();
      
      // Erstelle 3 Skeleton-Items
      for (let i = 0; i < 3; i++) {
        const skeleton = document.createElement('div');
        skeleton.classList.add('db-upload-wrapper-item', 'skeleton-item');
        
        skeleton.innerHTML = `
          <div class="db-upload-item-video skeleton-video">
            <div class="skeleton-video-pulse" style="animation-delay: ${i * 0.15}s"></div>
          </div>
          <div class="db-upload-item-details">
            <div class="db-upload-details-container">
              <div class="skeleton-text-pulse" style="width: ${70 - i * 10}%; height: 20px; animation-delay: ${i * 0.1}s"></div>
              <div class="skeleton-text-pulse" style="width: ${40 + i * 5}%; height: 14px; margin-top: 8px; animation-delay: ${i * 0.2}s"></div>
            </div>
            <div class="skeleton-button-pulse" style="animation-delay: ${i * 0.25}s"></div>
          </div>
        `;
        
        fragment.appendChild(skeleton);
      }
      
      // Alle Skeleton-Items auf einmal anhängen
      this.elements.videoContainer.appendChild(fragment);
      DEBUG.log('Ladeanimation angezeigt');
    }
    
    /**
     * Zeigt eine Fehlermeldung im Container an
     * @param {string} message - Die anzuzeigende Fehlermeldung
     */
    showError(message) {
      if (!this.elements.videoContainer) {
        DEBUG.log('Video-Container nicht gefunden, kann Fehlermeldung nicht anzeigen', null, 'warn');
        return;
      }
      
      this.elements.videoContainer.innerHTML = `
        <div class="error-message" style="padding: 20px; text-align: center; color: #e53e3e; background-color: #fff5f5; border: 1px solid #e53e3e; border-radius: 4px; margin: 20px 0;">
          <p>🚫 ${message}</p>
          <button style="margin-top: 10px; padding: 6px 12px; background: #4a5568; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.videoFeedApp.loadUserVideos()">
            Erneut versuchen
          </button>
        </div>
      `;
      DEBUG.log(`Fehlermeldung angezeigt: ${message}`, null, 'error');
    }
    
    /**
     * Erstellt einen "Erstes Video hochladen" Button bei leerem Video-Feed
     */
    createEmptyStateUploadButton() {
      if (!this.elements.videoContainer) {
        DEBUG.log('Video-Container nicht gefunden, kann leeren Zustand nicht anzeigen', null, 'warn');
        return;
      }
      
      const buttonContainer = document.createElement("div");
      buttonContainer.classList.add("db-upload-empty-state");
      
      // Upload-Button mit den notwendigen Attributen
      const uploadButton = document.createElement("a");
      uploadButton.href = "#"; 
      uploadButton.classList.add("db-upload-more-upload-button");
      uploadButton.setAttribute("data-modal-toggle", "new-upload");
      uploadButton.textContent = "Lade dein erstes Video hoch";
      
      buttonContainer.appendChild(uploadButton);
      this.elements.videoContainer.appendChild(buttonContainer);
      DEBUG.log('Leerer Zustand mit Upload-Button angezeigt');
    }
    
    /**
     * Rendert Videos im Container
     * @param {Array} videos - Array mit Video-Daten
     * @param {number} maxUploads - Max. erlaubte Uploads für den User
     */
    renderVideos(videos, maxUploads) {
      if (!this.elements.videoContainer) {
        DEBUG.log('Video-Container nicht gefunden, kann Videos nicht anzeigen', null, 'warn');
        return;
      }
      
      DEBUG.log(`Beginne Rendering von ${videos?.length || 0} Videos mit maxUploads = ${maxUploads}`);
      
      // Container leeren
      this.elements.videoContainer.innerHTML = "";
      
      // Prüfen, ob Videos vorhanden sind
      if (!videos || videos.length === 0) {
        this.createEmptyStateUploadButton();
        this.updateUploadCounter(0, maxUploads); // Expliziter counter update für leeren Zustand
        return;
      }
      
      // Prüfen, ob das Limit erreicht ist
      const isLimitReached = videos.length >= maxUploads;
      
      // DocumentFragment für bessere Performance
      const fragment = document.createDocumentFragment();
      
      // Videos rendern
      videos.forEach(videoData => {
        if (!videoData || !videoData["video-link"]) return;
        
        const wrapperDiv = document.createElement("div");
        wrapperDiv.classList.add("db-upload-wrapper-item");
        
        // Video-Element
        const videoDiv = document.createElement("div");
        videoDiv.classList.add("db-upload-item-video");
        
        const videoElement = document.createElement("video");
        videoElement.src = videoData["video-link"];
        videoElement.controls = true;
        videoElement.classList.add("db-upload-video");
        videoElement.addEventListener("error", () => {
          videoDiv.innerHTML = `
            <div class="video-error">
              <p>Video konnte nicht geladen werden</p>
            </div>
          `;
        });
        
        videoDiv.appendChild(videoElement);
        
        // Details-Container
        const detailsDiv = document.createElement("div");
        detailsDiv.classList.add("db-upload-item-details");
        
        // Container für Titel und Kategorie
        const detailsContainerDiv = document.createElement("div");
        detailsContainerDiv.classList.add("db-upload-details-container");
        
        // Titel
        const titleDiv = document.createElement("div");
        titleDiv.classList.add("db-upload-video-title");
        titleDiv.textContent = videoData["video-name"] || "Unbenanntes Video";
        
        // Kategorie - nur den Namen ohne "Kategorie:" davor
        const categoryName = videoData["kategorie-name"] || "Nicht angegeben";
        const categoryP = document.createElement("p");
        categoryP.classList.add("is-txt-tiny");
        categoryP.textContent = categoryName;
        
        // Debug-Ausgabe für Kategorie-Namen
        DEBUG.log(`Video ${videoData.id} verwendet Kategorie "${categoryName}" (Original-ID: "${videoData["video-kategorie"]}")`);
        
        // Edit-Button
        const editButton = document.createElement("button");
        editButton.classList.add("db-upload-settings");
        
        const videoId = videoData.id;
        editButton.setAttribute("data-video-edit", videoId);
        editButton.innerHTML = `<img src="https://cdn.prod.website-files.com/63db7d558cd2e4be56cd7e2f/678a26c04581673826145b8b_settings.svg" alt="Bearbeiten">`;
        editButton.title = "Video bearbeiten";
        
        // Event-Handler für Edit-Button
        editButton.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // Option 1: Wenn die editVideo-Funktion im globalen Scope ist
          if (typeof window.editVideo === "function") {
            window.editVideo(videoId);
          } 
          // Option 2: Manuell ein Event auslösen
          else {
            DEBUG.log(`Edit-Event ausgelöst für Video ID: ${videoId}`);
            const editEvent = new CustomEvent('videoEditRequest', { 
              detail: { videoId: videoId } 
            });
            document.dispatchEvent(editEvent);
          }
        };
        
        // Struktur zusammenfügen
        detailsContainerDiv.appendChild(titleDiv);
        detailsContainerDiv.appendChild(categoryP);
        detailsDiv.appendChild(detailsContainerDiv);
        detailsDiv.appendChild(editButton);
        
        wrapperDiv.appendChild(videoDiv);
        wrapperDiv.appendChild(detailsDiv);
        
        fragment.appendChild(wrapperDiv);
      });
      
      // Alle Video-Elemente auf einmal anhängen
      this.elements.videoContainer.appendChild(fragment);
      
      // Button für neue Videos hinzufügen, wenn Limit nicht erreicht
      if (!isLimitReached && videos.length > 0) {
        const addButtonContainer = document.createElement("div");
        addButtonContainer.classList.add("db-upload-add-new");
        
        const addButton = document.createElement("a");
        addButton.href = "#";
        addButton.classList.add("db-upload-more-upload-button");
        addButton.setAttribute("data-modal-toggle", "new-upload");
        addButton.textContent = "Video hinzufügen";
        
        addButtonContainer.appendChild(addButton);
        this.elements.videoContainer.appendChild(addButtonContainer);
      }
      
      DEBUG.log(`${videos.length} Videos gerendert, maxUploads = ${maxUploads}`);
      
      // Expliziten Upload-Counter-Update durchführen
      return this.updateUploadCounter(videos.length, maxUploads);
    }
  }

  /**
   * API-Service-Klasse - Verwaltet alle API-Anfragen
   */
  class ApiService {
    constructor(config) {
      this.config = config;
      this.cache = new SimpleCache(config);
    }
    
    /**
     * Erstellt eine Worker-URL für Cross-Origin-Anfragen
     * @param {string} apiUrl - Die Original-API-URL
     * @returns {string} - Die Worker-URL
     */
    buildWorkerUrl(apiUrl) {
      return `${this.config.WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
    }

    /**
     * Erstellt einen vollständigen API-Endpunkt
     * @param {string} path - Der API-Pfad
     * @param {Object} params - Query-Parameter
     * @returns {string} - Die vollständige API-URL
     */
    buildApiUrl(path, params = {}) {
      const baseUrl = this.config.BASE_URL;
      const fullUrl = `${baseUrl}${path}`;
      
      // Parameter als Query-String hinzufügen, wenn vorhanden
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined) continue;
        
        if (typeof value === 'object') {
          queryParams.append(key, encodeURIComponent(JSON.stringify(value)));
        } else {
          queryParams.append(key, value);
        }
      }
      
      const queryString = queryParams.toString();
      const finalUrl = queryString ? `${fullUrl}?${queryString}` : fullUrl;
      
      DEBUG.log(`API-URL erstellt: ${finalUrl}`);
      return finalUrl;
    }

    /**
     * Führt eine API-Anfrage durch mit Retry-Logik
     * @param {string} url - Die API-URL
     * @param {number} retries - Anzahl der Wiederholungsversuche
     * @returns {Promise<Object>} - Die API-Antwort
     */
    async fetchApi(url, retries = 2) {
      let attempt = 1;
      
      while (true) {
        try {
          DEBUG.log(`API-Anfrage (Versuch ${attempt}/${retries + 1}) an ${url}`);
          const response = await fetch(url);
          
          if (!response.ok) {
            const errorText = await response.text();
            DEBUG.log(`API-Fehler ${response.status}: ${errorText}`, null, 'error');
            
            if (attempt <= retries) {
              const delay = Math.min(1000 * attempt, 3000); // Exponential Backoff
              DEBUG.log(`Wiederhole in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              attempt++;
              continue;
            }
            
            throw new Error(`API-Fehler: ${response.status} - ${errorText.substring(0, 100)}`);
          }
          
          return await response.json();
        } catch (error) {
          if (attempt <= retries) {
            const delay = Math.min(1000 * attempt, 3000);
            DEBUG.log(`Fehler, wiederhole in ${delay}ms... ${error.message}`, null, 'warn');
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
            continue;
          }
          DEBUG.log('Maximale Anzahl an Versuchen erreicht', error, 'error');
          throw error;
        }
      }
    }

    /**
     * Holt einen User anhand seiner Webflow-ID
     * @param {string} webflowId - Die Webflow-ID des Users
     * @returns {Promise<Object>} - Die User-Daten
     */
    async getUserByWebflowId(webflowId) {
      if (!webflowId) {
        throw new Error("Webflow-ID fehlt");
      }
      
      DEBUG.log(`Suche User mit Webflow-ID: ${webflowId}`);
      
      const cacheKey = `webflow_user_${webflowId}`;
      const cachedUser = this.cache.get(cacheKey);
      
      if (cachedUser) {
        DEBUG.log(`User aus Cache geladen: ${webflowId}`);
        return cachedUser;
      }
      
      // API-URL für User erstellen
      const memberCollectionId = this.config.MEMBER_COLLECTION_ID;
      
      // Direkter API-Aufruf mit /live Endpunkt für veröffentlichte Inhalte
      const apiUrl = this.buildApiUrl(`/${memberCollectionId}/items/${webflowId}/live`);
      const workerUrl = this.buildWorkerUrl(apiUrl);
      
      try {
        const user = await this.fetchApi(workerUrl);
        
        if (!user || !user.id) {
          DEBUG.log(`Kein User gefunden mit Webflow-ID ${webflowId}`, null, 'warn');
          return null;
        }
        
        DEBUG.log(`User gefunden: ${user.id}`);
        
        // Überprüfen des video-feed Feldes
        if (user.fieldData && user.fieldData["video-feed"]) {
          DEBUG.log(`User hat video-feed Feld mit ${Array.isArray(user.fieldData["video-feed"]) ? 
            user.fieldData["video-feed"].length + " Einträgen" : 
            "Wert " + typeof user.fieldData["video-feed"]}`);
        } else {
          DEBUG.log('User hat KEIN video-feed Feld in fieldData!', null, 'warn');
          DEBUG.log('Verfügbare Felder: ' + 
            (user.fieldData ? Object.keys(user.fieldData).join(", ") : "keine fieldData"));
        }
        
        this.cache.set(cacheKey, user);
        return user;
      } catch (error) {
        DEBUG.log(`Fehler beim Abrufen des Users mit Webflow-ID ${webflowId}`, error, 'error');
        throw error;
      }
    }

    /**
     * Lädt Videos in Chunks, um die Performance zu verbessern
     * @param {Array<string>} videoIds - Array mit Video-IDs
     * @param {number} chunkSize - Größe jedes Chunks
     * @returns {Promise<Array>} - Array mit Video-Daten
     */
    async fetchVideosInChunks(videoIds, chunkSize = 20) {
      if (!videoIds || videoIds.length === 0) {
        return [];
      }
      
      const videoCollectionId = this.config.VIDEO_COLLECTION_ID;
      const videoIdSet = new Set(videoIds);
      let allVideos = [];
      
      // Videos in Chunks aufteilen für bessere Performance
      const chunks = [];
      for (let i = 0; i < videoIds.length; i += chunkSize) {
        chunks.push(videoIds.slice(i, i + chunkSize));
      }
      
      DEBUG.log(`Lade ${videoIds.length} Videos in ${chunks.length} Chunks`);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          const apiUrl = this.buildApiUrl(`/${videoCollectionId}/items`, {
            live: true,
            filter: { id: { in: chunk } }
          });
          
          const workerUrl = this.buildWorkerUrl(apiUrl);
          const data = await this.fetchApi(workerUrl);
          
          if (data.items && data.items.length > 0) {
            // Sicherstellen, dass wir nur Videos mit IDs im Set behalten und verarbeiten
            const chunkVideos = data.items
              .filter(item => videoIdSet.has(item.id))
              .map(item => this.processVideoItem(item))
              .filter(video => video && video["video-link"]);
            
            allVideos = allVideos.concat(chunkVideos);
          }
        } catch (error) {
          DEBUG.log(`Fehler beim Laden von Chunk ${i+1}`, error, 'error');
        }
      }
      
      return allVideos;
    }
    
    /**
     * Verarbeitet ein Video-Item in ein einheitliches Format
     * @param {Object} item - Das Video-Item aus der API
     * @returns {Object} - Das verarbeitete Video-Objekt
     */
    processVideoItem(item) {
      if (!item || !item.fieldData) {
        return null;
      }
      
      // Kategorie-ID extrahieren und detailliertes Logging hinzufügen
      const categoryId = item.fieldData["video-kategorie"];
      let categoryRawId = categoryId;
      
      DEBUG.log(`Verarbeite Video ${item.id} mit Kategorie-ID: "${categoryId}" (Typ: ${typeof categoryId})`);
      
      // Kategorie-Name über das Mapping holen
      let categoryName = "Nicht angegeben";
      let mappingFound = false;
      
      if (categoryId) {
        // Normalisiere die ID für den Vergleich (nur wenn es ein String ist)
        let normalizedId = typeof categoryId === 'string' ? categoryId.trim() : categoryId;
        
        // Überprüfe das Mapping
        if (this.config.CATEGORY_MAPPING && this.config.CATEGORY_MAPPING[normalizedId]) {
          categoryName = this.config.CATEGORY_MAPPING[normalizedId];
          DEBUG.log(`Kategorie-Mapping gefunden: "${normalizedId}" => "${categoryName}"`);
          mappingFound = true;
        } else {
          // Kein direktes Mapping gefunden - versuche eine fuzzy-Suche
          DEBUG.log(`⚠️ Kein direktes Kategorie-Mapping gefunden für ID: "${normalizedId}"`, null, 'warn');
          
          // Dump aller Mapping-Keys für Debug-Zwecke
          DEBUG.log('Verfügbare Kategorie-Mappings:', Object.keys(this.config.CATEGORY_MAPPING));
          
          // Versuche exakte Teilstrings zu finden (wenn die ID ein String ist)
          if (typeof normalizedId === 'string') {
            // Normalisiere alle Mapping-Keys für konsistenten Vergleich
            const normalizedMappings = {};
            for (const [key, value] of Object.entries(this.config.CATEGORY_MAPPING)) {
              normalizedMappings[key.trim()] = value;
            }
            
            // Suche nach Mapping für verschiedene Substring-Längen
            const trySubstrings = ['a1c318daa4a4fdc904d0ea6ae57e9eb6', 'a1c318daa4a4', 'a1c318da', 'a1c318'];
            for (const substring of trySubstrings) {
              if (normalizedId.includes(substring) || substring.includes(normalizedId)) {
                categoryName = this.config.CATEGORY_MAPPING[substring];
                DEBUG.log(`Gefundenes Teil-Mapping über Substring "${substring}" => "${categoryName}"`);
                mappingFound = true;
                break;
              }
            }
            
            // Wenn immer noch kein Mapping gefunden, suche nach einem Präfix-Match
            if (!mappingFound) {
              for (const [key, value] of Object.entries(this.config.CATEGORY_MAPPING)) {
                if (normalizedId.startsWith(key.substring(0, 6)) || key.startsWith(normalizedId.substring(0, 6))) {
                  categoryName = value;
                  DEBUG.log(`Fuzzy-Match gefunden für Präfix "${key.substring(0, 6)}" => "${categoryName}"`);
                  mappingFound = true;
                  break;
                }
              }
            }
          }
          
          // Fallback wenn immer noch kein Mapping gefunden wurde
          if (!mappingFound) {
            categoryName = typeof normalizedId === 'string' ? 
              "Kategorie " + normalizedId.substring(0, 6) : 
              "Unbekannte Kategorie";
            DEBUG.log(`Kein Mapping gefunden, verwende Fallback-Namen: ${categoryName}`);
          }
        }
      }
      
      // Alle relevanten Daten ausgeben für bessere Diagnosemöglichkeiten
      DEBUG.log(`Kategorie-Mapping-Ergebnis für Video ${item.id}:`, {
        originalId: categoryRawId,
        processedId: categoryId,
        mappingFound: mappingFound,
        resultName: categoryName
      });
      
      return {
        id: item.id,
        "video-link": item.fieldData["video-link"],
        "video-name": item.fieldData["video-name"] || item.fieldData["name"] || "Unbenanntes Video",
        "video-kategorie": categoryId,
        "kategorie-name": categoryName
      };
    }
    
    /**
     * Holt den Namen einer Kategorie anhand ihrer ID
     * @param {string} categoryId - Die Kategorie-ID
     * @returns {string} - Der Kategorie-Name
     */
    getCategoryName(categoryId) {
      if (!categoryId) return "Nicht angegeben";
      
      // Normalisiere die ID für den Vergleich
      const normalizedId = typeof categoryId === 'string' ? categoryId.trim() : categoryId;
      
      // Prüfe, ob die Kategorie-ID im Mapping existiert
      if (this.config.CATEGORY_MAPPING && this.config.CATEGORY_MAPPING[normalizedId]) {
        return this.config.CATEGORY_MAPPING[normalizedId];
      }
      
      // Debug-Ausgabe für problematische Kategorie-IDs
      DEBUG.log(`Keine Mapping-Kategorie gefunden für ID: ${normalizedId}`, null, 'warn');
      
      // Verschiedene Teilstrings für Travel-Kategorie ausprobieren
      const travelIds = ['a1c318daa4a4fdc904d0ea6ae57e9eb6', 'a1c318daa4a4', 'a1c318da', 'a1c318'];
      
      if (typeof normalizedId === 'string') {
        for (const travelId of travelIds) {
          if (normalizedId.includes(travelId) || travelId.includes(normalizedId)) {
            DEBUG.log(`Travel-Kategorie identifiziert über Teilübereinstimmung mit ${travelId}`);
            return "Travel";
          }
        }
      }
      
      // Fallback: Gekürzte ID zurückgeben
      return typeof normalizedId === 'string' ? 
        "Kategorie " + normalizedId.substring(0, 6) : 
        "Unbekannte Kategorie";
    }
    };

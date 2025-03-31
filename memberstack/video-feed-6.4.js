// 🌐 Webflow API Integration für Video-Feed
// Optimierte Version 3.0

/**
 * Frühe Konfigurationsinitalisierung - Wird vor DOM-Ready ausgeführt
 */
(function() {
  // Konfigurationswerte mit Defaults
  const CONFIG_DEFAULTS = {
    BASE_URL: "https://api.webflow.com/v2/collections",
    WORKER_BASE_URL: "https://bewerbungen.oliver-258.workers.dev/?url=",
    MEMBER_COLLECTION_ID: "6448faf9c5a8a15f6cc05526",
    VIDEO_COLLECTION_ID: "67d806e65cadcadf2f41e659",
    FREE_MEMBER_LIMIT: 1,
    PAID_MEMBER_LIMIT: 12,
    VIDEO_CONTAINER_ID: "video-feed",
    UPLOAD_COUNTER_ID: "uploads-counter",
    UPLOAD_PROGRESS_ID: "uploads-progress",
    UPLOAD_LIMIT_MESSAGE_ID: "upload-limit-message"
  
// App starten mit optimierter Initialisierung
document.addEventListener('DOMContentLoaded', () => {
  // Verzögerung für sichere Initialisierung nach allen DOM-Elementen
  setTimeout(() => {
    try {
      console.log("🚀 Video-Feed: Starte App...");
      const videoFeedApp = new VideoFeedApp();
      videoFeedApp.init();
      
      // Für Debug-Zwecke global zugänglich machen
      window.videoFeedApp = videoFeedApp;
    } catch (error) {
      console.error("⚠️ Video-Feed: Kritischer Fehler beim Start", error);
      
      // Versuche dennoch eine Fehlermeldung anzuzeigen
      const container = document.querySelector(".db-upload-wrapper") || 
                       document.getElementById(window.WEBFLOW_API.VIDEO_CONTAINER_ID);
      
      if (container) {
        container.innerHTML = `
          <div style="padding: 20px; text-align: center; color: red; border: 1px solid red; margin: 20px 0;">
            <p>Fehler beim Starten des Video-Feeds. Bitte lade die Seite neu.</p>
          </div>
        `;
      }
    }
  }, 100);
});
}
  
  /**
   * Videos für eingeloggten User laden und anzeigen
   */
  async loadUserVideos() {
    try {
      if (!this.videoContainer) {
        this.logger.error("Container nicht gefunden");
        return;
      }
      
      // Vermeidet doppelte Ladeanfragen
      if (this.isLoading) {
        this.logger.log("Ladevorgang bereits aktiv, ignoriere Anfrage");
        return;
      }
      
      this.isLoading = true;
      this.showLoading();
      
      // Memberstack-User laden
      const member = await window.$memberstackDom.getCurrentMember();
      this.currentMember = member;
      const memberstackId = member?.data?.id;
      
      if (!memberstackId) {
        this.showError("Kein eingeloggter User gefunden");
        this.isLoading = false;
        return;
      }
      
      this.logger.log("Eingeloggter User mit Memberstack-ID", memberstackId);
      
      // Video-Limit basierend auf Membership bestimmen
      const maxUploads = this.getMembershipLimit(member);
      this.logger.log("Maximale Uploads für User:", maxUploads);
      
      // Webflow-ID aus den Custom Fields der Memberstack-Daten extrahieren
      let webflowMemberId = this.extractWebflowId(member);
      
      if (!webflowMemberId) {
        this.showError("Keine Webflow-Member-ID in den Memberstack-Daten gefunden");
        this.logger.error("Memberstack-Daten ohne Webflow-ID:", member.data);
        this.isLoading = false;
        return;
      }
      
      // User direkt mit der Webflow-ID abrufen
      const user = await this.getUserByWebflowId(webflowMemberId);
      
      if (!user) {
        this.showError(`User mit Webflow-ID "${webflowMemberId}" nicht gefunden`);
        this.isLoading = false;
        return;
      }
      
      // Videos aus dem Video-Feed des Users holen mit optimierter Performance
      const videos = await this.getVideosFromUserFeed(user);
      this.userVideos = videos;
      
      // Upload-Counter und Fortschrittsbalken aktualisieren
      this.updateUploadCounter(videos.length, maxUploads);
      
      // Videos anzeigen
      this.renderVideos(videos);
      
      this.isLoading = false;
    } catch (error) {
      this.logger.error("Fehler beim Laden der Videos", error);
      this.showError(`Fehler beim Laden des Video-Feeds: ${error.message}`);
      this.isLoading = false;
    }
  }

  /**
   * Helper-Methode zum sicheren Extrahieren der Webflow-ID aus Memberstack-Daten
   * @param {Object} member - Das Memberstack-Objekt
   * @returns {string|null} Die Webflow-ID oder null
   */
  extractWebflowId(member) {
    if (!member || !member.data) return null;
    
    // Performance-Optimierung: Direkter Zugriff auf mögliche Pfade in einem Schritt
    const customFields = member.data.customFields || {};
    const metaData = member.data.metaData || {};
    
    // Mögliche Feldnamen für die Webflow-ID
    const possibleFields = [
      "webflow-member-id", 
      "webflow-id", 
      "webflow_id", 
      "webflowId",
      "webflow_member_id"
    ];
    
    // Erst customFields durchsuchen
    for (const field of possibleFields) {
      if (customFields[field]) {
        this.logger.log(`Webflow-Member-ID aus customFields["${field}"] gefunden:`, customFields[field]);
        return customFields[field];
      }
    }
    
    // Dann metaData durchsuchen
    for (const field of possibleFields) {
      if (metaData[field]) {
        this.logger.log(`Webflow-Member-ID aus metaData["${field}"] gefunden:`, metaData[field]);
        return metaData[field];
      }
    }
    
    this.logger.warn("Keine Webflow-ID in den bekannten Feldern gefunden");
    this.logger.log("Verfügbare Custom Fields:", Object.keys(customFields).join(", "));
    this.logger.log("Verfügbare Meta Fields:", Object.keys(metaData).join(", "));
    
    return null;
  }

  /**
   * App initialisieren mit Optimierungen und Fehlerbehandlung
   */
  init() {
    // Initialisierungsfunktion mit Fehlerbehandlung
    const initApp = () => {
      try {
        this.logger.log("Initialisiere Video-Feed-App...");
        
        // Video-Container finden
        this.videoContainer = document.getElementById(window.WEBFLOW_API.VIDEO_CONTAINER_ID);
        
        if (!this.videoContainer) {
          this.logger.warn(`Container-Element mit ID '${window.WEBFLOW_API.VIDEO_CONTAINER_ID}' nicht gefunden!`);
          
          // Fallback: Versuche den Container über Klasse zu finden
          const containerByClass = document.querySelector(".db-upload-wrapper");
          if (containerByClass) {
            this.logger.log("Container über Klasse gefunden statt über ID");
            this.videoContainer = containerByClass;
          } else {
            this.logger.error("Container konnte weder über ID noch über Klasse gefunden werden");
            return;
          }
        }
        
        this.logger.log("Container erfolgreich gefunden");
        
        // UI-Elemente initialisieren für Upload-Status
        this.uploadCounter = document.getElementById(window.WEBFLOW_API.UPLOAD_COUNTER_ID);
        if (!this.uploadCounter) {
          this.logger.warn(`Upload-Counter (${window.WEBFLOW_API.UPLOAD_COUNTER_ID}) nicht gefunden`);
        }
        
        this.uploadProgress = document.getElementById(window.WEBFLOW_API.UPLOAD_PROGRESS_ID);
        if (!this.uploadProgress) {
          this.logger.warn(`Upload-Progress (${window.WEBFLOW_API.UPLOAD_PROGRESS_ID}) nicht gefunden`);
        }
        
        this.limitMessageEl = document.getElementById(window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID);
        if (!this.limitMessageEl) {
          this.logger.warn(`Limit-Message (${window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID}) nicht gefunden`);
        }
        
        // Event-Listener für Video-Feed-Updates
        document.addEventListener('videoFeedUpdate', () => {
          this.logger.log("Update-Event empfangen, lade Feed neu");
          
          // Cache löschen und Daten neu laden
          this.cache.clear();
          this.loadUserVideos();
        });
        
        // Videos laden mit Fehlerbehandlung
        this.loadUserVideos().catch(error => {
          this.logger.error("Kritischer Fehler beim Laden der Videos", error);
          this.showError("Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu.");
        });
      } catch (error) {
        this.logger.error("Kritischer Initialisierungsfehler", error);
        
        // Versuche dennoch, den Container zu finden und eine Fehlermeldung anzuzeigen
        const container = document.querySelector(".db-upload-wrapper") || 
                         document.getElementById(window.WEBFLOW_API.VIDEO_CONTAINER_ID);
        
        if (container) {
          container.innerHTML = `
            <div class="error-message" style="padding: 20px; text-align: center; color: red;">
              <p>Fehler beim Initialisieren des Video-Feeds. Bitte lade die Seite neu.</p>
            </div>
          `;
        }
      }
    };
    
    // Prüfen, ob das DOM bereits geladen ist
    if (document.readyState === "loading") {
      // Wenn noch nicht geladen, warten auf DOMContentLoaded
      document.addEventListener("DOMContentLoaded", initApp);
    } else {
      // Wenn DOM bereits geladen ist, sofort initialisieren
      initApp();
    }
  }
};
  
  // Globale Konfiguration initialisieren
  window.WEBFLOW_API = window.WEBFLOW_API || {};
  
  // Konfigurationswerte mit Defaults füllen
  Object.entries(CONFIG_DEFAULTS).forEach(([key, value]) => {
    if (!window.WEBFLOW_API[key]) {
      window.WEBFLOW_API[key] = value;
    }
  });
  
  // Kategorie-Mapping mit Defaults initialisieren
  if (!window.WEBFLOW_API.CATEGORY_MAPPING) {
    window.WEBFLOW_API.CATEGORY_MAPPING = {
      "a1c318daa4a4fdc904d0ea6ae57e9eb6": "Travel",
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
  }
  
  // Debug-Info nur in Entwicklungsumgebung
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.search.includes("debug=true")) {
    console.log("🔧 Video-Feed: WEBFLOW_API Konfiguration geladen:", window.WEBFLOW_API);
  }
})();

/**
 * Performance-optimierter Cache mit variabler TTL
 */
class AdvancedCache {
  constructor() {
    this.items = {};
    this.defaultExpiration = 5 * 60 * 1000; // 5 Minuten Standard-Cache-Zeit
    
    // Intervall für automatische Cache-Bereinigung (alle 30 Sekunden)
    setInterval(() => this.cleanup(), 30000);
  }

  get(key) {
    const item = this.items[key];
    if (!item) return null;
    
    // Prüfen ob abgelaufen
    if (Date.now() - item.timestamp > item.expiration) { 
      delete this.items[key];
      return null;
    }
    
    return item.data;
  }

  set(key, data, customExpiration = null) {
    this.items[key] = {
      timestamp: Date.now(),
      data: data,
      expiration: customExpiration || this.defaultExpiration
    };
  }
  
  // Automatische Bereinigung abgelaufener Einträge
  cleanup() {
    const now = Date.now();
    Object.keys(this.items).forEach(key => {
      const item = this.items[key];
      if (now - item.timestamp > item.expiration) {
        delete this.items[key];
      }
    });
  }

  clear() {
    this.items = {};
  }
}

/**
 * Verbesserte Kategorie-Verwaltung mit Fallback-Mechanismus
 */
class CategoryManager {
  constructor(mapping) {
    this.mapping = mapping || {};
  }
  
  getName(categoryId) {
    if (!categoryId) return "Nicht angegeben";
    
    // Prüfe, ob die Kategorie-ID im Mapping existiert
    if (this.mapping[categoryId]) {
      return this.mapping[categoryId];
    }
    
    // Fallback: Gib die ID zurück, wenn kein Mapping gefunden wurde
    return "Kategorie " + categoryId.substring(0, 6);
  }
}

/**
 * Optimierte Logger-Klasse für bessere Debugging-Erfahrung
 */
class Logger {
  constructor(prefix = "📋 Video-Feed:", debugMode = false) {
    this.prefix = prefix;
    this.debugMode = debugMode || 
                     location.hostname === "localhost" || 
                     location.hostname === "127.0.0.1" ||
                     location.search.includes("debug=true");
  }
  
  log(...args) {
    if (this.debugMode) {
      console.log(this.prefix, ...args);
    }
  }
  
  warn(...args) {
    console.warn(this.prefix, ...args);
  }
  
  error(...args) {
    console.error(this.prefix, ...args);
  }
  
  group(label) {
    if (this.debugMode) {
      console.group(`${this.prefix} ${label}`);
    }
  }
  
  groupEnd() {
    if (this.debugMode) {
      console.groupEnd();
    }
  }
}

/**
 * Haupt-App-Klasse für den Video-Feed
 */
class VideoFeedApp {
  constructor() {
    // Verbesserte Komponenten und Hilfswerkzeuge
    this.logger = new Logger();
    this.cache = new AdvancedCache();
    this.categoryManager = new CategoryManager(window.WEBFLOW_API.CATEGORY_MAPPING);
    
    // DOM-Elemente
    this.videoContainer = null;
    this.uploadCounter = null;
    this.uploadProgress = null;
    this.limitMessageEl = null;
    
    // Zustandsspeicherung
    this.currentMember = null;
    this.userVideos = [];
    this.isLoading = false;
    
    // API-Optionen
    this.retryOptions = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000
    };
    
    // Verbesserte Performance für große Video-Listen
    this.chunkSize = 25; // Videos pro Batch
  }

  /**
   * Worker-URL erstellen für Cross-Origin-Anfragen
   * @param {string} apiUrl - Die ursprüngliche API-URL
   * @returns {string} Die Worker-URL für den Proxy
   */
  buildWorkerUrl(apiUrl) {
    return `${window.WEBFLOW_API.WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
  }

  /**
   * Einen vollständigen API-Endpunkt erstellen
   * @param {string} path - Der API-Pfad
   * @param {Object} params - Query-Parameter
   * @returns {string} Die vollständige API-URL
   */
  buildApiUrl(path, params = {}) {
    const baseUrl = window.WEBFLOW_API.BASE_URL;
    const fullUrl = `${baseUrl}${path}`;
    
    this.logger.log("API-URL vor Parametern:", fullUrl);
    
    // Parameter als Query-String hinzufügen, wenn vorhanden
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'object') {
        queryParams.append(key, encodeURIComponent(JSON.stringify(value)));
      } else {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `${fullUrl}?${queryString}` : fullUrl;
  }

  /**
   * API-Anfrage mit exponentieller Backoff-Strategie 
   * @param {string} url - Die API-URL
   * @param {number} retries - Anzahl der Versuche (optional)
   * @returns {Promise<Object>} Die API-Antwort
   */
  async fetchApi(url, retries = this.retryOptions.maxRetries) {
    let attempt = 1;
    
    while (true) {
      try {
        this.logger.log(`API-Anfrage (Versuch ${attempt}/${retries + 1}) an ${url}`);
        
        // Verbesserte Timeout-Behandlung
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 Sekunden Timeout
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(`API-Fehler ${response.status}:`, errorText);
          
          if (attempt <= retries) {
            // Exponentieller Backoff mit Jitter für bessere Verteilung
            const baseDelay = Math.min(
              this.retryOptions.initialDelay * Math.pow(1.5, attempt - 1),
              this.retryOptions.maxDelay
            );
            const jitter = Math.random() * 0.3 * baseDelay; // 30% Jitter
            const delay = baseDelay + jitter;
            
            this.logger.log(`Wiederhole in ${Math.floor(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
            continue;
          }
          
          throw new Error(`API-Fehler: ${response.status} - ${errorText.substring(0, 100)}`);
        }
        
        return await response.json();
      } catch (error) {
        if (error.name === 'AbortError') {
          this.logger.error("Anfrage-Timeout erreicht");
          
          if (attempt <= retries) {
            const delay = this.retryOptions.initialDelay * Math.pow(2, attempt - 1);
            this.logger.log(`Timeout, wiederhole in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
            continue;
          }
        } else if (attempt <= retries) {
          const delay = this.retryOptions.initialDelay * Math.pow(2, attempt - 1);
          this.logger.log(`Fehler, wiederhole in ${delay}ms...`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        
        this.logger.error("Maximale Anzahl an Versuchen erreicht", error);
        throw error;
      }
    }
  }

  /**
   * User direkt anhand der Webflow-ID abrufen
   * @param {string} webflowId - Die Webflow-ID des Users
   * @returns {Promise<Object>} Das User-Objekt
   */
  async getUserByWebflowId(webflowId) {
    if (!webflowId) {
      throw new Error("Webflow-ID fehlt");
    }
    
    this.logger.log("Rufe User mit Webflow-ID ab:", webflowId);
    
    const cacheKey = `webflow_user_${webflowId}`;
    const cachedUser = this.cache.get(cacheKey);
    
    if (cachedUser) {
      this.logger.log("User aus Cache geladen", webflowId);
      return cachedUser;
    }
    
    const memberCollectionId = window.WEBFLOW_API.MEMBER_COLLECTION_ID;
    
    this.logger.log("Verwende Member-Collection-ID:", memberCollectionId);
    
    // Direkter API-Aufruf mit der ID und /live Endpunkt für veröffentlichte Inhalte
    const apiUrl = this.buildApiUrl(`/${memberCollectionId}/items/${webflowId}/live`);
    const workerUrl = this.buildWorkerUrl(apiUrl);
    
    try {
      const user = await this.fetchApi(workerUrl);
      
      if (!user || !user.id) {
        this.logger.warn("Kein User gefunden mit Webflow-ID", webflowId);
        return null;
      }
      
      this.logger.log("User gefunden in Member-Collection:", user.id);
      
      // Zusätzliches Logging zur Überprüfung der fieldData und des video-feed Feldes
      if (user.fieldData && user.fieldData["video-feed"]) {
        this.logger.log("User hat video-feed Feld mit", 
          Array.isArray(user.fieldData["video-feed"]) ? 
          user.fieldData["video-feed"].length + " Einträgen" : 
          "Wert " + typeof user.fieldData["video-feed"]
        );
      } else {
        this.logger.warn("User hat KEIN video-feed Feld in fieldData!");
        this.logger.log("Verfügbare Felder:", 
          user.fieldData ? Object.keys(user.fieldData).join(", ") : "keine fieldData"
        );
      }
      
      // Im Cache für 2 Minuten speichern (kürzere Zeit, da User-Daten sich ändern können)
      this.cache.set(cacheKey, user, 2 * 60 * 1000);
      return user;
    } catch (error) {
      this.logger.error("Fehler beim Abrufen des Users mit Webflow-ID", error);
      throw error;
    }
  }

  /**
   * Holt die Videos in Chunks aus der Video-Collection
   * @param {Array} videoIds - Array von Video-IDs
   * @returns {Promise<Array>} Die Video-Objekte
   */
  async fetchVideosInChunks(videoIds) {
    if (!videoIds || !videoIds.length) {
      return [];
    }
    
    this.logger.log(`Starte Abruf von ${videoIds.length} Videos in Chunks`);
    
    // Chunks erstellen für bessere Performance
    const chunks = [];
    for (let i = 0; i < videoIds.length; i += this.chunkSize) {
      chunks.push(videoIds.slice(i, i + this.chunkSize));
    }
    
    this.logger.log(`Verarbeite ${chunks.length} Chunks mit je max. ${this.chunkSize} Videos`);
    
    const videoCollectionId = window.WEBFLOW_API.VIDEO_COLLECTION_ID;
    const videoIdSet = new Set(videoIds); // Set für schnelle Lookup-Performance
    let allVideos = [];
    
    // Chunks sequentiell verarbeiten
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      this.logger.log(`Verarbeite Chunk ${i+1}/${chunks.length} mit ${chunk.length} Videos`);
      
      const apiUrl = this.buildApiUrl(`/${videoCollectionId}/items`, {
        live: true,
        filter: { id: { in: chunk } }
      });
      
      const workerUrl = this.buildWorkerUrl(apiUrl);
      
      try {
        const data = await this.fetchApi(workerUrl);
        
        if (data.items && data.items.length > 0) {
          // Videos filtern und transformieren
          const chunkVideos = data.items
            .filter(item => videoIdSet.has(item.id))
            .map(item => this.processVideoItem(item))
            .filter(video => video["video-link"]); // Nur Videos mit Link behalten
          
          allVideos = allVideos.concat(chunkVideos);
          this.logger.log(`Chunk ${i+1} verarbeitet, bisher ${allVideos.length} Videos geladen`);
        }
      } catch (error) {
        this.logger.error(`Fehler beim Laden von Chunk ${i+1}`, error);
        // Fehler bei einzelnem Chunk sollte nicht den gesamten Prozess abbrechen
      }
    }
    
    this.logger.log(`Gesamtprozess abgeschlossen, ${allVideos.length} Videos geladen`);
    return allVideos;
  }
  
  /**
   * Transformiert ein Video-Item in ein einheitliches Format
   * @param {Object} item - Das Video-Item aus der API
   * @returns {Object} Das transformierte Video-Objekt
   */
  processVideoItem(item) {
    if (!item || !item.fieldData) {
      return null;
    }
    
    const videoData = {
      id: item.id
    };
    
    // Sicher Felder abfragen mit Fallbacks
    if (item.fieldData) {
      videoData["video-link"] = item.fieldData["video-link"];
      videoData["video-name"] = item.fieldData["video-name"] || 
                                item.fieldData["name"] || 
                                "Unbenanntes Video";
      videoData["video-kategorie"] = item.fieldData["video-kategorie"];
      
      // Kategorie-Namen für Anzeige speichern
      videoData["kategorie-name"] = this.categoryManager.getName(item.fieldData["video-kategorie"]);
    }
    
    return videoData;
  }

  /**
   * Holt die Videos aus dem Video-Feed des Users mit optimierter Leistung
   * @param {Object} user - Das User-Objekt
   * @returns {Promise<Array>} Die Video-Objekte
   */
  async getVideosFromUserFeed(user) {
    if (!user || !user.fieldData) {
      this.logger.log("Keine fieldData im User-Profil gefunden");
      return [];
    }
    
    // Vorsichtiger Zugriff auf das video-feed Feld
    if (!user.fieldData["video-feed"]) {
      this.logger.log("Keine Video-Referenzen im User-Profil gefunden");
      this.logger.log("Verfügbare Felder:", Object.keys(user.fieldData).join(", "));
      return [];
    }
    
    // Das video-feed Feld enthält die IDs der Videos im User-Profil
    const videoFeed = user.fieldData["video-feed"];
    
    // Debug-Info zu video-feed
    this.logger.log("Video-Feed-Typ:", Array.isArray(videoFeed) ? "Array" : typeof videoFeed);
    this.logger.log("Video-Feed-Länge:", Array.isArray(videoFeed) ? videoFeed.length : "N/A");
    
    if (!videoFeed || !Array.isArray(videoFeed) || videoFeed.length === 0) {
      this.logger.log("Leerer Video-Feed im User-Profil");
      return [];
    }
    
    this.logger.log(`${videoFeed.length} Video-IDs im User-Feed gefunden`);
    
    // Caching für bessere Performance
    const cacheKey = `videos_${user.id}`;
    const cachedVideos = this.cache.get(cacheKey);
    
    if (cachedVideos) {
      this.logger.log(`${cachedVideos.length} Videos aus Cache geladen`);
      return cachedVideos;
    }
    
    // Videos in Chunks laden für bessere Performance
    let videos = [];
    
    try {
      this.logger.group("Video-Laden-Prozess");
      // Optimierte Methode zum Laden der Videos in Chunks
      videos = await this.fetchVideosInChunks(videoFeed);
      this.logger.groupEnd();
      
      // Im Cache speichern mit 1 Minute TTL (kurze Zeit, da sich Videos ändern können)
      this.cache.set(cacheKey, videos, 60 * 1000);
      
    } catch (error) {
      this.logger.error("Fehler beim Laden der Videos", error);
    }
    
    return videos;
  }

  /**
   * Bestimmt das Video-Limit basierend auf dem Mitgliedsstatus
   * @param {Object} member - Das Mitgliedschafts-Objekt
   * @returns {number} Das Limit für Uploads
   */
  getMembershipLimit(member) {
    if (!member || !member.data) {
      this.logger.log("Kein Member-Objekt, verwende FREE_MEMBER_LIMIT");
      return window.WEBFLOW_API.FREE_MEMBER_LIMIT;
    }
    
    // Prüfen ob Paid-Member anhand der planConnections
    let isPaid = false;
    
    // Option 1: Prüfen auf planConnections Array
    if (member.data.planConnections && member.data.planConnections.length > 0) {
      for (const connection of member.data.planConnections) {
        if (connection.status === "ACTIVE" && connection.type !== "FREE") {
          isPaid = true;
          this.logger.log("Paid-Member erkannt über planConnections");
          break;
        }
      }
    }
    
    // Option 2: Fallback auf ältere Memberstack-Version
    if (!isPaid && member.data.acl && (
        member.data.acl.includes("paid") || 
        member.data.status === "paid"
      )) {
      isPaid = true;
      this.logger.log("Paid-Member erkannt über acl/status");
    }
    
    const limit = isPaid ? 
                  window.WEBFLOW_API.PAID_MEMBER_LIMIT : 
                  window.WEBFLOW_API.FREE_MEMBER_LIMIT;
    
    this.logger.log(`Mitglied (${isPaid ? 'PAID' : 'FREE'}) erhält Limit:`, limit);
    
    return limit;
  }

  /**
   * Aktualisiert den Upload-Counter und den Fortschrittsbalken auf der Seite
   * @param {number} videoCount - Anzahl der Videos
   * @param {number} maxUploads - Maximale Anzahl an Uploads
   */
  updateUploadCounter(videoCount, maxUploads) {
    // Upload-Counter Element finden, falls es noch nicht vorhanden ist
    if (!this.uploadCounter) {
      this.uploadCounter = document.getElementById(window.WEBFLOW_API.UPLOAD_COUNTER_ID);
      if (!this.uploadCounter) {
        this.logger.warn(`Kein Upload-Counter-Element mit ID '${window.WEBFLOW_API.UPLOAD_COUNTER_ID}' gefunden`);
      }
    }
    
    // Fortschrittsbalken-Element finden, falls es noch nicht vorhanden ist
    if (!this.uploadProgress) {
      this.uploadProgress = document.getElementById(window.WEBFLOW_API.UPLOAD_PROGRESS_ID);
      if (!this.uploadProgress) {
        this.logger.warn(`Kein Fortschrittsbalken-Element mit ID '${window.WEBFLOW_API.UPLOAD_PROGRESS_ID}' gefunden`);
      }
    }
    
    // Upload-Limit-Nachrichten-Element finden, falls es noch nicht vorhanden ist
    if (!this.limitMessageEl) {
      this.limitMessageEl = document.getElementById(window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID);
      if (!this.limitMessageEl) {
        this.logger.warn(`Kein Limit-Nachrichten-Element mit ID '${window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID}' gefunden`);
      }
    }
    
    // Stelle sicher, dass die Zahlen für die Anzeige gültig sind
    const validVideoCount = isNaN(videoCount) ? 0 : videoCount;
    const validMaxUploads = isNaN(maxUploads) ? window.WEBFLOW_API.PAID_MEMBER_LIMIT : maxUploads;
    
    // Upload-Counter aktualisieren, wenn vorhanden
    if (this.uploadCounter) {
      this.uploadCounter.textContent = `${validVideoCount}/${validMaxUploads}`;
    }
    
    // Fortschrittsbalken aktualisieren, wenn vorhanden
    if (this.uploadProgress) {
      // Prozentsatz berechnen mit Sicherheitscheck
      const progressPercent = validMaxUploads > 0 ? 
                             Math.min((validVideoCount / validMaxUploads) * 100, 100) : 0;
      
      // Farbklassen basierend auf Fortschritt
      this.uploadProgress.classList.remove("progress-low", "progress-medium", "progress-high", "progress-full");
      
      if (progressPercent >= 100) {
        this.uploadProgress.classList.add("progress-full");
      } else if (progressPercent >= 70) {
        this.uploadProgress.classList.add("progress-high");
      } else if (progressPercent >= 40) {
        this.uploadProgress.classList.add("progress-medium");
      } else {
        this.uploadProgress.classList.add("progress-low");
      }
      
      // Breite aktualisieren - Animation durch CSS
      this.uploadProgress.style.width = `${progressPercent}%`;
    }
    
    // Prüfen, ob das Limit erreicht ist
    const isLimitReached = validVideoCount >= validMaxUploads;
    
    // Logging, um den Zustand besser zu verstehen
    this.logger.log(`Upload-Status: ${validVideoCount}/${validMaxUploads}, Limit erreicht: ${isLimitReached}`);
    
    // Upload-Button je nach Limit-Status ein/ausblenden
    this.updateUploadButton(isLimitReached);
    
    // Upload-Limit-Meldung aktualisieren
    this.updateLimitMessage(isLimitReached);
  }
  
  /**
   * Upload-Button je nach Limit-Status ein/ausblenden
   * @param {boolean} isLimitReached - Gibt an, ob das Limit erreicht ist
   */
  updateUploadButton(isLimitReached) {
    // Alle Elemente mit data-modal-toggle="new-upload" finden (Upload-Buttons)
    const uploadButtons = document.querySelectorAll('[data-modal-toggle="new-upload"]');
    
    if (uploadButtons.length > 0) {
      uploadButtons.forEach(button => {
        if (isLimitReached) {
          button.style.display = "none";
          this.logger.log("Upload-Limit erreicht, Button ausgeblendet");
        } else {
          button.style.display = "";
        }
      });
    } else {
      this.logger.warn("Keine Upload-Buttons gefunden");
    }
  }
  
  /**
   * Upload-Limit-Meldung anzeigen oder ausblenden
   * @param {boolean} isLimitReached - Gibt an, ob das Limit erreicht ist
   */
  updateLimitMessage(isLimitReached) {
    // Element mit der konfigurierten ID suchen falls noch nicht gefunden
    if (!this.limitMessageEl) {
      this.limitMessageEl = document.getElementById(window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID);
      
      if (!this.limitMessageEl) {
        this.logger.warn(`Kein Limit-Meldungs-Element mit ID '${window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID}' gefunden`);
        return;
      }
    }
    
    if (isLimitReached) {
      // Meldung anzeigen
      this.limitMessageEl.style.display = "block";
      this.limitMessageEl.textContent = "Upload-Limit erreicht";
      this.limitMessageEl.classList.add("limit-reached");
      this.logger.log("Limit-Meldung wird angezeigt");
    } else {
      // Meldung ausblenden
      this.limitMessageEl.style.display = "none";
      this.limitMessageEl.classList.remove("limit-reached");
      this.logger.log("Limit-Meldung wird ausgeblendet");
    }
  }

  /**
   * Erstellt einen "Erstes Video hochladen" Button, falls keine Videos vorhanden sind
   */
  createUploadButton() {
    if (!this.videoContainer) return;
    
    // DocumentFragment für bessere Performance
    const fragment = document.createDocumentFragment();
    
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("db-upload-empty-state");
    
    // Normaler Upload-Button mit den gewünschten Attributen
    const uploadButton = document.createElement("a");
    uploadButton.href = "#"; 
    uploadButton.classList.add("db-upload-more-upload-button");
    uploadButton.setAttribute("data-modal-toggle", "new-upload");
    uploadButton.textContent = "Lade dein erstes Video hoch";
    
    buttonContainer.appendChild(uploadButton);
    fragment.appendChild(buttonContainer);
    
    // Effizientes DOM-Update
    this.videoContainer.appendChild(fragment);
  }

  /**
   * Videos im Container anzeigen mit optimierter Rendering-Performance
   * @param {Array} videos - Die Video-Objekte
   */
  renderVideos(videos) {
    if (!this.videoContainer) {
      this.logger.error("Container nicht gefunden");
      return;
    }
    
    // Container leeren
    this.videoContainer.innerHTML = "";
    
    // Prüfen, ob das Limit erreicht ist
    const maxUploads = this.getMembershipLimit(this.currentMember);
    const isLimitReached = videos && videos.length >= maxUploads;
    
    if (isLimitReached) {
      this.logger.log("Upload-Limit erreicht", videos.length, "/", maxUploads);
      
      // Upload-Button aus dem DOM entfernen, wenn das Limit erreicht ist
      const uploadButtons = document.querySelectorAll('[data-modal-toggle="new-upload"]');
      uploadButtons.forEach(button => {
        button.style.display = "none";
      });
    }
    
    if (!videos || videos.length === 0) {
      // Statt Fehlermeldung den Upload-Button anzeigen
      this.createUploadButton();
      return;
    }
    
    // DocumentFragment für bessere Performance
    const fragment = document.createDocumentFragment();
    
    // Videos rendern
    videos.forEach(videoData => {
      if (!videoData || !videoData["video-link"]) return;
      
      const wrapperDiv = document.createElement("div");
      wrapperDiv.classList.add("db-upload-wrapper-item");
      
      const videoDiv = document.createElement("div");
      videoDiv.classList.add("db-upload-item-video");
      
      const videoElement = document.createElement("video");
      videoElement.src = videoData["video-link"];
      videoElement.controls = true;
      videoElement.classList.add("db-upload-video");
      videoElement.loading = "lazy"; // Lazy loading für bessere Performance
      videoElement.preload = "metadata"; // Nur Metadaten vorladen
      
      // Fehlerbehandlung für Videos
      videoElement.addEventListener("error", () => {
        videoDiv.innerHTML = `
          <div class="video-error">
            <p>Video konnte nicht geladen werden</p>
          </div>
        `;
      });
      
      videoDiv.appendChild(videoElement);
      
      const detailsDiv = document.createElement("div");
      detailsDiv.classList.add("db-upload-item-details");
      
      // Container für Titel und Kategorie
      const detailsContainerDiv = document.createElement("div");
      detailsContainerDiv.classList.add("db-upload-details-container");
      
      // Titel
      const titleDiv = document.createElement("div");
      titleDiv.classList.add("db-upload-video-title");
      titleDiv.textContent = videoData["video-name"] || "Unbenanntes Video";
      
      // Kategorie mit verbessertem Mapping
      const categoryName = videoData["kategorie-name"] || this.categoryManager.getName(videoData["video-kategorie"]);
      const categoryP = document.createElement("p");
      categoryP.classList.add("is-txt-tiny");
      categoryP.textContent = `Kategorie: ${categoryName}`;
      
      // Edit-Button erstellen
      const editButton = document.createElement("button");
      editButton.classList.add("db-upload-settings");
      
      // Videodata-ID als Attribut setzen
      const videoId = videoData.id;
      
      editButton.setAttribute("data-video-edit", videoId);
      editButton.innerHTML = `<img src="https://cdn.prod.website-files.com/63db7d558cd2e4be56cd7e2f/678a26c04581673826145b8b_settings.svg" alt="Bearbeiten">`;
      editButton.title = "Video bearbeiten";
      
      // Event-Handler für Edit-Button mit Event-Delegation
      editButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Option 1: Wenn die editVideo-Funktion im globalen Scope ist
        if (typeof window.editVideo === "function") {
          window.editVideo(videoId);
        } 
        // Option 2: Manuell ein Event auslösen, das vom Edit-Script abgefangen werden kann
        else {
          this.logger.log("Löse Edit-Event aus für Video ID:", videoId);
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
    this.videoContainer.appendChild(fragment);
    
    // Button für neue Videos hinzufügen, wenn Limit nicht erreicht
    if (!isLimitReached && videos && videos.length > 0) {
      const addButtonContainer = document.createElement("div");
      addButtonContainer.classList.add("db-upload-add-new");
      
      const addButton = document.createElement("a");
      addButton.href = "#";
      addButton.classList.add("db-upload-more-upload-button");
      addButton.setAttribute("data-modal-toggle", "new-upload");
      addButton.textContent = "Video hinzufügen";
      
      addButtonContainer.appendChild(addButton);
      this.videoContainer.appendChild(addButtonContainer);
    }
  }

  /**
   * Verbesserte Ladeanimation mit Skeleton Loader
   */
  showLoading() {
    if (!this.videoContainer) return;
    
    // Container leeren
    this.videoContainer.innerHTML = '';
    
    // DocumentFragment für bessere Performance
    const fragment = document.createDocumentFragment();
    
    // Erstelle 3 Skeleton-Items mit modernerem Design
    for (let i = 0; i < 3; i++) {
      const skeleton = document.createElement('div');
      skeleton.classList.add('db-upload-wrapper-item', 'skeleton-item');
      
      // Verbesserte Animation mit moderner CSS für flüssigere Darstellung
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
    this.videoContainer.appendChild(fragment);
    
    // CSS für die Animation ins DOM einfügen, falls noch nicht vorhanden
    if (!document.getElementById('skeleton-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'skeleton-styles';
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
  }
  
  /**
   * Fehlermeldung anzeigen mit verbesserter UI
   * @param {string} message - Die Fehlermeldung
   */
  showError(message) {
    if (!this.videoContainer) return;
    
    this.videoContainer.innerHTML = `
      <div class="error-message">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="error-icon">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>${message}</p>
        <button class="retry-button">Erneut versuchen</button>
      </div>
    `;
    
    // Event-Listener für den Retry-Button
    const retryButton = this.videoContainer.querySelector('.retry-button');
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        this.loadUserVideos();
      });
    }
    
    // CSS für die Fehlermeldung hinzufügen, falls nicht vorhanden
    if (!document.getElementById('error-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'error-styles';
      styleElement.textContent = `
        .error-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px;
          text-align: center;
          background-color: #fff5f5;
          border-radius: 8px;
          border: 1px solid #ffcccc;
          margin: 20px 0;
        }
        .error-icon {
          color: #e53e3e;
          margin-bottom: 15px;
        }
        .retry-button {
          margin-top: 15px;
          padding: 8px 16px;
          background-color: #4a5568;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        .retry-button:hover {
          background-color: #2d3748;
        }
      `;
      document.head.appendChild(styleElement);
    }
  }

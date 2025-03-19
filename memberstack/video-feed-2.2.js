// 🌐 Webflow API Integration für Video-Feed
// Optimierte Version für Skalierbarkeit und Wartbarkeit

/**
 * @fileoverview Video-Feed-Script für Webflow mit optimierter Architektur
 * @version 1.0.0
 * @author Senior JavaScript Developer
 */

/**
 * @typedef {Object} VideoData
 * @property {string} video-link - URL zum Video
 * @property {string} video-name - Name des Videos
 * @property {string} video-kategorie - Kategorie des Videos
 */

// 🐞 Debug-Logger
class Logger {
  constructor(prefix = '📋 VideoFeed') {
    this.prefix = prefix;
    this.isDebugEnabled = false;
    
    // Überprüfen, ob Debug-Modus aktiviert werden soll (URL-Parameter oder localStorage)
    this.isDebugEnabled = 
      window.location.search.includes('debug=true') || 
      localStorage.getItem('videoFeedDebug') === 'true';
    
    // Debug-Modus im localStorage speichern
    if (window.location.search.includes('debug=true') && !localStorage.getItem('videoFeedDebug')) {
      localStorage.setItem('videoFeedDebug', 'true');
    }
    
    if (this.isDebugEnabled) {
      console.log(`${this.prefix} 🐞 Debug-Modus aktiviert`);
    }
  }

  /**
   * Gibt eine Info-Nachricht aus
   * @param {...any} args - Zu loggenden Argumente
   */
  info(...args) {
    console.log(`${this.prefix} ℹ️`, ...args);
  }

  /**
   * Gibt eine Erfolgsmeldung aus
   * @param {...any} args - Zu loggenden Argumente
   */
  success(...args) {
    console.log(`${this.prefix} ✅`, ...args);
  }

  /**
   * Gibt eine Warnmeldung aus
   * @param {...any} args - Zu loggenden Argumente
   */
  warn(...args) {
    console.warn(`${this.prefix} ⚠️`, ...args);
  }

  /**
   * Gibt eine Fehlermeldung aus
   * @param {...any} args - Zu loggenden Argumente
   */
  error(...args) {
    console.error(`${this.prefix} 🔴`, ...args);
  }

  /**
   * Gibt Debug-Informationen aus (nur wenn Debug-Modus aktiviert)
   * @param {...any} args - Zu loggenden Argumente
   */
  debug(...args) {
    if (this.isDebugEnabled) {
      console.log(`${this.prefix} 🐞`, ...args);
    }
  }

  /**
   * Zeichnet die Ausführungszeit einer Funktion auf
   * @param {Function} fn - Auszuführende Funktion
   * @param {string} label - Label für die Zeitaufzeichnung
   * @returns {Promise<any>} Ergebnis der Funktion
   */
  async time(fn, label) {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.debug(`${label} abgeschlossen in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.error(`${label} fehlgeschlagen nach ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Aktiviert oder deaktiviert den Debug-Modus
   * @param {boolean} enabled - Ob der Debug-Modus aktiviert werden soll
   */
  setDebugEnabled(enabled) {
    this.isDebugEnabled = enabled;
    localStorage.setItem('videoFeedDebug', enabled ? 'true' : 'false');
    console.log(`${this.prefix} Debug-Modus ${enabled ? 'aktiviert' : 'deaktiviert'}`);
  }
}

// 🔧 Konfiguration - Spezifisch für Video-Feed
const WEBFLOW_VIDEO_FEED_CONFIG = {
  API_BASE_URL: "https://api.webflow.com/v2/collections",
  WORKER_BASE_URL: "https://bewerbungen.oliver-258.workers.dev/?url=",
  MEMBER_COLLECTION_ID: "6448faf9c5a8a15f6cc05526", // Neue Member-Collection ID
  VIDEO_COLLECTION_ID: "67d806e65cadcadf2f41e659",   // Bisherige User-Collection ID
  DOM_ELEMENTS: {
    VIDEO_CONTAINER: "video-feed"
  },
  CACHE_DURATION: 5 * 60 * 1000, // 5 Minuten Cache-Dauer
};

// 🧠 Cache-System
class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Speichert Daten im Cache
   * @param {string} key - Cache-Schlüssel
   * @param {any} data - Zu speichernde Daten
   */
  set(key, data) {
    this.cache.set(key, {
      timestamp: Date.now(),
      data
    });
  }

  /**
   * Holt Daten aus dem Cache, wenn sie noch gültig sind
   * @param {string} key - Cache-Schlüssel
   * @returns {any|null} Daten oder null wenn nicht im Cache oder abgelaufen
   */
  get(key) {
    const cachedItem = this.cache.get(key);
    if (!cachedItem) return null;

    const isExpired = Date.now() - cachedItem.timestamp > WEBFLOW_VIDEO_FEED_CONFIG.CACHE_DURATION;
    return isExpired ? null : cachedItem.data;
  }

  /**
   * Löscht einen Eintrag aus dem Cache
   * @param {string} key - Cache-Schlüssel 
   */
  invalidate(key) {
    this.cache.delete(key);
  }
}

// 📡 API Service
class WebflowApiService {
  constructor() {
    this.cache = new CacheManager();
    this.logger = new Logger('📡 WebflowAPI');
  }

  /**
   * Erstellt eine Worker-URL für Cross-Origin-Anfragen
   * @param {string} apiUrl - Original API-URL
   * @returns {string} Worker-URL
   */
  buildWorkerUrl(apiUrl) {
    return `${WEBFLOW_VIDEO_FEED_CONFIG.WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
  }

  /**
   * Führt eine API-Anfrage aus mit Retry-Logik
   * @param {string} url - API-URL
   * @param {number} retries - Anzahl der Wiederholungsversuche
   * @returns {Promise<Object>} API-Antwort als JSON
   */
  async fetchWithRetry(url, retries = 2) {
    this.logger.debug(`Fetch-Anfrage an: ${url}`);
    const startTime = performance.now();
    
    try {
      const response = await fetch(url);
      const duration = performance.now() - startTime;
      this.logger.debug(`Antwort erhalten in ${duration.toFixed(2)}ms, Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`API-Fehler: ${response.status}`, errorText);
        
        if (retries > 0 && [429, 500, 502, 503, 504].includes(response.status)) {
          this.logger.warn(`Wiederhole Anfrage... (${retries} verbleibend)`);
          // Exponentielles Backoff
          const delay = 1000 * Math.pow(2, 3 - retries);
          this.logger.debug(`Warte ${delay}ms vor dem nächsten Versuch`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchWithRetry(url, retries - 1);
        }
        
        throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
      }
      
      const jsonData = await response.json();
      this.logger.debug(`Daten erfolgreich geparst`, {
        items: jsonData.items?.length || 0,
        total: jsonData.total || 0
      });
      
      return jsonData;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error(`Fehler nach ${duration.toFixed(2)}ms:`, error.message);
      
      if (retries > 0) {
        this.logger.warn(`Wiederhole Anfrage nach Fehler... (${retries} verbleibend)`);
        const delay = 1000 * Math.pow(2, 3 - retries);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, retries - 1);
      }
      
      // Alle Retries erschöpft
      this.logger.error(`Alle Wiederholungsversuche erschöpft. Letzter Fehler:`, error);
      throw error;
    }
  }

  /**
   * Holt User-Informationen aus der Member-Collection
   * @param {string} memberstackId - Memberstack ID des Users
   * @returns {Promise<Object|null>} User-Objekt oder null wenn nicht gefunden
   */
  async getUserByMemberstackId(memberstackId) {
    if (!memberstackId) {
      this.logger.error("Memberstack ID fehlt");
      throw new Error("Memberstack ID fehlt");
    }
    
    const cacheKey = `user_${memberstackId}`;
    const cachedUser = this.cache.get(cacheKey);
    if (cachedUser) {
      this.logger.info("User aus Cache geladen:", memberstackId);
      return cachedUser;
    }
    
    this.logger.info("Suche User mit Memberstack ID:", memberstackId);
    
    // Wir nutzen die filterQuery für eine effiziente DB-seitige Filterung
    const filterQuery = `{"memberstack-id":{"eq":"${memberstackId}"}}`;
    const apiUrl = `${WEBFLOW_VIDEO_FEED_CONFIG.API_BASE_URL}/${WEBFLOW_VIDEO_FEED_CONFIG.MEMBER_COLLECTION_ID}/items?live=true&limit=1&filter=${encodeURIComponent(filterQuery)}`;
    const workerUrl = this.buildWorkerUrl(apiUrl);
    
    try {
      return await this.logger.time(
        async () => {
          const data = await this.fetchWithRetry(workerUrl);
          
          if (!data.items || data.items.length === 0) {
            this.logger.warn("Kein User mit dieser Memberstack ID gefunden:", memberstackId);
            return null;
          }
          
          const user = data.items[0];
          this.logger.success("User gefunden:", {
            id: user.id,
            memberstackId: user.fieldData?.["memberstack-id"] || "nicht verfügbar"
          });
          
          // Cache-Speicherung
          this.cache.set(cacheKey, user);
          
          return user;
        }, 
        `Lade User (${memberstackId})`
      );
    } catch (error) {
      this.logger.error("Fehler beim Abrufen des Users:", error.message);
      throw error;
    }
  }

  /**
   * Holt Videos für einen bestimmten User
   * @param {string} userId - Webflow User ID
   * @returns {Promise<Array<VideoData>>} Array mit Video-Daten
   */
  async getVideosByUserId(userId) {
    if (!userId) {
      this.logger.error("User ID fehlt");
      throw new Error("User ID fehlt");
    }
    
    const cacheKey = `videos_${userId}`;
    const cachedVideos = this.cache.get(cacheKey);
    if (cachedVideos) {
      this.logger.info("Videos aus Cache geladen für User:", userId);
      return cachedVideos;
    }
    
    this.logger.info("Lade Videos für User:", userId);
    
    // Wir nutzen die filterQuery für eine effiziente DB-seitige Filterung
    const filterQuery = `{"user-id":{"eq":"${userId}"}}`;
    const apiUrl = `${WEBFLOW_VIDEO_FEED_CONFIG.API_BASE_URL}/${WEBFLOW_VIDEO_FEED_CONFIG.VIDEO_COLLECTION_ID}/items?live=true&filter=${encodeURIComponent(filterQuery)}`;
    const workerUrl = this.buildWorkerUrl(apiUrl);
    
    try {
      return await this.logger.time(
        async () => {
          const data = await this.fetchWithRetry(workerUrl);
          
          if (!data.items || data.items.length === 0) {
            this.logger.info("Keine Videos für diesen User gefunden:", userId);
            return [];
          }
          
          // Debug-Ausgabe für Video-Daten-Struktur
          if (data.items.length > 0) {
            this.logger.debug("Beispiel für Video-Item-Struktur:", {
              id: data.items[0].id,
              fieldKeys: Object.keys(data.items[0].fieldData || {})
            });
          }
          
          const videos = data.items.map(item => ({
            "video-link": item.fieldData["video-link"],
            "video-name": item.fieldData["video-name"],
            "video-kategorie": item.fieldData["video-kategorie"]
          })).filter(video => video["video-link"]);
          
          const invalidVideos = data.items.length - videos.length;
          if (invalidVideos > 0) {
            this.logger.warn(`${invalidVideos} Videos wurden gefiltert (fehlender Video-Link)`);
          }
          
          this.logger.success(`${videos.length} Videos geladen für User: ${userId}`);
          
          // Cache-Speicherung
          this.cache.set(cacheKey, videos);
          
          return videos;
        },
        `Lade Videos (userId: ${userId})`
      );
    } catch (error) {
      this.logger.error("Fehler beim Abrufen der Videos:", error.message);
      throw error;
    }
  }
}

// 🖥️ UI-Manager
class VideoUiManager {
  constructor() {
    this.logger = new Logger('🖥️ VideoUI');
  }
  /**
   * Zeigt eine Ladeanimation an
   * @param {HTMLElement} container - Container-Element
   */
  showLoading(container) {
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Videos werden geladen...</p>
      </div>
    `;
  }

  /**
   * Zeigt eine Fehlermeldung an
   * @param {HTMLElement} container - Container-Element
   * @param {string} message - Fehlermeldung
   */
  showError(container, message) {
    container.innerHTML = `
      <div class="error-message">
        <p>🚫 ${message}</p>
      </div>
    `;
  }

  /**
   * Zeigt eine "Keine Videos" Meldung an
   * @param {HTMLElement} container - Container-Element
   */
  showEmpty(container) {
    container.innerHTML = `
      <div class="empty-state">
        <p>🚫 Keine Videos gefunden.</p>
      </div>
    `;
  }

  /**
   * Rendert Videos in den Container
   * @param {HTMLElement} container - Container-Element
   * @param {Array<VideoData>} videos - Array mit Video-Daten
   */
  renderVideos(container, videos) {
    if (!videos || videos.length === 0) {
      this.logger.info("Keine Videos zum Anzeigen vorhanden");
      this.showEmpty(container);
      return;
    }

    this.logger.info(`Rendere ${videos.length} Videos`);
    container.innerHTML = "";

    // Debugging: Speicherverbrauch überwachen
    const initialMemory = window.performance?.memory?.usedJSHeapSize;
    if (initialMemory) {
      this.logger.debug("Heap-Größe vor dem Rendern:", `${Math.round(initialMemory / 1024 / 1024)} MB`);
    }

    // Erstellt Video-Elemente
    let loadedVideos = 0;
    let errorVideos = 0;

    videos.forEach((videoData, index) => {
      if (!videoData || !videoData["video-link"]) {
        this.logger.warn(`Video an Position ${index} hat keinen gültigen Link`);
        return;
      }

      const wrapperDiv = document.createElement("div");
      wrapperDiv.classList.add("db-upload-wrapper-item");
      wrapperDiv.dataset.videoIndex = index;

      const videoDiv = document.createElement("div");
      videoDiv.classList.add("db-upload-item-video");

      const videoElement = document.createElement("video");
      videoElement.src = videoData["video-link"];
      videoElement.controls = true;
      videoElement.classList.add("db-upload-video");
      videoElement.setAttribute("preload", "metadata"); // Optimierung: Nur Metadaten vorladen
      
      // Event-Listener für Debugging und Fehlerbehandlung
      videoElement.addEventListener("loadedmetadata", () => {
        loadedVideos++;
        this.logger.debug(`Video ${index} geladen (${loadedVideos}/${videos.length})`);
      });
      
      videoElement.addEventListener("error", (e) => {
        errorVideos++;
        this.logger.error(`Fehler beim Laden von Video ${index}:`, e.target.error?.message || "Unbekannter Fehler");
        
        // Fehlerbehandlung für nicht ladbare Videos
        videoElement.outerHTML = `
          <div class="video-error">
            <p>Video konnte nicht geladen werden</p>
          </div>
        `;
      });
      
      videoDiv.appendChild(videoElement);

      const detailsDiv = document.createElement("div");
      detailsDiv.classList.add("db-upload-item-details");
      detailsDiv.innerHTML = `
        <div class="db-upload-video-title">${videoData["video-name"] || "Unbenanntes Video"}</div>
        <p class="is-txt-tiny">Kategorie: ${videoData["video-kategorie"] || "Nicht angegeben"}</p>
      `;

      wrapperDiv.appendChild(videoDiv);
      wrapperDiv.appendChild(detailsDiv);
      container.appendChild(wrapperDiv);
    });

    // Fertigstellungs-Log nach kurzem Timeout (um Laden-Events zu erfassen)
    setTimeout(() => {
      this.logger.success(`Rendern abgeschlossen: ${loadedVideos} Videos geladen, ${errorVideos} Fehler`);
      
      // Speicherverbrauch nach dem Rendern
      const finalMemory = window.performance?.memory?.usedJSHeapSize;
      if (finalMemory && initialMemory) {
        const diff = finalMemory - initialMemory;
        this.logger.debug(
          "Heap-Größe nach dem Rendern:", 
          `${Math.round(finalMemory / 1024 / 1024)} MB`,
          `(${diff > 0 ? '+' : ''}${Math.round(diff / 1024 / 1024)} MB)`
        );
      }
    }, 1000);
  }
}

// 🚀 Hauptanwendung
class VideoFeedApp {
  constructor() {
    this.logger = new Logger('🚀 VideoFeedApp');
    this.apiService = new WebflowApiService();
    this.uiManager = new VideoUiManager();
    this.videoContainer = null;
    
    // Script-Version für Debugging
    this.version = "1.0.0";
    this.logger.info(`Video-Feed-App initialisiert (v${this.version})`);
    
    // Performance-Metriken
    this.metrics = {
      initTime: Date.now(),
      loadStartTime: 0,
      loadEndTime: 0
    };
    
    // Globale Fehlerbehandlung
    window.addEventListener('error', this.handleGlobalError.bind(this));
    
    // Debug-Steuerung über Konsolenbefehle
    if (window.videoFeedApp) {
      this.logger.warn("Vorherige Video-Feed-App-Instanz gefunden und überschrieben");
    }
    window.videoFeedApp = this;
    this.logger.debug("Debug-Befehle verfügbar: window.videoFeedApp.toggleDebug(), window.videoFeedApp.clearCache()");
  }
  
  /**
   * Globale Fehlerbehandlung
   * @param {ErrorEvent} event - Fehlerereignis
   */
  handleGlobalError(event) {
    if (event.filename && event.filename.includes('video-feed')) {
      this.logger.error(`Unbehandelter Fehler: ${event.message}`, {
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
      
      event.preventDefault();
    }
  }
  
  /**
   * Debug-Modus umschalten
   */
  toggleDebug() {
    const newState = !this.logger.isDebugEnabled;
    this.logger.setDebugEnabled(newState);
    this.apiService.logger.setDebugEnabled(newState);
    this.uiManager.logger.setDebugEnabled(newState);
    return `Debug-Modus ${newState ? 'aktiviert' : 'deaktiviert'}`;
  }
  
  /**
   * Cache leeren
   */
  clearCache() {
    this.apiService.cache.cache.clear();
    this.logger.info("Cache geleert");
    return "Cache wurde geleert. Nächste Anfragen werden neue Daten laden.";
  }

  /**
   * Initialisiert die Anwendung
   */
  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.videoContainer = document.getElementById(WEBFLOW_VIDEO_FEED_CONFIG.DOM_ELEMENTS.VIDEO_CONTAINER);
      
      if (!this.videoContainer) {
        console.error("🔴 Container-Element nicht gefunden:", WEBFLOW_VIDEO_FEED_CONFIG.DOM_ELEMENTS.VIDEO_CONTAINER);
        return;
      }
      
      this.loadUserVideos();
    });
  }

  /**
   * Lädt und zeigt Videos für den eingeloggten User
   */
  async loadUserVideos() {
    try {
      if (!this.videoContainer) {
        this.logger.error("Video-Container nicht gefunden. Abbruch.");
        return;
      }
      
      this.metrics.loadStartTime = performance.now();
      this.logger.info("Starte Laden des Video-Feeds");
      this.uiManager.showLoading(this.videoContainer);
      
      // Memberstack-ID des eingeloggten Users holen
      let memberstackId;
      try {
        const member = await window.$memberstackDom.getCurrentMember();
        memberstackId = member?.data?.id;
        
        if (!memberstackId) {
          this.logger.warn("Memberstack-ID konnte nicht abgerufen werden");
          this.uiManager.showError(this.videoContainer, "Kein eingeloggter User gefunden");
          return;
        }
        
        this.logger.info("Eingeloggter User mit Memberstack-ID:", memberstackId);
      } catch (memberError) {
        this.logger.error("Fehler beim Abrufen des Memberstack-Profils:", memberError);
        this.uiManager.showError(this.videoContainer, "Fehler beim Laden des Nutzer-Profils");
        return;
      }
      
      // User-Informationen aus der Member-Collection holen
      const user = await this.apiService.getUserByMemberstackId(memberstackId);
      
      if (!user) {
        this.logger.warn(`Kein User-Eintrag für Memberstack-ID ${memberstackId} gefunden`);
        this.uiManager.showError(
          this.videoContainer, 
          "User-Daten konnten nicht gefunden werden. Bitte später erneut versuchen."
        );
        return;
      }
      
      // User-ID aus Webflow nutzen, um Videos zu laden
      const userId = user.id;
      this.logger.debug(`Nutze Webflow-User-ID: ${userId} für Video-Abfrage`);
      
      const videos = await this.apiService.getVideosByUserId(userId);
      
      // Videos anzeigen
      this.uiManager.renderVideos(this.videoContainer, videos);
      
      // Performance-Messung abschließen
      this.metrics.loadEndTime = performance.now();
      const loadTime = this.metrics.loadEndTime - this.metrics.loadStartTime;
      this.logger.info(`Video-Feed geladen in ${loadTime.toFixed(2)}ms`);
      
    } catch (error) {
      this.logger.error("Fehler beim Laden des Video-Feeds:", error);
      
      if (this.videoContainer) {
        this.uiManager.showError(
          this.videoContainer, 
          "Fehler beim Laden der Videos. Bitte später erneut versuchen."
        );
        
        // Ausführlichere Fehlermeldung im Debug-Modus
        if (this.logger.isDebugEnabled) {
          const debugInfo = document.createElement("div");
          debugInfo.classList.add("debug-error-info");
          debugInfo.innerHTML = `
            <p class="is-txt-tiny">Debug-Info: ${error.message}</p>
            <pre class="error-stack">${error.stack}</pre>
          `;
          this.videoContainer.appendChild(debugInfo);
        }
      }
    }
  }
}

// Anwendung starten
try {
  const videoFeedApp = new VideoFeedApp();
  videoFeedApp.init();
} catch (e) {
  console.error("🔴 Kritischer Fehler beim Initialisieren der Video-Feed-App:", e);
}

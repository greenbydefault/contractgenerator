/**
 * App-Start mit zusätzlicher Verzögerung und mehreren Fallbacks
 * 
 * Diese Funktion enthält mehrere Absicherungen:
 * 1. Prüft, ob das DOM bereits geladen ist
 * 2. Setzt eine Verzögerung für eine sicherere Initialisierung
 * 3. Stellt sicher, dass Memberstack geladen ist
 * 4. Prüft auf mögliche Fehler und reagiert entsprechend
 */
const startVideoFeedApp = () => {
  const initWithDelay = (delay = 100) => {
    setTimeout(() => {
      try {
        console.log("📋 Video-Feed: Starte App...");
        
        // Überprüfen, ob Memberstack geladen ist
        if (!window.$memberstackDom) {
          console.warn("📋 Video-Feed: Memberstack noch nicht geladen, warte weitere 500ms...");
          setTimeout(() => initWithDelay(500), 500);
          return;
        }
        
        const videoFeedApp = new VideoFeedApp();
        videoFeedApp.init();
        
        // Für Debug-Zwecke global zugänglich machen
        window.videoFeedApp = videoFeedApp;
        
        // Zusätzliches Event auslösen, damit andere Scripts wissen, dass der Video-Feed initialisiert wurde
        const initEvent = new CustomEvent('videoFeedInitialized', { 
          detail: { success: true } 
        });
        document.dispatchEvent(initEvent);
        console.log("📋 Video-Feed: App erfolgreich gestartet");
        
      } catch (error) {
        console.error("📋 Video-Feed: Kritischer Fehler beim Start", error);
        
        // Event für den Fehlerfall auslösen
        const errorEvent = new CustomEvent('videoFeedInitError', { 
          detail: { error: error.message } 
        });
        document.dispatchEvent(errorEvent);
        
        // Automatische Wiederholdung nach Fehler, falls weniger als 3 Versuche
        if (!window.videoFeedRetryCount) {
          window.videoFeedRetryCount = 1;
        } else {
          window.videoFeedRetryCount++;
        }
        
        if (window.videoFeedRetryCount <= 3) {
          console.log(`📋 Video-Feed: Automatischer Neustart (Versuch ${window.videoFeedRetryCount}/3) in 1s...`);
          setTimeout(() => initWithDelay(500), 1000);
        }
      }
    }, delay);
  };

  // Prüfen, ob das DOM bereits geladen ist
  if (document.readyState === "loading") {
    // Wenn noch nicht geladen, warten auf DOMContentLoaded und dann initialisieren
    document.addEventListener("DOMContentLoaded", () => initWithDelay());
  } else {
    // Wenn DOM bereits geladen ist, direkt initialisieren
    initWithDelay();
  }
};

// App starten mit verbessertem Error-Handling
startVideoFeedApp();
  /**
   * App initialisieren mit verbesserten Fallbacks und Retry-Mechanismen
   */
  init() {
    // Initialisierungsfunktion definieren
    const initApp = () => {
      try {
        // UI-Elemente vorher explizit initialisieren
        this.initUIElements();
        
        // Video-Container mit mehreren Methoden finden
        const findContainer = () => {
          // 1. Versuch: Über die konfigurierte ID
          let container = document.getElementById(window.WEBFLOW_API.VIDEO_CONTAINER_ID);
          
          if (container) {
            console.log(`📋 Video-Feed: Container über ID gefunden: ${window.WEBFLOW_API.VIDEO_CONTAINER_ID}`);
            return container;
          }
          
          // 2. Versuch: Über bekannte Klassen
          const knownContainerClasses = [
            ".db-upload-wrapper", 
            ".upload-wrapper", 
            ".video-feed-container",
            ".video-container"
          ];
          
          for (const className of knownContainerClasses) {
            container = document.querySelector(className);
            if (container) {
              console.log(`📋 Video-Feed: Container über Klasse gefunden: ${className}`);
              return container;
            }
          }
          
          // 3. Versuch: Über Datenattribute
          container = document.querySelector('[data-video-feed="container"]');
          if (container) {
            console.log("📋 Video-Feed: Container über Datenattribut gefunden");
            return container;
          }
          
          // 4. Versuch: Intelligente Suche nach bekannten Kind-Elementen
          const potentialContainers = document.querySelectorAll('div');
          for (const div of potentialContainers) {
            // Prüfe auf Kinder mit Video-bezogenen Klassen
            if (div.querySelector('.db-upload-item-video, .video-item, [data-modal-toggle="new-upload"]')) {
              console.log("📋 Video-Feed: Container über Kind-Elemente gefunden");
              return div;
            }
          }
          
          // Nichts gefunden
          return null;
        };
        
        this.videoContainer = findContainer();
        
        // Container erstellen, wenn keiner gefunden wurde
        if (!this.videoContainer) {
          console.warn("📋 Video-Feed: Kein Container gefunden, erstelle einen neuen");
          
          // Versuche einen geeigneten Ort für den Container zu finden
          const mainContent = document.querySelector('main') || 
                             document.querySelector('.main-content') || 
                             document.querySelector('.content-wrapper') ||
                             document.body;
          
          if (mainContent) {
            this.videoContainer = document.createElement('div');
            this.videoContainer.id = window.WEBFLOW_API.VIDEO_CONTAINER_ID;
            this.videoContainer.classList.add('db-upload-wrapper', 'video-feed-container');
            
            // Container sichtbar und ansprechend stylen
            this.videoContainer.style.margin = '20px 0';
            this.videoContainer.style.padding = '20px';
            this.videoContainer.style.border = '1px solid #e2e8f0';
            this.videoContainer.style.borderRadius = '8px';
            
            // Container einfügen
            mainContent.appendChild(this.videoContainer);
            console.log("📋 Video-Feed: Neuer Container erstellt und eingefügt");
          } else {
            console.error("📋 Video-Feed: Konnte keinen geeigneten Ort für einen neuen Container finden");
            return;
          }
        }
        
        console.log("📋 Video-Feed: Container erfolgreich gefunden/erstellt");
        
        // Event-Listener für Video-Feed-Updates
        document.addEventListener('videoFeedUpdate', () => {
          console.log("📋 Video-Feed: Update-Event empfangen, lade Feed neu");
          
          // Cache löschen und Daten neu laden
          this.cache.clear();
          this.loadUserVideos();
        });
        
        // Videos laden mit Retry-Mechanismus
        let retryCount = 0;
        const maxRetries = 3;
        
        const loadVideosWithRetry = async () => {
          try {
            await this.loadUserVideos();
          } catch (error) {
            console.error(`📋 Video-Feed: Fehler beim Laden der Videos (Versuch ${retryCount + 1}/${maxRetries})`, error);
            
            if (retryCount < maxRetries) {
              retryCount++;
              const delay = 1000 * retryCount;
              console.log(`📋 Video-Feed: Wiederhole in ${delay}ms...`);
              setTimeout(loadVideosWithRetry, delay);
            } else {
              console.error("📋 Video-Feed: Maximale Anzahl an Versuchen erreicht");
              this.showError(`Fehler beim Laden des Video-Feeds: ${error.message}. Bitte Seite neu laden.`);
            }
          }
        };
        
        loadVideosWithRetry();
        
      } catch (error) {
        console.error("📋 Video-Feed: Kritischer Fehler bei Initialisierung", error);
      }
    };
    
    // Prüfen, ob das DOM bereits geladen ist
    if (document.readyState === "loading") {
      // Wenn noch nicht geladen, warten auf DOMContentLoaded
      document.addEventListener("DOMContentLoaded", initApp);
    } else {
      // Wenn DOM bereits geladen ist, sofort initialisieren mit kurzer Verzögerung
      // für sicherere Initialisierung
      setTimeout(initApp, 100);
    }
  }
}
  /**
   * Videos für eingeloggten User laden und anzeigen
   */
  async loadUserVideos() {
    try {
      if (!this.videoContainer) {
        console.error("📋 Video-Feed: Container nicht gefunden");
        return;
      }
      
      // Vermeidet doppelte Ladeanfragen
      if (this.isLoading) {
        console.log("📋 Video-Feed: Ladevorgang bereits aktiv, ignoriere Anfrage");
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
      
      console.log("📋 Video-Feed: Eingeloggter User mit Memberstack-ID", memberstackId);
      
      // Video-Limit basierend auf Membership bestimmen
      const maxUploads = this.getMembershipLimit(member);
      console.log("📋 Video-Feed: Maximale Uploads für User:", maxUploads);
      
      // 1. Webflow-ID aus den Custom Fields der Memberstack-Daten extrahieren
      let webflowMemberId = this.extractWebflowId(member);
      
      if (!webflowMemberId) {
        this.showError("Keine Webflow-Member-ID in den Memberstack-Daten gefunden");
        console.error("📋 Video-Feed: Memberstack-Daten ohne Webflow-ID:", member.data);
        this.isLoading = false;
        return;
      }
      
      // 2. User direkt mit der Webflow-ID abrufen
      const user = await this.getUserByWebflowId(webflowMemberId);
      
      if (!user) {
        this.showError(`User mit Webflow-ID "${webflowMemberId}" nicht gefunden`);
        this.isLoading = false;
        return;
      }
      
      // 3. Videos aus dem Video-Feed des Users holen
      const videos = await this.getVideosFromUserFeed(user);
      this.userVideos = videos;
      
      // Upload-Counter aktualisieren
      this.updateUploadCounter(videos.length, maxUploads);
      
      // Videos anzeigen
      this.renderVideos(videos);
      
      this.isLoading = false;
    } catch (error) {
      console.error("📋 Video-Feed: Fehler beim Laden der Videos", error);
      this.showError(`Fehler beim Laden des Video-Feeds: ${error.message}`);
      this.isLoading = false;
    }
  }

  /**
   * Helper-Methode zum Extrahieren der Webflow-ID aus Memberstack-Daten
   */
  extractWebflowId(member) {
    if (!member || !member.data) return null;
    
    // Mögliche Orte für die Webflow-ID prüfen
    if (member.data.customFields && member.data.customFields["webflow-member-id"]) {
      const id = member.data.customFields["webflow-member-id"];
      console.log("📋 Video-Feed: Webflow-Member-ID aus customFields gefunden:", id);
      return id;
    } 
    
    if (member.data.metaData && member.data.metaData["webflow-member-id"]) {
      const id = member.data.metaData["webflow-member-id"];
      console.log("📋 Video-Feed: Webflow-Member-ID aus metaData gefunden:", id);
      return id;
    }
    
    // Weitere mögliche Felder prüfen
    const possibleFields = ["webflow-id", "webflow_id", "webflowId", "webflow_member_id"];
    
    // Prüfe customFields
    if (member.data.customFields) {
      for (const field of possibleFields) {
        if (member.data.customFields[field]) {
          console.log(`📋 Video-Feed: Webflow-Member-ID aus customFields["${field}"] gefunden:`, 
            member.data.customFields[field]);
          return member.data.customFields[field];
        }
      }
    }
    
    // Prüfe metaData
    if (member.data.metaData) {
      for (const field of possibleFields) {
        if (member.data.metaData[field]) {
          console.log(`📋 Video-Feed: Webflow-Member-ID aus metaData["${field}"] gefunden:`, 
            member.data.metaData[field]);
          return member.data.metaData[field];
        }
      }
    }
    
    return null;
  }
  /**
   * Verbesserte Methode zum Initialisieren und Suchen von UI-Elementen
   * Diese Methode versucht verschiedene Wege, die UI-Elemente zu finden
   */
  initUIElements() {
    console.log("📊 Video-Feed: Initialisiere UI-Elemente");
    
    // Mehrere Möglichkeiten zum Finden der Elemente (IDs, Klassen, Datenattribute)
    const findElement = (primaryId, fallbackSelectors = []) => {
      // Erst über ID versuchen
      let element = document.getElementById(primaryId);
      
      // Wenn nicht gefunden, Fallback-Selektoren versuchen
      if (!element && fallbackSelectors.length > 0) {
        for (const selector of fallbackSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            element = elements[0];
            console.log(`📊 Video-Feed: Element über Fallback-Selektor gefunden: ${selector}`);
            break;
          }
        }
      }
      
      return element;
    };
    
    // Elemente suchen mit Fallbacks
    const titleElement = findElement(
      window.WEBFLOW_API.UPLOAD_LIMIT_TITLE_ID, 
      ['.upload-limit-title', '[data-title="upload-limit"]']
    );
    
    const counterElement = findElement(
      window.WEBFLOW_API.UPLOAD_COUNTER_ID,
      ['#counter_id', '.upload-counter', '[data-counter="uploads"]']
    );
    
    const progressElement = findElement(
      window.WEBFLOW_API.UPLOAD_PROGRESS_ID,
      ['.upload-progress', '[data-progress="uploads"]']
    );
    
    const messageElement = findElement(
      window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID,
      ['.limit-message', '[data-message="limit"]']
    );
    
    // Ergebnisse in die Instanzvariablen speichern
    this.uiElements = {
      title: titleElement,
      counter: counterElement,
      progress: progressElement,
      limitMessage: messageElement
    };
    
    console.log("📊 Video-Feed: UI-Elemente gefunden:", {
      title: Boolean(titleElement),
      counter: Boolean(counterElement),
      progress: Boolean(progressElement),
      limitMessage: Boolean(messageElement)
    });
    
    // Alle IDs im Dokument für Debugging ausgeben
    const allIds = [];
    document.querySelectorAll('[id]').forEach(el => {
      allIds.push(el.id);
    });
    console.log("📊 Video-Feed: Alle IDs im Dokument:", allIds);
    
    return this.uiElements;
  }

  /**
   * Verbesserte Ladeanimation mit Skeleton Loader und Fallback
   */
  showLoading() {
    if (!this.videoContainer) {
      console.error("📋 Video-Feed: Container nicht gefunden für Loading-Animation");
      return;
    }
    
    // Container leeren
    this.videoContainer.innerHTML = '';
    
    // DocumentFragment für bessere Performance
    const fragment = document.createDocumentFragment();
    
    // CSS für Skeleton Loader hinzufügen, falls noch nicht vorhanden
    if (!document.getElementById('skeleton-styles')) {
      try {
        const styleElement = document.createElement('style');
        styleElement.id = 'skeleton-styles';
        styleElement.textContent = `
          .skeleton-item {
            position: relative;
            overflow: hidden;
            margin-bottom: 20px;
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
          .skeleton-text-pulse {
            margin-bottom: 8px;
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
        console.log("📋 Video-Feed: Skeleton-Styles hinzugefügt");
      } catch (error) {
        console.error("📋 Video-Feed: Fehler beim Hinzufügen der Skeleton-Styles", error);
      }
    }
    
    // Versuche herauszufinden, ob die Klassen existieren
    const hasRequiredClasses = document.querySelector('.db-upload-wrapper-item, .db-upload-item-video');
    
    if (hasRequiredClasses) {
      // Erstelle 3 Skeleton-Items mit den vorhandenen Klassen
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
    } else {
      // Einfacherer Fallback ohne spezifische Klassen
      for (let i = 0; i < 3; i++) {
        const skeleton = document.createElement('div');
        skeleton.classList.add('skeleton-item');
        skeleton.style.marginBottom = '20px';
        
        skeleton.innerHTML = `
          <div style="margin-bottom: 10px;">
            <div class="skeleton-video-pulse" style="animation-delay: ${i * 0.15}s"></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex-grow: 1;">
              <div class="skeleton-text-pulse" style="width: ${70 - i * 10}%; height: 20px; animation-delay: ${i * 0.1}s"></div>
              <div class="skeleton-text-pulse" style="width: ${40 + i * 5}%; height: 14px; margin-top: 8px; animation-delay: ${i * 0.2}s"></div>
            </div>
            <div class="skeleton-button-pulse" style="animation-delay: ${i * 0.25}s"></div>
          </div>
        `;
        
        fragment.appendChild(skeleton);
      }
    }
    
    // Alle Skeleton-Items auf einmal anhängen
    this.videoContainer.appendChild(fragment);
    console.log("📋 Video-Feed: Loading-Animation angezeigt");
  }
  
  /**
   * Fehlermeldung anzeigen
   */
  showError(message) {
    if (!this.videoContainer) return;
    
    this.videoContainer.innerHTML = `
      <div class="error-message" style="padding: 20px; text-align: center; color: #e53e3e; background-color: #fff5f5; border: 1px solid #e53e3e; border-radius: 4px; margin: 20px 0;">
        <p>🚫 ${message}</p>
        <button style="margin-top: 10px; padding: 6px 12px; background: #4a5568; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.videoFeedApp.loadUserVideos()">
          Erneut versuchen
        </button>
      </div>
    `;
  }// 🌐 Webflow API Integration für Video-Feed
// Fixed Version 7.0.1

/**
 * Konfigurationswerte mit Defaults
 */
const DEFAULT_BASE_URL = "https://api.webflow.com/v2/collections";
const DEFAULT_WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url=";
const DEFAULT_MEMBER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";
const DEFAULT_VIDEO_COLLECTION_ID = "67d806e65cadcadf2f41e659";
const DEFAULT_FREE_MEMBER_LIMIT = 1;
const DEFAULT_PAID_MEMBER_LIMIT = 12;

/**
 * Globale Konfiguration für das Video-Feed-Skript
 */
window.WEBFLOW_API = window.WEBFLOW_API || {};

// Funktion zur sicheren Initialisierung von Konfigurationswerten
function ensureConfigValue(key, defaultValue) {
  if (!window.WEBFLOW_API[key]) {
    console.warn(`📋 Video-Feed: Konfiguration ${key} nicht gefunden oder undefined, setze Default:`, defaultValue);
    window.WEBFLOW_API[key] = defaultValue;
  }
}

// Grundkonfiguration mit garantierten Werten
ensureConfigValue('BASE_URL', DEFAULT_BASE_URL);
ensureConfigValue('WORKER_BASE_URL', DEFAULT_WORKER_BASE_URL);
ensureConfigValue('MEMBER_COLLECTION_ID', DEFAULT_MEMBER_COLLECTION_ID);
ensureConfigValue('VIDEO_COLLECTION_ID', DEFAULT_VIDEO_COLLECTION_ID);
ensureConfigValue('FREE_MEMBER_LIMIT', DEFAULT_FREE_MEMBER_LIMIT);
ensureConfigValue('PAID_MEMBER_LIMIT', DEFAULT_PAID_MEMBER_LIMIT);

// UI-Konfiguration mit korrigierten IDs basierend auf den Log-Daten
window.WEBFLOW_API.VIDEO_CONTAINER_ID = window.WEBFLOW_API.VIDEO_CONTAINER_ID || "video-feed";
window.WEBFLOW_API.UPLOAD_LIMIT_TITLE_ID = window.WEBFLOW_API.UPLOAD_LIMIT_TITLE_ID || "upload-limit-title";
window.WEBFLOW_API.UPLOAD_COUNTER_ID = window.WEBFLOW_API.UPLOAD_COUNTER_ID || "counter_id"; // Geändert von "uploads-counter" zu "counter_id"
window.WEBFLOW_API.UPLOAD_PROGRESS_ID = window.WEBFLOW_API.UPLOAD_PROGRESS_ID || "uploads-progress";
window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID = window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID || "upload-limit-message";

// Kategorie-Mapping 
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

// Debug-Informationen zur Konfiguration ausgeben
console.log("📋 Video-Feed: WEBFLOW_API Konfiguration:", {
  BASE_URL: window.WEBFLOW_API.BASE_URL,
  WORKER_BASE_URL: window.WEBFLOW_API.WORKER_BASE_URL,
  MEMBER_COLLECTION_ID: window.WEBFLOW_API.MEMBER_COLLECTION_ID,
  VIDEO_COLLECTION_ID: window.WEBFLOW_API.VIDEO_COLLECTION_ID,
  FREE_MEMBER_LIMIT: window.WEBFLOW_API.FREE_MEMBER_LIMIT,
  PAID_MEMBER_LIMIT: window.WEBFLOW_API.PAID_MEMBER_LIMIT,
  VIDEO_CONTAINER_ID: window.WEBFLOW_API.VIDEO_CONTAINER_ID,
  UPLOAD_LIMIT_TITLE_ID: window.WEBFLOW_API.UPLOAD_LIMIT_TITLE_ID,
  UPLOAD_COUNTER_ID: window.WEBFLOW_API.UPLOAD_COUNTER_ID,
  UPLOAD_PROGRESS_ID: window.WEBFLOW_API.UPLOAD_PROGRESS_ID,
  UPLOAD_LIMIT_MESSAGE_ID: window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID
});

/**
 * Cache für API-Antworten
 */
class SimpleCache {
  constructor() {
    this.items = {};
    this.expiration = 5 * 60 * 1000; // 5 Minuten Standard-Cache-Zeit
  }

  get(key) {
    const item = this.items[key];
    if (!item) return null;
    
    // Prüfen ob abgelaufen
    if (Date.now() - item.timestamp > this.expiration) { 
      delete this.items[key];
      return null;
    }
    
    return item.data;
  }

  set(key, data) {
    this.items[key] = {
      timestamp: Date.now(),
      data: data
    };
  }

  clear() {
    this.items = {};
  }
}

/**
 * Hilfsfunktion zum Abrufen von Kategorienamen aus IDs
 */
function getCategoryName(categoryId) {
  if (!categoryId) return "Nicht angegeben";
  
  // Prüfe, ob die Kategorie-ID im Mapping existiert
  if (window.WEBFLOW_API.CATEGORY_MAPPING && window.WEBFLOW_API.CATEGORY_MAPPING[categoryId]) {
    return window.WEBFLOW_API.CATEGORY_MAPPING[categoryId];
  }
  
  // Fallback: Gib die ID zurück, wenn kein Mapping gefunden wurde
  return "Kategorie " + categoryId.substring(0, 6);
}

/**
 * Haupt-App-Klasse für den Video-Feed
 */
class VideoFeedApp {
  constructor() {
    this.cache = new SimpleCache();
    this.videoContainer = null;
    this.currentMember = null;
    this.userVideos = [];
    this.isLoading = false;
    this.uiElements = {
      title: null,
      counter: null,
      progress: null,
      limitMessage: null
    };
    
    console.log("📋 Video-Feed: Initialisiert mit Limits:", 
      window.WEBFLOW_API.FREE_MEMBER_LIMIT, 
      window.WEBFLOW_API.PAID_MEMBER_LIMIT
    );
  }

  /**
   * Worker-URL erstellen für Cross-Origin-Anfragen
   */
  buildWorkerUrl(apiUrl) {
    return `${window.WEBFLOW_API.WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
  }

  /**
   * Einen vollständigen API-Endpunkt erstellen
   */
  buildApiUrl(path, params = {}) {
    const baseUrl = window.WEBFLOW_API.BASE_URL || DEFAULT_BASE_URL;
    const fullUrl = `${baseUrl}${path}`;
    
    console.log("📋 Video-Feed: API-URL vor Parametern:", fullUrl);
    
    // Parameter als Query-String hinzufügen, wenn vorhanden
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'object') {
        queryParams.append(key, encodeURIComponent(JSON.stringify(value)));
      } else {
        queryParams.append(key, value);
      }
    }
    
    const queryString = queryParams.toString();
    return queryString ? `${fullUrl}?${queryString}` : fullUrl;
  }

  /**
   * API-Anfrage mit Retry-Logik und besserem Error-Handling
   */
  async fetchApi(url, retries = 2) {
    let attempt = 1;
    
    while (true) {
      try {
        console.log(`📋 Video-Feed: API-Anfrage (Versuch ${attempt}/${retries + 1}) an`, url);
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`📋 Video-Feed: API-Fehler ${response.status}:`, errorText);
          
          if (attempt <= retries) {
            const delay = Math.min(1000 * attempt, 3000); // Exponential Backoff
            console.log(`📋 Video-Feed: Wiederhole in ${delay}ms...`);
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
          console.log(`📋 Video-Feed: Fehler, wiederhole in ${delay}ms...`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        console.error("📋 Video-Feed: Maximale Anzahl an Versuchen erreicht", error);
        throw error;
      }
    }
  }

  /**
   * User direkt anhand der Webflow-ID abrufen
   */
  async getUserByWebflowId(webflowId) {
    if (!webflowId) {
      throw new Error("Webflow-ID fehlt");
    }
    
    console.log("📋 Video-Feed: Rufe User mit Webflow-ID ab:", webflowId);
    
    const cacheKey = `webflow_user_${webflowId}`;
    const cachedUser = this.cache.get(cacheKey);
    
    if (cachedUser) {
      console.log("📋 Video-Feed: User aus Cache geladen", webflowId);
      return cachedUser;
    }
    
    // Sicher die Collection-ID abrufen
    let memberCollectionId = window.WEBFLOW_API.MEMBER_COLLECTION_ID;
    
    if (!memberCollectionId) {
      console.warn("📋 Video-Feed: MEMBER_COLLECTION_ID ist undefined, verwende DEFAULT_MEMBER_COLLECTION_ID:", DEFAULT_MEMBER_COLLECTION_ID);
      memberCollectionId = DEFAULT_MEMBER_COLLECTION_ID;
      window.WEBFLOW_API.MEMBER_COLLECTION_ID = DEFAULT_MEMBER_COLLECTION_ID;
    }
    
    console.log("📋 Video-Feed: Verwende Member-Collection-ID:", memberCollectionId);
    
    // Direkter API-Aufruf mit der ID und /live Endpunkt für veröffentlichte Inhalte
    const apiUrl = this.buildApiUrl(`/${memberCollectionId}/items/${webflowId}/live`);
    const workerUrl = this.buildWorkerUrl(apiUrl);
    
    try {
      const user = await this.fetchApi(workerUrl);
      
      if (!user || !user.id) {
        console.warn("📋 Video-Feed: Kein User gefunden mit Webflow-ID", webflowId);
        return null;
      }
      
      console.log("📋 Video-Feed: User gefunden in Member-Collection:", user.id);
      
      // Zusätzliches Logging zur Überprüfung der fieldData und des video-feed Feldes
      if (user.fieldData && user.fieldData["video-feed"]) {
        console.log("📋 Video-Feed: User hat video-feed Feld mit", 
          Array.isArray(user.fieldData["video-feed"]) ? 
          user.fieldData["video-feed"].length + " Einträgen" : 
          "Wert " + typeof user.fieldData["video-feed"]
        );
      } else {
        console.warn("📋 Video-Feed: User hat KEIN video-feed Feld in fieldData!");
        console.log("📋 Video-Feed: Verfügbare Felder:", 
          user.fieldData ? Object.keys(user.fieldData).join(", ") : "keine fieldData"
        );
      }
      
      this.cache.set(cacheKey, user);
      return user;
    } catch (error) {
      console.error("📋 Video-Feed: Fehler beim Abrufen des Users mit Webflow-ID", error);
      throw error;
    }
  }

  /**
   * Optimierte Methode zum Laden von Videos in Chunks
   */
  async fetchVideosInChunks(videoIds, chunkSize = 20) {
    if (!videoIds || videoIds.length === 0) {
      return [];
    }
    
    const videoCollectionId = window.WEBFLOW_API.VIDEO_COLLECTION_ID || DEFAULT_VIDEO_COLLECTION_ID;
    const videoIdSet = new Set(videoIds);
    let allVideos = [];
    
    // Videos in Chunks aufteilen für bessere Performance
    const chunks = [];
    for (let i = 0; i < videoIds.length; i += chunkSize) {
      chunks.push(videoIds.slice(i, i + chunkSize));
    }
    
    console.log(`📋 Video-Feed: Lade ${videoIds.length} Videos in ${chunks.length} Chunks`);
    
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
          // Sicherstellen, dass wir nur Videos mit IDs im Set behalten
          const chunkVideos = data.items
            .filter(item => videoIdSet.has(item.id))
            .map(item => this.processVideoItem(item))
            .filter(video => video && video["video-link"]);
          
          allVideos = allVideos.concat(chunkVideos);
        }
      } catch (error) {
        console.error(`📋 Video-Feed: Fehler beim Laden von Chunk ${i+1}`, error);
      }
    }
    
    return allVideos;
  }
  
  /**
   * Video-Item in einheitliches Format bringen
   */
  processVideoItem(item) {
    if (!item || !item.fieldData) {
      return null;
    }
    
    return {
      id: item.id,
      "video-link": item.fieldData["video-link"],
      "video-name": item.fieldData["video-name"] || item.fieldData["name"] || "Unbenanntes Video",
      "video-kategorie": item.fieldData["video-kategorie"],
      "kategorie-name": getCategoryName(item.fieldData["video-kategorie"])
    };
  }

  /**
   * Holt die Videos aus dem Video-Feed des Users
   */
  async getVideosFromUserFeed(user) {
    if (!user || !user.fieldData) {
      console.log("📋 Video-Feed: Keine fieldData im User-Profil gefunden");
      return [];
    }
    
    // Vorsichtiger Zugriff auf das video-feed Feld
    if (!user.fieldData["video-feed"]) {
      console.log("📋 Video-Feed: Keine Video-Referenzen im User-Profil gefunden");
      console.log("📋 Video-Feed: Verfügbare Felder:", Object.keys(user.fieldData).join(", "));
      return [];
    }
    
    // Das video-feed Feld enthält die IDs der Videos im User-Profil
    const videoFeed = user.fieldData["video-feed"];
    
    // Detaillierte Debug-Informationen über das video-feed Feld
    console.log("📋 Video-Feed: Video-Feed-Typ:", Array.isArray(videoFeed) ? "Array" : typeof videoFeed);
    console.log("📋 Video-Feed: Video-Feed-Länge:", Array.isArray(videoFeed) ? videoFeed.length : "N/A");
    
    if (!videoFeed || !Array.isArray(videoFeed) || videoFeed.length === 0) {
      console.log("📋 Video-Feed: Leerer Video-Feed im User-Profil");
      return [];
    }
    
    console.log(`📋 Video-Feed: ${videoFeed.length} Video-IDs im User-Feed gefunden`);
    
    // Caching für bessere Performance
    const cacheKey = `videos_${user.id}`;
    const cachedVideos = this.cache.get(cacheKey);
    
    if (cachedVideos) {
      console.log(`📋 Video-Feed: ${cachedVideos.length} Videos aus Cache geladen`);
      return cachedVideos;
    }
    
    // Videos in Chunks laden
    let videos = [];
    
    try {
      videos = await this.fetchVideosInChunks(videoFeed);
      console.log(`📋 Video-Feed: ${videos.length} Videos geladen mit den nötigen Daten`);
      
      // Im Cache speichern
      this.cache.set(cacheKey, videos);
    } catch (error) {
      console.error("📋 Video-Feed: Fehler beim Laden der Videos", error);
    }
    
    return videos;
  }

  /**
   * Bestimmt das Video-Limit basierend auf dem Mitgliedsstatus
   */
  getMembershipLimit(member) {
    if (!member || !member.data) {
      console.log("📋 Video-Feed: Kein Member-Objekt, verwende FREE_MEMBER_LIMIT");
      return window.WEBFLOW_API.FREE_MEMBER_LIMIT || DEFAULT_FREE_MEMBER_LIMIT;
    }
    
    // Prüfen ob Paid-Member anhand der planConnections
    let isPaid = false;
    
    // Option 1: Prüfen auf planConnections Array
    if (member.data.planConnections && member.data.planConnections.length > 0) {
      for (const connection of member.data.planConnections) {
        if (connection.status === "ACTIVE" && connection.type !== "FREE") {
          isPaid = true;
          console.log("📋 Video-Feed: Paid-Member erkannt über planConnections");
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
      console.log("📋 Video-Feed: Paid-Member erkannt über acl/status");
    }
    
    const freeLimit = window.WEBFLOW_API.FREE_MEMBER_LIMIT || DEFAULT_FREE_MEMBER_LIMIT;
    const paidLimit = window.WEBFLOW_API.PAID_MEMBER_LIMIT || DEFAULT_PAID_MEMBER_LIMIT;
    
    // Verwende die Werte mit sicheren Fallbacks
    const limit = isPaid ? paidLimit : freeLimit;
    console.log(`📋 Video-Feed: Mitglied (${isPaid ? 'PAID' : 'FREE'}) erhält Limit:`, limit);
    
    return limit;
  }

  /**
   * Verbesserte Version: Aktualisiert den Upload-Counter auf der Seite
   * Diese Version sucht flexibler nach den Elementen und erstellt sie bei Bedarf
   */
  updateUploadCounter(videoCount, maxUploads) {
    console.log("📊 Video-Feed: updateUploadCounter aufgerufen mit", videoCount, maxUploads);
    
    // Stelle sicher, dass die Zahlen für die Anzeige gültig sind
    const validVideoCount = isNaN(videoCount) ? 0 : videoCount;
    const validMaxUploads = isNaN(maxUploads) ? DEFAULT_PAID_MEMBER_LIMIT : maxUploads;
    
    // Counter-Element finden oder erstellen
    if (!this.uiElements.counter) {
      // Erst versuchen, über ID zu finden
      this.uiElements.counter = document.getElementById(window.WEBFLOW_API.UPLOAD_COUNTER_ID);
      
      // Wenn nicht gefunden, nach Attributen suchen
      if (!this.uiElements.counter) {
        this.uiElements.counter = document.querySelector('[data-counter="uploads"]') || 
                                   document.querySelector('.upload-counter');
      }
      
      // Wenn immer noch nicht gefunden, erstellen
      if (!this.uiElements.counter && this.videoContainer) {
        const counterDiv = document.createElement('div');
        counterDiv.id = window.WEBFLOW_API.UPLOAD_COUNTER_ID;
        counterDiv.classList.add('upload-counter');
        counterDiv.style.margin = '10px 0';
        counterDiv.style.fontWeight = 'bold';
        
        // Vor dem Container einfügen
        this.videoContainer.parentNode.insertBefore(counterDiv, this.videoContainer);
        this.uiElements.counter = counterDiv;
        console.log("📊 Video-Feed: Counter-Element wurde erstellt");
      }
    }
    
    // Progress-Element finden oder erstellen
    if (!this.uiElements.progress) {
      // Erst versuchen, über ID zu finden
      this.uiElements.progress = document.getElementById(window.WEBFLOW_API.UPLOAD_PROGRESS_ID);
      
      // Wenn nicht gefunden, nach Attributen suchen
      if (!this.uiElements.progress) {
        this.uiElements.progress = document.querySelector('[data-progress="uploads"]') || 
                                    document.querySelector('.upload-progress');
      }
      
      // Wenn immer noch nicht gefunden, erstellen
      if (!this.uiElements.progress && this.videoContainer) {
        const progressContainer = document.createElement('div');
        progressContainer.style.width = '100%';
        progressContainer.style.backgroundColor = '#f0f0f0';
        progressContainer.style.borderRadius = '4px';
        progressContainer.style.margin = '10px 0 20px 0';
        progressContainer.style.overflow = 'hidden';
        
        const progressBar = document.createElement('div');
        progressBar.id = window.WEBFLOW_API.UPLOAD_PROGRESS_ID;
        progressBar.classList.add('upload-progress', 'progress-low');
        progressBar.style.height = '10px';
        progressBar.style.width = '0%';
        progressBar.style.backgroundColor = '#4CAF50';
        progressBar.style.transition = 'width 0.3s ease';
        
        progressContainer.appendChild(progressBar);
        
        // Nach dem Counter einfügen
        if (this.uiElements.counter && this.uiElements.counter.nextSibling) {
          this.uiElements.counter.parentNode.insertBefore(progressContainer, this.uiElements.counter.nextSibling);
        } else {
          // Oder vor dem Container
          this.videoContainer.parentNode.insertBefore(progressContainer, this.videoContainer);
        }
        
        this.uiElements.progress = progressBar;
        console.log("📊 Video-Feed: Progress-Element wurde erstellt");
      }
    }
    
    // Limit-Message-Element finden oder erstellen
    if (!this.uiElements.limitMessage) {
      // Erst versuchen, über ID zu finden
      this.uiElements.limitMessage = document.getElementById(window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID);
      
      // Wenn nicht gefunden, nach Attributen suchen
      if (!this.uiElements.limitMessage) {
        this.uiElements.limitMessage = document.querySelector('[data-message="limit"]') || 
                                        document.querySelector('.limit-message');
      }
      
      // Wenn immer noch nicht gefunden, erstellen
      if (!this.uiElements.limitMessage && this.videoContainer) {
        const messageDiv = document.createElement('div');
        messageDiv.id = window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID;
        messageDiv.classList.add('limit-message');
        messageDiv.style.color = '#e53e3e';
        messageDiv.style.fontWeight = 'bold';
        messageDiv.style.margin = '10px 0';
        messageDiv.style.display = 'none';
        
        // Vor dem Container einfügen
        this.videoContainer.parentNode.insertBefore(messageDiv, this.videoContainer);
        this.uiElements.limitMessage = messageDiv;
        console.log("📊 Video-Feed: Limit-Message-Element wurde erstellt");
      }
    }
    
    // Jetzt die UI-Elemente aktualisieren
    
    // Counter aktualisieren
    if (this.uiElements.counter) {
      this.uiElements.counter.textContent = `Videos: ${validVideoCount}/${validMaxUploads}`;
      console.log("📊 Video-Feed: Counter aktualisiert:", this.uiElements.counter.textContent);
    }
    
    // Progress-Bar aktualisieren
    if (this.uiElements.progress) {
      // Prozentsatz berechnen
      const progressPercent = validMaxUploads > 0 ? (validVideoCount / validMaxUploads) * 100 : 0;
      
      // Farbklassen basierend auf Fortschritt
      this.uiElements.progress.classList.remove("progress-low", "progress-medium", "progress-high", "progress-full");
      
      if (progressPercent >= 100) {
        this.uiElements.progress.classList.add("progress-full");
        this.uiElements.progress.style.backgroundColor = '#e53e3e';
      } else if (progressPercent >= 70) {
        this.uiElements.progress.classList.add("progress-high");
        this.uiElements.progress.style.backgroundColor = '#f6ad55';
      } else if (progressPercent >= 40) {
        this.uiElements.progress.classList.add("progress-medium");
        this.uiElements.progress.style.backgroundColor = '#68d391';
      } else {
        this.uiElements.progress.classList.add("progress-low");
        this.uiElements.progress.style.backgroundColor = '#4CAF50';
      }
      
      // Breite aktualisieren
      this.uiElements.progress.style.width = `${progressPercent}%`;
      console.log("📊 Video-Feed: Fortschrittsbalken auf", progressPercent, "% gesetzt");
    }
    
    // Prüfen, ob das Limit erreicht ist
    const isLimitReached = validVideoCount >= validMaxUploads;
    
    // Logging, um den Zustand besser zu verstehen
    console.log(`📊 Video-Feed: Upload-Status: ${validVideoCount}/${validMaxUploads}, Limit erreicht: ${isLimitReached}`);
    
    // Upload-Button je nach Limit-Status ein/ausblenden
    const uploadButtons = document.querySelectorAll('[data-modal-toggle="new-upload"]');
    uploadButtons.forEach(button => {
      button.style.display = isLimitReached ? "none" : "";
    });
    console.log("📊 Video-Feed: Upload-Buttons aktualisiert, Anzahl:", uploadButtons.length);
    
    // Upload-Limit-Meldung aktualisieren
    if (this.uiElements.limitMessage) {
      if (isLimitReached) {
        this.uiElements.limitMessage.style.display = "block";
        this.uiElements.limitMessage.textContent = "Upload-Limit erreicht";
        this.uiElements.limitMessage.classList.add("limit-reached");
        console.log("📊 Video-Feed: Limit-Meldung wird angezeigt");
      } else {
        // Limit nicht erreicht, mach die Nachricht unsichtbar
        this.uiElements.limitMessage.style.display = "none";
        this.uiElements.limitMessage.classList.remove("limit-reached");
        console.log("📊 Video-Feed: Limit-Meldung wird ausgeblendet");
      }
    }
  }

  /**
   * Erstellt einen "Erstes Video hochladen" Button, falls keine Videos vorhanden sind
   */
  createUploadButton() {
    if (!this.videoContainer) return;
    
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("db-upload-empty-state");
    
    // Normaler Upload-Button mit den gewünschten Attributen
    const uploadButton = document.createElement("a");
    uploadButton.href = "#"; 
    uploadButton.classList.add("db-upload-more-upload-button");
    uploadButton.setAttribute("data-modal-toggle", "new-upload");
    uploadButton.textContent = "Lade dein erstes Video hoch";
    
    buttonContainer.appendChild(uploadButton);
    this.videoContainer.appendChild(buttonContainer);
  }

  /**
   * Videos im Container anzeigen mit optimierter DOM-Manipulation
   */
  renderVideos(videos) {
    if (!this.videoContainer) {
      console.error("📋 Video-Feed: Container nicht gefunden");
      return;
    }
    
    // Container leeren
    this.videoContainer.innerHTML = "";
    
    // Prüfen, ob das Limit erreicht ist
    const maxUploads = this.getMembershipLimit(this.currentMember);
    const isLimitReached = videos && videos.length >= maxUploads;
    
    if (isLimitReached) {
      console.log("📋 Video-Feed: Upload-Limit erreicht", videos.length, "/", maxUploads);
    }
    
    if (!videos || videos.length === 0) {
      // Statt Fehlermeldung den Upload-Button anzeigen
      this.createUploadButton();
      return;
    }
    
    // DocumentFragment für bessere Performance
    const fragment = document.createDocumentFragment();
    
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
      
      // Kategorie mit Mapping
      const categoryName = videoData["kategorie-name"] || getCategoryName(videoData["video-kategorie"]);
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
      
      // Event-Handler für Edit-Button
      editButton.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Option 1: Wenn die editVideo-Funktion im globalen Scope ist
        if (typeof window.editVideo === "function") {
          window.editVideo(videoId);
        } 
        // Option 2: Manuell ein Event auslösen, das vom Edit-Script abgefangen werden kann
        else {
          console.log("📋 Video-Feed: Löse Edit-Event aus für Video ID:", videoId);
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
    
    // Alle Video-Elemente auf einmal anhängen (effizientes DOM-Update)
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
    
    // Nach dem Rendern den Upload-Counter und Fortschrittsbalken aktualisieren
    this.updateUploadCounter(videos.length, maxUploads);
  }

// 🌐 Webflow API Integration für Video-Feed
// Vereinfachte Version

/**
 * Konfiguration für das Video-Feed-Skript
 */
const VIDEO_FEED_CONFIG = {
  API_BASE_URL: "https://api.webflow.com/v2/collections",
  WORKER_BASE_URL: "https://bewerbungen.oliver-258.workers.dev/?url=",
  MEMBER_COLLECTION_ID: "6448faf9c5a8a15f6cc05526", 
  VIDEO_COLLECTION_ID: "67d806e65cadcadf2f41e659",
  VIDEO_CONTAINER_ID: "video-feed",
  CACHE_DURATION: 5 * 60 * 1000 // 5 Minuten Cache
};

/**
 * Cache für API-Antworten
 */
class SimpleCache {
  constructor() {
    this.items = {};
  }

  get(key) {
    const item = this.items[key];
    if (!item) return null;
    
    // Prüfen ob abgelaufen
    if (Date.now() - item.timestamp > VIDEO_FEED_CONFIG.CACHE_DURATION) {
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
 * Haupt-App-Klasse für den Video-Feed
 */
class VideoFeedApp {
  constructor() {
    this.cache = new SimpleCache();
    this.videoContainer = null;
    console.log("📋 Video-Feed: Initialisiert");
  }

  /**
   * Worker-URL erstellen für Cross-Origin-Anfragen
   */
  buildWorkerUrl(apiUrl) {
    return `${VIDEO_FEED_CONFIG.WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
  }

  /**
   * API-Anfrage mit Retry-Logik
   */
  async fetchApi(url, retries = 2) {
    try {
      console.log("📋 Video-Feed: Anfrage an", url);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("📋 Video-Feed: API-Fehler", response.status, errorText);
        
        if (retries > 0) {
          console.log("📋 Video-Feed: Wiederhole Anfrage...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.fetchApi(url, retries - 1);
        }
        
        throw new Error(`API-Fehler: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (retries > 0) {
        console.log("📋 Video-Feed: Wiederhole nach Fehler...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchApi(url, retries - 1);
      }
      throw error;
    }
  }

  /**
   * User-Informationen anhand der Memberstack-ID abrufen
   */
  async getUserByMemberstackId(memberstackId) {
    if (!memberstackId) {
      throw new Error("Memberstack ID fehlt");
    }
    
    const cacheKey = `user_${memberstackId}`;
    const cachedUser = this.cache.get(cacheKey);
    
    if (cachedUser) {
      console.log("📋 Video-Feed: User aus Cache geladen", memberstackId);
      return cachedUser;
    }
    
    // API-Anfrage
    const filterQuery = `{"memberstack-id":{"eq":"${memberstackId}"}}`;
    const apiUrl = `${VIDEO_FEED_CONFIG.API_BASE_URL}/${VIDEO_FEED_CONFIG.MEMBER_COLLECTION_ID}/items?live=true&limit=1&filter=${encodeURIComponent(filterQuery)}`;
    const workerUrl = this.buildWorkerUrl(apiUrl);
    
    try {
      const data = await this.fetchApi(workerUrl);
      
      if (!data.items || data.items.length === 0) {
        console.warn("📋 Video-Feed: Kein User gefunden mit ID", memberstackId);
        return null;
      }
      
      const user = data.items[0];
      console.log("📋 Video-Feed: User gefunden", user.id);
      
      this.cache.set(cacheKey, user);
      return user;
    } catch (error) {
      console.error("📋 Video-Feed: Fehler beim Abrufen des Users", error);
      throw error;
    }
  }

  /**
   * Videos für einen bestimmten User abrufen
   */
  async getVideosByUserId(userId) {
    if (!userId) {
      throw new Error("User ID fehlt");
    }
    
    const cacheKey = `videos_${userId}`;
    const cachedVideos = this.cache.get(cacheKey);
    
    if (cachedVideos) {
      console.log("📋 Video-Feed: Videos aus Cache geladen", userId);
      return cachedVideos;
    }
    
    // API-Anfrage
    const filterQuery = `{"user-id":{"eq":"${userId}"}}`;
    const apiUrl = `${VIDEO_FEED_CONFIG.API_BASE_URL}/${VIDEO_FEED_CONFIG.VIDEO_COLLECTION_ID}/items?live=true&filter=${encodeURIComponent(filterQuery)}`;
    const workerUrl = this.buildWorkerUrl(apiUrl);
    
    try {
      const data = await this.fetchApi(workerUrl);
      
      if (!data.items || data.items.length === 0) {
        console.log("📋 Video-Feed: Keine Videos gefunden für User", userId);
        return [];
      }
      
      // Videos extrahieren
      const videos = data.items.map(item => ({
        "video-link": item.fieldData["video-link"],
        "video-name": item.fieldData["video-name"],
        "video-kategorie": item.fieldData["video-kategorie"]
      })).filter(video => video["video-link"]);
      
      console.log(`📋 Video-Feed: ${videos.length} Videos geladen`);
      
      this.cache.set(cacheKey, videos);
      return videos;
    } catch (error) {
      console.error("📋 Video-Feed: Fehler beim Abrufen der Videos", error);
      throw error;
    }
  }

  /**
   * Videos im Container anzeigen
   */
  renderVideos(videos) {
    if (!this.videoContainer) {
      console.error("📋 Video-Feed: Container nicht gefunden");
      return;
    }
    
    if (!videos || videos.length === 0) {
      this.videoContainer.innerHTML = "<p>🚫 Keine Videos gefunden.</p>";
      return;
    }
    
    this.videoContainer.innerHTML = "";
    
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
        videoElement.outerHTML = `
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
      
      // Kategorie
      const categoryP = document.createElement("p");
      categoryP.classList.add("is-txt-tiny");
      categoryP.textContent = `Kategorie: ${videoData["video-kategorie"] || "Nicht angegeben"}`;
      
      // Struktur zusammenfügen
      detailsContainerDiv.appendChild(titleDiv);
      detailsContainerDiv.appendChild(categoryP);
      detailsDiv.appendChild(detailsContainerDiv);
      
      wrapperDiv.appendChild(videoDiv);
      wrapperDiv.appendChild(detailsDiv);
      
      this.videoContainer.appendChild(wrapperDiv);
    });
  }
  
  /**
   * Ladeanimation anzeigen
   */
  showLoading() {
    if (!this.videoContainer) return;
    
    this.videoContainer.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Videos werden geladen...</p>
      </div>
    `;
  }
  
  /**
   * Fehlermeldung anzeigen
   */
  showError(message) {
    if (!this.videoContainer) return;
    
    this.videoContainer.innerHTML = `
      <div class="error-message">
        <p>🚫 ${message}</p>
      </div>
    `;
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
      
      this.showLoading();
      
      // Memberstack-User laden
      const member = await window.$memberstackDom.getCurrentMember();
      const memberstackId = member?.data?.id;
      
      if (!memberstackId) {
        this.showError("Kein eingeloggter User gefunden");
        return;
      }
      
      console.log("📋 Video-Feed: Eingeloggter User mit ID", memberstackId);
      
      // User-Daten laden
      const user = await this.getUserByMemberstackId(memberstackId);
      
      if (!user) {
        this.showError("User-Daten konnten nicht gefunden werden");
        return;
      }
      
      // Videos laden
      const userId = user.id;
      const videos = await this.getVideosByUserId(userId);
      
      // Videos anzeigen
      this.renderVideos(videos);
      
    } catch (error) {
      console.error("📋 Video-Feed: Fehler beim Laden der Videos", error);
      this.showError("Fehler beim Laden des Video-Feeds");
    }
  }

  /**
   * App initialisieren
   */
  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.videoContainer = document.getElementById(VIDEO_FEED_CONFIG.VIDEO_CONTAINER_ID);
      
      if (!this.videoContainer) {
        console.error("📋 Video-Feed: Container-Element nicht gefunden", VIDEO_FEED_CONFIG.VIDEO_CONTAINER_ID);
        return;
      }
      
      this.loadUserVideos();
    });
  }
}

// App starten
try {
  const videoFeedApp = new VideoFeedApp();
  videoFeedApp.init();
  
  // Für Debug-Zwecke global zugänglich machen
  window.videoFeedApp = videoFeedApp;
} catch (error) {
  console.error("📋 Video-Feed: Kritischer Fehler beim Start", error);
}

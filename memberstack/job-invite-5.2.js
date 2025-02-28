(function() {
    "use strict";

    // 🔧 Konfiguration
    const CONFIG = {
        API_BASE_URL: "https://api.webflow.com/v2/collections",
        WORKER_BASE_URL: "https://bewerbungen.oliver-258.workers.dev/?url=",
        USER_COLLECTION_ID: "6448faf9c5a8a15f6cc05526",
        JOB_COLLECTION_ID: "6448faf9c5a8a17455c05525",
        WEBHOOK_URL: "https://hooks.zapier.com/hooks/catch/10061116/23n4ylm/",
        DEBUG: true,
        DATA_ATTRIBUTES: {
            MODAL: "data-modal",
            MODAL_TITLE: "data-modal-title",
            JOB_SELECT: "job-select",
            INVITE_BUTTON: "data-invite-button",
            INVITE_SUBMIT: "data-invite-submit",
            MODAL_CLOSE: "data-modal-close",
            CREATOR_PROFILE: "creator-profile",
            USER_NAME: "data-user-name",
            USER_EMAIL: "data-user-email",
            MEMBERSTACK_ID: "data-memberstack-id",
            LOADER: "invite-loader",
            STATUS_MESSAGE: "invite-status-message"
        }
    };

    let cachedJobs = [];

    function logDebug(message, data = null) {
        if (CONFIG.DEBUG) {
            console.log(`🐛 DEBUG: ${message}`, data);
        }
    }

    function closeModal() {
        const modal = document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL}]`);
        if (modal) {
            modal.style.opacity = "0";
            modal.style.transform = "scale(0.95)";
            setTimeout(() => {
                modal.style.display = "none";
            }, 300);
        }
    }

    function showLoader() {
        const loaderWrapper = document.getElementById("loading-animation-wrapper");
        const successMessage = document.getElementById("loading-animation-success");
        
        // Erst Erfolgsmeldung ausblenden (falls vorhanden)
        if (successMessage && successMessage.style.display !== "none") {
            successMessage.style.opacity = "0";
            setTimeout(() => {
                successMessage.style.display = "none";
                
                // Dann Loader einblenden
                if (loaderWrapper) {
                    loaderWrapper.style.display = "flex";
                    loaderWrapper.style.opacity = "0";
                    setTimeout(() => {
                        loaderWrapper.style.opacity = "1";
                    }, 10);
                }
            }, 300);
        } else {
            // Direkt Loader einblenden
            if (loaderWrapper) {
                loaderWrapper.style.display = "flex";
                loaderWrapper.style.opacity = "0";
                setTimeout(() => {
                    loaderWrapper.style.opacity = "1";
                }, 10);
            }
        }
    }

    function hideLoader() {
        const loaderWrapper = document.getElementById("loading-animation-wrapper");
        if (loaderWrapper) {
            loaderWrapper.style.opacity = "0";
            setTimeout(() => {
                loaderWrapper.style.display = "none";
            }, 300);
        }
    }

    function updateStatusMessage(message, autoHide = false) {
        const successMessage = document.getElementById("loading-animation-success");
        const loaderWrapper = document.getElementById("loading-animation-wrapper");
        
        if (successMessage) {
            // Erst Loader ausblenden
            if (loaderWrapper && loaderWrapper.style.display !== "none") {
                loaderWrapper.style.opacity = "0";
                setTimeout(() => {
                    loaderWrapper.style.display = "none";
                    
                    // Dann Erfolgsmeldung einblenden
                    successMessage.style.display = "block";
                    successMessage.style.opacity = "0";
                    setTimeout(() => {
                        successMessage.style.opacity = "1";
                    }, 10);
                }, 300);
            } else {
                // Direkt Erfolgsmeldung einblenden
                successMessage.style.display = "block";
                successMessage.style.opacity = "0";
                setTimeout(() => {
                    successMessage.style.opacity = "1";
                }, 10);
            }
            
            if (autoHide) {
                setTimeout(() => {
                    successMessage.style.opacity = "0";
                    setTimeout(() => {
                        successMessage.style.display = "none";
                    }, 300);
                }, 7000);
            }
        }
    }

    async function fetchUserJobs(memberId) {
        try {
            logDebug("Fetching jobs for user", memberId);
            const response = await fetch(`${CONFIG.WORKER_BASE_URL}${CONFIG.API_BASE_URL}/${CONFIG.USER_COLLECTION_ID}/items/${memberId}/live`);
            if (!response.ok) throw new Error(`API-Fehler: ${response.status}`);
            const userData = await response.json();
            return userData?.fieldData?.["posted-jobs"] || [];
        } catch (error) {
            console.error(`❌ Fehler beim Abrufen der Jobs: ${error.message}`);
            return [];
        }
    }

    async function fetchJobDetails(jobId) {
        try {
            logDebug("Fetching job details", jobId);
            const response = await fetch(`${CONFIG.WORKER_BASE_URL}${CONFIG.API_BASE_URL}/${CONFIG.JOB_COLLECTION_ID}/items/${jobId}/live`);
            if (!response.ok) throw new Error(`API-Fehler: ${response.status}`);
            const jobData = await response.json();
            return jobData?.fieldData || {};
        } catch (error) {
            console.error(`❌ Fehler beim Abrufen der Job-Details: ${error.message}`);
            return {};
        }
    }

    async function preloadUserJobs() {
        try {
            logDebug("Preloading user jobs...");
            const member = await window.$memberstackDom.getCurrentMember();
            const memberId = member?.data?.customFields?.['webflow-member-id'];
            if (!memberId) throw new Error("Kein 'webflow-member-id' gefunden.");
            
            const jobIds = await fetchUserJobs(memberId);
            cachedJobs = (await Promise.all(jobIds.map(fetchJobDetails)))
                .filter(job => new Date(job["job-date-end"]) > new Date()); // Nur aktive Jobs
            logDebug("Preloading completed", cachedJobs);
        } catch (error) {
            console.error("❌ Fehler beim Vorladen der Jobs:", error);
        }
    }

    function renderInviteModal() {
        // Stellen wir sicher, dass die Jobs geladen sind
        if (cachedJobs.length === 0) {
            // Wenn keine Jobs im Cache, versuchen wir sie erneut zu laden
            logDebug("Keine Jobs im Cache, lade sie erneut...");
            preloadUserJobs().then(() => {
                // Erst nach dem Laden die Modal anzeigen
                showInviteModalWithJobs();
            });
        } else {
            // Direkt Modal anzeigen, wenn Jobs bereits geladen sind
            showInviteModalWithJobs();
        }
    }
    
    // Globale Variable für den aktuell ausgewählten Job
    let selectedJob = null;
    
    // Hilfsfunktion zum Kürzen von langen Texten
    function truncateText(text, maxLength = 40) {
        if (!text) return "";
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    }
    
    function showInviteModalWithJobs() {
        logDebug("Rendering modal with jobs", cachedJobs);
        const modal = document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL}]`);
        const modalTitle = modal?.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL_TITLE}]`);
        const jobDropdown = document.querySelector(`.db-invite-job-dropdown`);
        const jobDropdownList = jobDropdown?.querySelector(`.db-invite-job-dropdown-list`);
        const dropdownToggle = jobDropdown?.querySelector(".db-invite-job-dropdown-toggle");
        const modalContent = document.querySelector(".db-invite-job-modal");

        if (!modal || !modalTitle || !jobDropdown || !jobDropdownList || !dropdownToggle) {
            console.error("❌ Modal-Elemente fehlen");
            return;
        }

        // Modal Title setzen
        modalTitle.textContent = document.getElementById(CONFIG.DATA_ATTRIBUTES.CREATOR_PROFILE).getAttribute(CONFIG.DATA_ATTRIBUTES.USER_NAME);

        // Reset selected job
        selectedJob = null;
        
        // Aktualisiere Dropdown Toggle Text
        dropdownToggle.textContent = "-- Job auswählen --";

        // Dropdown-Liste mit gekürzten Namen aktualisieren
        jobDropdownList.innerHTML = "";
        cachedJobs.forEach(job => {
            const listItem = document.createElement("div");
            listItem.className = "db-invite-job-dropdown-list-item";
            listItem.dataset.jobSlug = job.slug;
            
            const namePart = document.createElement("div");
            namePart.className = "db-invite-job-dropdown-list-name";
            namePart.textContent = truncateText(job.name, 40);
            namePart.title = job.name; // Tooltip für langen Text
            
            const checkmarkImg = document.createElement("img");
            checkmarkImg.src = "https://cdn.prod.website-files.com/63db7d558cd2e4be56cd7e2f/63e0e3c2ad00f752f0270740_check-dark.svg";
            checkmarkImg.alt = "Ausgewählt";
            checkmarkImg.className = "job-checkmark";
            checkmarkImg.style.display = "none"; // Standard: nicht anzeigen
            checkmarkImg.style.width = "16px";
            checkmarkImg.style.marginLeft = "8px";
            
            listItem.appendChild(namePart);
            listItem.appendChild(checkmarkImg);
            
            // Klick-Handler für Listenelement
            listItem.addEventListener("click", () => {
                // Alle Checkmarks ausblenden
                jobDropdownList.querySelectorAll(".job-checkmark").forEach(checkmark => {
                    checkmark.style.display = "none";
                });
                
                // Diesen Checkmark anzeigen
                checkmarkImg.style.display = "inline-block";
                
                // Ausgewählten Job setzen
                selectedJob = job;
                
                // Dropdown-Toggle aktualisieren
                dropdownToggle.textContent = truncateText(job.name, 40);
                
                // Dropdown nach Auswahl schließen
                jobDropdownList.style.display = "none";
            });
            
            jobDropdownList.appendChild(listItem);
        });
        
        // Berechne die Gesamthöhe des Dropdowns basierend auf der Anzahl der Jobs
        // Da jedes Item 3.25em hoch ist
        const itemHeight = 3.25; // in em
        const dropdownHeight = Math.min(cachedJobs.length, 5) * itemHeight; // Maximal 5 Items zeigen
        
        // Klick-Handler für Toggle (Dropdown öffnen/schließen)
        dropdownToggle.addEventListener("click", (e) => {
            e.preventDefault();
            
            if (modalContent) {
                const isVisible = jobDropdownList.style.display === "block";
                
                if (isVisible) {
                    // Dropdown wird geschlossen
                    jobDropdownList.style.display = "none";
                    
                    if (modalContent.style.height) {
                        modalContent.style.transition = "height 0.3s ease";
                        modalContent.style.height = `${parseFloat(modalContent.style.height) - dropdownHeight}em`;
                        
                        setTimeout(() => {
                            modalContent.style.height = "";
                            modalContent.style.transition = "";
                        }, 300);
                    }
                } else {
                    // Dropdown wird geöffnet
                    jobDropdownList.style.display = "block";
                    
                    // Aktuelle Höhe in em berechnen (16px = 1em als Standardwert)
                    const currentHeightInPx = modalContent.offsetHeight;
                    const baseFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
                    const currentHeightInEm = currentHeightInPx / baseFontSize;
                    
                    modalContent.style.transition = "height 0.3s ease";
                    modalContent.style.height = `${currentHeightInEm}em`;
                    
                    // Nach einem kleinen Delay die neue Höhe setzen
                    setTimeout(() => {
                        modalContent.style.height = `${currentHeightInEm + dropdownHeight}em`;
                        
                        // Nach der Animation die Höhe wieder auf auto setzen
                        setTimeout(() => {
                            modalContent.style.height = "";
                            modalContent.style.transition = "";
                        }, 300);
                    }, 10);
                }
            } else {
                // Fallback, wenn kein modalContent gefunden wurde
                jobDropdownList.style.display = jobDropdownList.style.display === "block" ? "none" : "block";
            }
        });
        
        // Klick außerhalb des Dropdowns schließt es
        document.addEventListener("click", (e) => {
            if (!jobDropdown.contains(e.target) && jobDropdownList.style.display === "block") {
                jobDropdownList.style.display = "none";
                
                if (modalContent && modalContent.style.height) {
                    modalContent.style.transition = "height 0.3s ease";
                    modalContent.style.height = `${parseFloat(modalContent.style.height) - dropdownHeight}em`;
                    
                    setTimeout(() => {
                        modalContent.style.height = "";
                        modalContent.style.transition = "";
                    }, 300);
                }
            }
        });

        // Verstecke vorhandene Loading-Elemente
        hideLoader();
        const successMessage = document.getElementById("loading-animation-success");
        if (successMessage) {
            successMessage.style.display = "none";
            successMessage.style.opacity = "0";
        }

        modal.style.display = "flex";
        modal.style.opacity = "0";
        modal.style.transform = "scale(0.95)";
        setTimeout(() => {
            modal.style.opacity = "1";
            modal.style.transform = "scale(1)";
            modal.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        }, 10);
        logDebug("Modal sichtbar gemacht", cachedJobs.length);
    }

    async function sendInvite() {
        // Überprüfen, ob ein Job ausgewählt wurde
        if (!selectedJob) {
            alert("Bitte wähle einen Job aus.");
            return;
        }

        showLoader();

        const userProfile = document.getElementById(CONFIG.DATA_ATTRIBUTES.CREATOR_PROFILE);

        const userData = {
            userName: userProfile.getAttribute(CONFIG.DATA_ATTRIBUTES.USER_NAME),
            userEmail: userProfile.getAttribute(CONFIG.DATA_ATTRIBUTES.USER_EMAIL),
            memberstackId: userProfile.getAttribute(CONFIG.DATA_ATTRIBUTES.MEMBERSTACK_ID),
            jobId: selectedJob.slug,
            jobName: selectedJob.name
        };

        logDebug("📤 Sende Einladung mit folgenden Daten:", userData);

        try {
            const response = await fetch(CONFIG.WEBHOOK_URL, {
                method: "POST",
                headers: { }, // Leere Header wie im Original
                body: JSON.stringify(userData)
            });

            if (!response.ok) throw new Error(`Server-Antwort: ${response.status}`);
            
            updateStatusMessage("Vielen Dank! Die Einladung wurde an den Creator gesendet.", true);
            logDebug("Webhook-Anfrage erfolgreich gesendet", response);
        } catch (error) {
            console.error("❌ Fehler beim Senden der Einladung:", error);
            hideLoader();
            alert("Fehler beim Senden der Einladung. Bitte versuche es erneut.");
        }
    }

    // Erstellen des Loaders im DOM ist nicht mehr nötig,
    // da wir bestehende HTML-Elemente verwenden
    
    window.addEventListener("DOMContentLoaded", () => {
        preloadUserJobs();
        document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.INVITE_BUTTON}]`)?.addEventListener("click", renderInviteModal);
        document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.INVITE_SUBMIT}]`)?.addEventListener("click", sendInvite);
        document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL_CLOSE}]`)?.addEventListener("click", closeModal);
        
        // Füge CSS nur für Animationen der Loading-Elemente hinzu
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            #loading-animation-wrapper,
            #loading-animation-success {
                transition: opacity 0.3s ease;
            }
        `;
        document.head.appendChild(styleEl);
        
        // Verstecke Loading-Elemente beim Start
        const loaderWrapper = document.getElementById("loading-animation-wrapper");
        const successMessage = document.getElementById("loading-animation-success");
        
        if (loaderWrapper) {
            loaderWrapper.style.display = "none";
            loaderWrapper.style.opacity = "0";
        }
        
        if (successMessage) {
            successMessage.style.display = "none";
            successMessage.style.opacity = "0";
        }
    });
})();

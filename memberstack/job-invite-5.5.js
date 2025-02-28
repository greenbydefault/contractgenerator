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
    
    // Hilfsfunktion zum Kürzen von langen Texten
    function truncateText(text, maxLength = 40) {
        if (!text) return "";
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    }
    
    function showInviteModalWithJobs() {
        logDebug("Rendering modal with jobs", cachedJobs);
        const modal = document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL}]`);
        const modalTitle = modal?.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL_TITLE}]`);
        const jobSelect = modal?.querySelector(`#${CONFIG.DATA_ATTRIBUTES.JOB_SELECT}`);

        if (!modal || !modalTitle || !jobSelect) {
            console.error("❌ Modal-Elemente fehlen");
            return;
        }

        // Modal Title setzen nur mit dem Datenattribut
        const userName = document.querySelector('[data-user-name]')?.getAttribute('data-user-name');
        if (userName) {
            modalTitle.textContent = userName;
        }

        // Job-Auswahlfeld mit gekürzten Namen aktualisieren
        jobSelect.innerHTML = `<option value="">-- Job auswählen --</option>` + 
            cachedJobs.map(job => `<option value="${job.slug}" title="${job.name}">${truncateText(job.name, 40)}</option>`).join("");

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
        showLoader();

        // Sammle nur Name und Email direkt von den Elementen mit den entsprechenden Attributen
        const userName = document.querySelector('[data-user-name]')?.getAttribute('data-user-name');
        const userEmail = document.querySelector('[data-user-email]')?.getAttribute('data-user-email');

        const jobSelect = document.getElementById(CONFIG.DATA_ATTRIBUTES.JOB_SELECT);
        const selectedJobSlug = jobSelect.value;
        const selectedJobName = jobSelect.options[jobSelect.selectedIndex]?.text || "";

        if (!selectedJobSlug) {
            hideLoader();
            alert("Bitte wähle einen Job aus.");
            return;
        }

        if (!userName || !userEmail) {
            hideLoader();
            alert("Benutzerdaten konnten nicht gefunden werden.");
            return;
        }

        const userData = {
            userName: userName,
            userEmail: userEmail,
            jobId: selectedJobSlug,
            jobName: selectedJobName
        };

        logDebug("📤 Sende Einladung mit folgenden Daten:", userData);

        try {
            // Webhook-Anfrage senden
            const response = await fetch(CONFIG.WEBHOOK_URL, {
                method: "POST",
                headers: { }, // Leere Header wie im Original
                body: JSON.stringify(userData)
            });

            if (!response.ok) throw new Error(`Server-Antwort: ${response.status}`);
            
            // Loader noch für zusätzliche Zeit anzeigen (insgesamt 4 Sekunden)
            setTimeout(() => {
                updateStatusMessage("Vielen Dank! Die Einladung wurde an den Creator gesendet.", true);
                logDebug("Webhook-Anfrage erfolgreich gesendet", response);
            }, 4000);
        } catch (error) {
            console.error("❌ Fehler beim Senden der Einladung:", error);
            
            // Auch bei Fehler den Loader für 4 Sekunden anzeigen
            setTimeout(() => {
                hideLoader();
                alert("Fehler beim Senden der Einladung. Bitte versuche es erneut.");
            }, 4000);
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

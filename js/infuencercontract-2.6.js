document.addEventListener('DOMContentLoaded', function() {
    // Integration mit dem vorhandenen PDF-Generator
    function setupPDFGenerator() {
        // Wir stellen sicher, dass unsere Version der Funktion mit der externen Funktion verbunden wird
        window.generatePDFContract = function() {
            console.log("Rufe externe PDF-Generierung auf");
            try {
                // Prüfen, welche PDF-Funktion verfügbar ist und diese aufrufen
                if (typeof window.generatePDF === 'function') {
                    window.generatePDF();
                    return true;
                } else if (window.jsPDF && typeof window.jsPDF === 'function') {
                    // Wenn jsPDF als Funktion verfügbar ist
                    if (typeof generatePDF === 'function') {
                        generatePDF();
                        return true;
                    }
                }
                
                // Wenn keine bekannte Funktion gefunden wurde, geben wir eine Fehlermeldung aus
                console.error("Keine PDF-Generierungsfunktion gefunden");
                alert("Die PDF-Generierungsfunktion konnte nicht gefunden werden. Bitte kontaktieren Sie den Support.");
                return false;
            } catch (error) {
                console.error("Fehler bei der PDF-Generierung:", error);
                alert("Bei der Generierung des Vertrags ist ein Fehler aufgetreten: " + error.message);
                return false;
            }
        };
    }
    
    // PDF-Generator Setup ausführen
    setupPDFGenerator();

    // Event-Listener für die Vertragstyp-Auswahl
    const contractTypeSelect = document.getElementById('contract-type');
    const clientInfoSection = document.getElementById('client-info-section');
    
    if (contractTypeSelect && clientInfoSection) {
        // Initial Zustand setzen
        clientInfoSection.style.display = contractTypeSelect.value === 'client' ? 'block' : 'none';
        
        // Event-Listener für Änderungen
        contractTypeSelect.addEventListener('change', function() {
            clientInfoSection.style.display = this.value === 'client' ? 'block' : 'none';
            updateProgress(); // Fortschrittsanzeige aktualisieren
            validateCurrentStep(currentStep); // Validierung aktualisieren
        });
    }

    // Plattform-Checkboxen und entsprechende Detail-Felder
    const platformInstagram = document.getElementById('platform-instagram');
    const instagramDetails = document.getElementById('instagram-details');
    
    const platformTikTok = document.getElementById('platform-tiktok');
    const tiktokDetails = document.getElementById('tiktok-details');
    
    const platformYoutube = document.getElementById('platform-youtube');
    const youtubeDetails = document.getElementById('youtube-details');
    
    const platformOther = document.getElementById('platform-other');
    const otherDetails = document.getElementById('other-details');

    // Event-Listener für Plattform-Checkboxen
    if (platformInstagram && instagramDetails) {
        platformInstagram.addEventListener('change', function() {
            instagramDetails.classList.toggle('hidden', !this.checked);
            updateProgress();
        });
    }
    
    if (platformTikTok && tiktokDetails) {
        platformTikTok.addEventListener('change', function() {
            tiktokDetails.classList.toggle('hidden', !this.checked);
            updateProgress();
        });
    }
    
    if (platformYoutube && youtubeDetails) {
        platformYoutube.addEventListener('change', function() {
            youtubeDetails.classList.toggle('hidden', !this.checked);
            updateProgress();
        });
    }
    
    if (platformOther && otherDetails) {
        platformOther.addEventListener('change', function() {
            otherDetails.classList.toggle('hidden', !this.checked);
            updateProgress();
        });
    }

    // Media Buyout Optionen
    const mediaBuyoutYes = document.getElementById('media-buyout-yes');
    const mediaBuyoutDetails = document.getElementById('media-buyout-details');
    
    if (mediaBuyoutYes && mediaBuyoutDetails) {
        // Initialen Zustand setzen
        mediaBuyoutDetails.classList.toggle('hidden', !mediaBuyoutYes.checked);
        
        // Event-Listener für Änderungen
        mediaBuyoutYes.addEventListener('change', function() {
            mediaBuyoutDetails.classList.toggle('hidden', !this.checked);
            updateProgress();
        });
        
        // Auch für das "Nein" Radio-Button, um korrekt zu aktualisieren
        const mediaBuyoutNo = document.getElementById('media-buyout-no');
        if (mediaBuyoutNo) {
            mediaBuyoutNo.addEventListener('change', function() {
                mediaBuyoutDetails.classList.toggle('hidden', !mediaBuyoutYes.checked);
                updateProgress();
            });
        }
    }

    // Zusätzliche Vergütung
    const additionalYes = document.getElementById('additional-yes');
    const additionalDetails = document.getElementById('additional-comp-details');
    
    if (additionalYes && additionalDetails) {
        // Initialen Zustand setzen
        additionalDetails.classList.toggle('hidden', !additionalYes.checked);
        
        // Event-Listener für Änderungen
        additionalYes.addEventListener('change', function() {
            additionalDetails.classList.toggle('hidden', !this.checked);
            updateProgress();
        });
        
        // Auch für das "Nein" Radio-Button
        const additionalNo = document.getElementById('additional-no');
        if (additionalNo) {
            additionalNo.addEventListener('change', function() {
                additionalDetails.classList.toggle('hidden', !additionalYes.checked);
                updateProgress();
            });
        }
    }

    // Fortschrittsleiste und Schritte
    const progressSteps = document.querySelectorAll('.progress-step');
    const formSections = document.querySelectorAll('.form-section');
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const progressMessage = document.getElementById('progress-message');

    // Globale Variable für den aktuellen Schritt
    let currentStep = 1;
    
    // Globale Variable, um zu verhindern, dass mehrere Navigationen gleichzeitig stattfinden
    let navigationInProgress = false;

    // Event-Listener für Klicks auf die Fortschrittsschritte hinzufügen (direkte Navigation)
    progressSteps.forEach(step => {
        step.addEventListener('click', function() {
            if (navigationInProgress) return; // Verhindere mehrfache Navigationen
            navigationInProgress = true;
            
            const stepNum = parseInt(this.getAttribute('data-step'));
            
            // Bei Klick auf aktiven Schritt nichts tun
            if (stepNum === currentStep) {
                navigationInProgress = false;
                return;
            }
            
            // Zu früheren Schritten kann man immer navigieren
            if (stepNum < currentStep) {
                goToStep(stepNum);
                navigationInProgress = false;
                return;
            }
            
            // Für vorwärts: prüfe alle vorherigen Schritte
            if (validateStepsRange(1, currentStep)) {
                goToStep(stepNum);
            } else {
                // Fehlende Felder visuell markieren
                markInvalidFields(currentStep);
                showValidationError();
            }
            navigationInProgress = false;
        });
    });

    // Event-Listener für "Weiter"-Buttons
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (navigationInProgress) return;
            navigationInProgress = true;
            
            const nextStep = parseInt(this.getAttribute('data-next'));
            
            // Der Button sollte deaktiviert sein, wenn der aktuelle Schritt nicht gültig ist
            if (!validateCurrentStep(currentStep)) {
                markInvalidFields(currentStep);
                showValidationError();
                navigationInProgress = false;
                return;
            }
            
            goToStep(nextStep);
            navigationInProgress = false;
        });
    });

    // Initial alle "Weiter"-Buttons validieren
    function checkAllNextButtons() {
        nextButtons.forEach(button => {
            const stepNum = parseInt(button.getAttribute('data-next')) - 1;
            updateButtonState(button, validateCurrentStep(stepNum));
        });
    }

    // Event-Listener für "Zurück"-Buttons
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (navigationInProgress) return;
            navigationInProgress = true;
            
            const prevStep = parseInt(this.getAttribute('data-prev'));
            goToStep(prevStep);
            navigationInProgress = false;
        });
    });

    // Funktion, um Fehler von nicht ausgefüllten Pflichtfeldern anzuzeigen
    function showValidationError() {
        alert('Bitte fülle alle markierten Pflichtfelder aus.');
    }

    // Funktion zum Markieren ungültiger Felder im aktuellen Schritt
    function markInvalidFields(stepNumber) {
        const currentSection = document.getElementById(`step-${stepNumber}`);
        if (!currentSection) return;
        
        const requiredFields = currentSection.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                field.classList.add('shake');
                field.style.borderColor = 'red';
                
                // Animation nach Abschluss entfernen
                setTimeout(() => {
                    field.classList.remove('shake');
                }, 500);
            } else {
                field.classList.remove('error');
                field.style.borderColor = '';
            }
        });
    }

    // Aktualisiere den Zustand des Buttons (aktiviert/deaktiviert)
    function updateButtonState(button, isValid) {
        if (isValid) {
            button.disabled = false;
            button.classList.remove('btn-disabled');
        } else {
            button.disabled = true;
            button.classList.add('btn-disabled');
        }
    }

    // Funktion zur Validierung des aktuellen Schritts
    function validateCurrentStep(stepNumber) {
        const currentSection = document.getElementById(`step-${stepNumber}`);
        if (!currentSection) return true; // Wenn Abschnitt nicht gefunden, als gültig betrachten
        
        // Finde alle Next-Buttons für diesen Schritt
        const nextButton = document.querySelector(`.next-step[data-next="${stepNumber + 1}"]`);
        
        const requiredFields = currentSection.querySelectorAll('[required]');
        let allValid = true;
        
        // Überprüfe alle Pflichtfelder im aktuellen Schritt
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                allValid = false;
                field.classList.add('error');
                field.style.borderColor = 'red';
            } else {
                field.classList.remove('error');
                field.style.borderColor = '';
            }
        });
        
        // Button-Status aktualisieren
        if (nextButton) {
            updateButtonState(nextButton, allValid);
        }
        
        return allValid;
    }

    // Funktion zur Validierung eines Bereichs von Schritten
    function validateStepsRange(startStep, endStep) {
        for (let i = startStep; i <= endStep; i++) {
            if (!validateCurrentStep(i)) {
                return false;
            }
        }
        return true;
    }

    // Funktion zum Wechseln der Schritte
    function goToStep(stepNumber) {
        // Aktuellen Schritt aktualisieren
        currentStep = stepNumber;
        
        // Alle Abschnitte ausblenden
        formSections.forEach(section => {
            section.classList.add('hidden');
        });
        
        // Aktiven Schritt in der Fortschrittsleiste markieren
        progressSteps.forEach(step => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            step.classList.toggle('active', stepNum <= stepNumber);
            step.classList.toggle('completed', stepNum < stepNumber);
        });
        
        // Gewünschten Abschnitt anzeigen
        const targetSection = document.getElementById(`step-${stepNumber}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Fortschrittsanzeige aktualisieren
        updateProgress();
        
        // Status aller Weiter-Buttons aktualisieren
        nextButtons.forEach(button => {
            const buttonStepNum = parseInt(button.getAttribute('data-next')) - 1;
            if (buttonStepNum === currentStep) {
                validateCurrentStep(currentStep);
            }
        });
        
        // Zum Anfang des Formulars scrollen
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Fortschrittsanzeige aktualisieren
    function updateProgress() {
        // Prozentwert basierend auf aktuellem Schritt berechnen (9 Schritte insgesamt)
        const percentage = Math.min(Math.floor((currentStep / 9) * 100), 100);
        
        // Fortschrittsbalken aktualisieren
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${percentage}% ausgefüllt`;
        }
        
        // Fortschrittsnachricht aktualisieren
        updateProgressMessage(currentStep);
        
        // Für die Vorschau im letzten Schritt
        if (currentStep === 9) {
            updatePreview();
        }
    }

    // Fortschrittsnachricht je nach Schritt aktualisieren
    function updateProgressMessage(stepNumber) {
        if (!progressMessage) return;
        
        const messages = [
            "Lass uns anfangen!",
            "Gut gemacht! Weiter geht's mit den Influencer-Daten.",
            "Perfekt! Jetzt zu den Plattformen.",
            "Super! Welche Inhalte sollen erstellt werden?",
            "Prima! Gibt es zusätzliche Vereinbarungen?",
            "Sehr gut! Klären wir die Rechte und Nutzung.",
            "Fast geschafft! Jetzt zur Produktion.",
            "Letzte Details zur Vergütung.",
            "Alles klar! Überprüfe den Vertrag und generiere ihn."
        ];
        
        progressMessage.textContent = messages[stepNumber - 1] || "Lass uns anfangen!";
    }

    // Funktion zur Berechnung des tatsächlichen Fortschritts basierend auf ausgefüllten Feldern
    function calculateRealProgress() {
        // Zähle die ausgefüllten Pflichtfelder
        const requiredFields = document.querySelectorAll('[required]');
        let filledRequiredFields = 0;
        
        requiredFields.forEach(field => {
            if (field.value) {
                filledRequiredFields++;
            }
        });
        
        // Berechne den Prozentsatz (Vermeiden von Division durch Null)
        if (requiredFields.length === 0) return 100;
        return Math.floor((filledRequiredFields / requiredFields.length) * 100);
    }

    // Die Vorschau-Funktion wird unverändert beibehalten

    // Vorschau im letzten Schritt aktualisieren
    function updatePreview() {
        // Unternehmensdaten
        try {
            document.getElementById('preview-company-name').textContent = document.getElementById('company-name').value || '[Name des Unternehmens]';
            document.getElementById('preview-company-contact').textContent = document.getElementById('company-contact').value || '[Ansprechpartner]';
            document.getElementById('preview-company-street').textContent = document.getElementById('company-street').value || '[Straße]';
            document.getElementById('preview-company-number').textContent = document.getElementById('company-number').value || '[Hausnummer]';
            document.getElementById('preview-company-zip').textContent = document.getElementById('company-zip').value || '[PLZ]';
            document.getElementById('preview-company-city').textContent = document.getElementById('company-city').value || '[Stadt]';
            document.getElementById('preview-company-country').textContent = document.getElementById('company-country').value || '[Land]';
            
            // Influencer-Daten
            document.getElementById('preview-influencer-name').textContent = document.getElementById('influencer-name').value || '[Name des Influencers]';
            document.getElementById('preview-influencer-street').textContent = document.getElementById('influencer-street').value || '[Straße]';
            document.getElementById('preview-influencer-number').textContent = document.getElementById('influencer-number').value || '[Hausnummer]';
            document.getElementById('preview-influencer-zip').textContent = document.getElementById('influencer-zip').value || '[PLZ]';
            document.getElementById('preview-influencer-city').textContent = document.getElementById('influencer-city').value || '[Stadt]';
            document.getElementById('preview-influencer-country').textContent = document.getElementById('influencer-country').value || '[Land]';
            
            // Kundensektion je nach Vertragstyp anzeigen
            const isClientContract = document.getElementById('contract-type').value === 'client';
            const previewClientSection = document.getElementById('preview-client-section');
            previewClientSection.classList.toggle('hidden', !isClientContract);
            
            if (isClientContract) {
                const clientName = document.getElementById('client-name').value || '[Name des Kunden]';
                const clientAddress = document.getElementById('client-address').value || '[Adresse des Kunden]';
                document.getElementById('preview-client-info').textContent = `${clientName}, ${clientAddress}`;
            }
            
            // Plattformen anzeigen
            let platformsHtml = '';
            if (document.getElementById('platform-instagram').checked) {
                const username = document.getElementById('instagram-username').value || '[@nutzername]';
                platformsHtml += `<p>✓ Instagram (Profil: ${username})</p>`;
            }
            if (document.getElementById('platform-tiktok').checked) {
                const username = document.getElementById('tiktok-username').value || '[@nutzername]';
                platformsHtml += `<p>✓ TikTok (Profil: ${username})</p>`;
            }
            if (document.getElementById('platform-youtube').checked) {
                const url = document.getElementById('youtube-url').value || '[URL]';
                platformsHtml += `<p>✓ YouTube (Profil: ${url})</p>`;
            }
            if (document.getElementById('platform-other').checked) {
                const platform = document.getElementById('other-platform').value || '[frei eintragen]';
                platformsHtml += `<p>✓ Sonstiges: ${platform}</p>`;
            }
            document.getElementById('preview-platforms').innerHTML = platformsHtml || '<p>Keine Plattformen ausgewählt</p>';
            
            // Inhaltstypen anzeigen
            let contentTypesHtml = '';
            const storySlides = document.getElementById('story-slides').value;
            const reelsTiktok = document.getElementById('reels-tiktok').value;
            const feedPosts = document.getElementById('feed-posts').value;
            const youtubeVideos = document.getElementById('youtube-videos').value;
            
            if (parseInt(storySlides) > 0) contentTypesHtml += `<li>Story-Slides: ${storySlides}</li>`;
            if (parseInt(reelsTiktok) > 0) contentTypesHtml += `<li>Instagram Reels / TikTok Videos: ${reelsTiktok}</li>`;
            if (parseInt(feedPosts) > 0) contentTypesHtml += `<li>Feed-Posts (Bild/Karussell): ${feedPosts}</li>`;
            if (parseInt(youtubeVideos) > 0) contentTypesHtml += `<li>YouTube Videos: ${youtubeVideos}</li>`;
            
            document.getElementById('preview-content-types').innerHTML = contentTypesHtml || '<li>Keine Inhalte spezifiziert</li>';
            
            // Weitere Vorschau-Aktualisierungen...
            
            // Aktualisiere die Fortschrittsanzeige mit dem tatsächlichen Fortschritt
            const realProgress = calculateRealProgress();
            if (progressFill) {
                progressFill.style.width = `${realProgress}%`;
            }
            if (progressText) {
                progressText.textContent = `${realProgress}% ausgefüllt`;
            }
            
        } catch (error) {
            console.error("Fehler bei der Aktualisierung der Vorschau:", error);
        }
    }

    // Hilfsfunktion zum Formatieren von Datumsangaben
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE');
    }

    // Generieren-Button
    const generateButton = document.getElementById('generate-contract');
    if (generateButton) {
        generateButton.addEventListener('click', function() {
            // Validierung aller Schritte vor der PDF-Generierung
            if (validateStepsRange(1, 9)) {
                console.log('Vertrag wird generiert...');
                
                // Aufrufen der PDF-Generierungsfunktion
                if (window.generatePDFContract()) {
                    showSuccessAnimation();
                }
            } else {
                // Validierung fehlgeschlagen - Zum ersten ungültigen Schritt navigieren
                for (let i = 1; i <= 9; i++) {
                    if (!validateCurrentStep(i)) {
                        goToStep(i);
                        markInvalidFields(i);
                        showValidationError();
                        break;
                    }
                }
            }
        });
    }

    // Erfolgsanimation anzeigen
    function showSuccessAnimation() {
        const successAnimation = document.getElementById('success-animation');
        if (successAnimation) {
            successAnimation.classList.remove('hidden');
        }
    }

    // Download-Button in der Erfolgsanimation
    const downloadButton = document.getElementById('download-button');
    if (downloadButton) {
        downloadButton.addEventListener('click', function() {
            // Erfolgsanimation ausblenden
            const successAnimation = document.getElementById('success-animation');
            if (successAnimation) {
                successAnimation.classList.add('hidden');
            }
        });
    }

    // Event-Listener für Input-Felder - um die Error-Klasse zu entfernen und Buttons zu aktualisieren
    document.querySelectorAll('[required]').forEach(field => {
        field.addEventListener('input', function() {
            if (this.value.trim()) {
                this.classList.remove('error');
                this.style.borderColor = '';
            } else {
                this.classList.add('error');
                this.style.borderColor = 'red';
            }
            // Überprüfe den Button-Status für den aktuellen Schritt
            validateCurrentStep(currentStep);
            updateProgress();
        });
    });

    // CSS für die Seitenleiste, verbesserte Schrittanzeige und deaktivierte Buttons
    const style = document.createElement('style');
    style.textContent = `
        .container {
            display: flex;
            width: 100%;
        }
        
        .sidebar {
            width: 240px;
            padding: 20px;
            background-color: #f9fafb;
            border-right: 1px solid #e5e7eb;
            min-height: 100vh;
            position: sticky;
            top: 0;
        }
        
        .main-content {
            flex: 1;
            padding: 20px;
        }
        
        .progress-step {
            cursor: pointer;
            transition: transform 0.2s ease;
            display: flex;
            align-items: center;
            padding: 10px 0;
            margin-bottom: 10px;
            position: relative;
        }
        
        .progress-step.active .step-indicator {
            background-color: var(--color-primary);
            color: white;
        }
        
        .progress-step.completed .step-indicator {
            background-color: var(--color-success-dark);
            color: white;
        }
        
        .progress-step .step-indicator {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background-color: #e5e7eb;
            color: #6b7280;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 10px;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        
        .progress-step .step-title {
            font-size: 14px;
            color: #6b7280;
            transition: all 0.3s ease;
        }
        
        .progress-step.active .step-title {
            color: var(--color-primary);
            font-weight: 600;
        }
        
        .progress-step.completed .step-title {
            color: var(--color-success-dark);
        }
        
        .progress-step:not(:last-child)::after {
            content: '';
            position: absolute;
            left: 14px;
            top: 38px;
            height: 20px;
            width: 2px;
            background-color: #e5e7eb;
            z-index: 1;
        }
        
        .progress-step.active:not(:last-child)::after,
        .progress-step.completed:not(:last-child)::after {
            background-color: var(--color-primary);
        }
        
        .progress-step:hover {
            transform: translateX(5px);
        }
        
        .error {
            border-color: red !important;
            box-shadow: 0 0 3px rgba(255, 0, 0, 0.3) !important;
        }
        
        .error:focus {
            border-color: red !important;
            box-shadow: 0 0 5px rgba(255, 0, 0, 0.5) !important;
        }
        
        .btn-disabled {
            opacity: 0.7;
            cursor: not-allowed !important;
            background-color: #cccccc !important;
            border-color: #999999 !important;
            color: #666666 !important;
            transform: none !important;
            box-shadow: none !important;
        }
        
        .btn-disabled:hover {
            background-color: #cccccc !important;
            transform: none !important;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .shake {
            animation: shake 0.5s;
        }
        
        @media (max-width: 768px) {
            .container {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
                min-height: auto;
                position: relative;
                border-right: none;
                border-bottom: 1px solid #e5e7eb;
                padding: 15px;
            }
            
            .progress-step {
                padding: 5px 0;
                margin-bottom: 5px;
            }
            
            .progress-step .step-indicator {
                width: 24px;
                height: 24px;
                font-size: 12px;
            }
            
            .progress-step .step-title {
                font-size: 12px;
            }
            
            .progress-step:not(:last-child)::after {
                top: 29px;
                height: 15px;
            }
            
            .main-content {
                padding: 15px;
            }
        }
    `;
    document.head.appendChild(style);

    // Layout anpassen - Container erstellen, falls nicht vorhanden
    const form = document.querySelector('.db-contact-generator-wrapper');
    if (form && !document.querySelector('.container')) {
        // Die ursprüngliche Umgebung des Formulars referenzieren
        const parentElement = form.parentElement;

        // Container erstellen und einfügen
        const container = document.createElement('div');
        container.className = 'container';
        parentElement.appendChild(container);

        // Sidebar erstellen
        const sidebar = document.createElement('div');
        sidebar.className = 'sidebar';
        container.appendChild(sidebar);

        // Alle Fortschrittsschritte in die Sidebar verschieben
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            sidebar.appendChild(progressBar);
        }

        // Main-Content erstellen
        const mainContent = document.createElement('div');
        mainContent.className = 'main-content';
        container.appendChild(mainContent);

        // Das Formular in den Main-Content verschieben
        mainContent.appendChild(form);
    }

    // Initial alle Schritte validieren und Button-Status aktualisieren
    window.setTimeout(function() {
        for (let i = 1; i <= 9; i++) {
            validateCurrentStep(i);
        }
    }, 500);
});

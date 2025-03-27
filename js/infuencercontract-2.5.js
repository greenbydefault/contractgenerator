document.addEventListener('DOMContentLoaded', function() {
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
    
    // Flag um zu verhindern, dass mehrere Validierungsnachrichten erscheinen
    let validationInProgress = false;

    // Event-Listener für Klicks auf die Fortschrittsschritte hinzufügen (direkte Navigation)
    progressSteps.forEach(step => {
        step.addEventListener('click', function() {
            if (validationInProgress) return; // Verhindere mehrfache Validierungen
            validationInProgress = true;
            
            const stepNum = parseInt(this.getAttribute('data-step'));
            
            // Nur aktuelle und vergangene Schritte erlauben direkte Navigation
            if (stepNum <= currentStep) {
                goToStep(stepNum);
                validationInProgress = false;
                return;
            }
            
            // Validiere alle vorherigen Schritte, bevor zu diesem Schritt gewechselt wird
            if (validatePreviousSteps(stepNum)) {
                goToStep(stepNum);
            } else {
                // Zeige Hinweis, dass vorherige Schritte Pflichtfelder enthalten
                shakeInvalidFields();
                alert('Bitte fülle alle Pflichtfelder in den vorherigen Schritten aus, bevor du zu diesem Schritt wechselst.');
            }
            validationInProgress = false;
        });
    });

    // Event-Listener für "Weiter"-Buttons
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (validationInProgress) return;
            validationInProgress = true;
            
            const nextStep = parseInt(this.getAttribute('data-next'));
            // Prüfe nur den aktuellen Schritt vor dem Weitergehen
            if (validateCurrentStep(currentStep)) {
                goToStep(nextStep);
            } else {
                // Zeige Hinweis für fehlende Pflichtfelder im aktuellen Schritt
                shakeInvalidFields();
                alert('Bitte fülle alle Pflichtfelder in diesem Schritt aus, bevor du fortfährst.');
            }
            validationInProgress = false;
        });
    });

    // Event-Listener für "Zurück"-Buttons
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = parseInt(this.getAttribute('data-prev'));
            // Zurück-Buttons erlauben immer Navigation ohne Validierung
            goToStep(prevStep);
        });
    });

    // Funktion zum Hervorheben fehlender Pflichtfelder mit Animation
    function shakeInvalidFields() {
        const currentSection = document.getElementById(`step-${currentStep}`);
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
            }
        });
    }

    // Funktion zur Validierung des aktuellen Schritts
    function validateCurrentStep(stepNumber) {
        const currentSection = document.getElementById(`step-${stepNumber}`);
        if (!currentSection) return true; // Wenn Abschnitt nicht gefunden, als gültig betrachten
        
        const requiredFields = currentSection.querySelectorAll('[required]');
        let allValid = true;
        
        // Überprüfe alle Pflichtfelder im aktuellen Schritt
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                allValid = false;
                field.classList.add('error');
                // Visuelles Feedback, dass das Feld ausgefüllt werden muss
                field.style.borderColor = 'red';
            } else {
                field.classList.remove('error');
                field.style.borderColor = '';
            }
        });
        
        return allValid;
    }

    // Funktion zur Validierung aller Schritte bis zum gewünschten Schritt
    function validatePreviousSteps(targetStep) {
        for (let i = 1; i < targetStep; i++) {
            if (!validateCurrentStep(i)) {
                // Bei erstem ungültigen Schritt zurück zu diesem Schritt
                goToStep(i);
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
            if (stepNum <= stepNumber) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // Gewünschten Abschnitt anzeigen
        const targetSection = document.getElementById(`step-${stepNumber}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Fortschrittsanzeige aktualisieren
        updateProgress();
        
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

    // Vorschau im letzten Schritt aktualisieren
    function updatePreview() {
        // Unternehmensdaten
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
        
        // Zusätzliche Vereinbarungen
        let additionalAgreementsHtml = '';
        if (document.getElementById('collab-post').checked) {
            additionalAgreementsHtml += '<p>✓ Co-Autoren-Post (Instagram Collab): Ja</p>';
        }
        if (document.getElementById('company-publication').checked) {
            additionalAgreementsHtml += '<p>✓ Veröffentlichung des Contents durch das Unternehmen / den Kunden auf dessen eigenem Kanal: Ja</p>';
        }
        if (document.getElementById('no-company-publication').checked) {
            additionalAgreementsHtml += '<p>✓ Keine zusätzliche Veröffentlichung durch das Unternehmen: Ja</p>';
        }
        document.getElementById('preview-additional-agreements').innerHTML = additionalAgreementsHtml || '<p>Keine zusätzlichen Vereinbarungen</p>';
        
        // Media Buyout
        let mediaBuyoutHtml = '';
        if (document.getElementById('media-buyout-yes').checked) {
            mediaBuyoutHtml += '<p>✓ Ja, der erstellte Content darf für Werbezwecke genutzt werden.</p>';
            
            mediaBuyoutHtml += '<p><strong>Werbekanäle:</strong></p>';
            let channelsHtml = '<ul>';
            if (document.getElementById('ad-instagram').checked) channelsHtml += '<li>Instagram</li>';
            if (document.getElementById('ad-facebook').checked) channelsHtml += '<li>Youtube / Youtube Shorts</li>';
            if (document.getElementById('ad-tiktok').checked) channelsHtml += '<li>TikTok</li>';
            if (document.getElementById('ad-other').checked) channelsHtml += '<li>Sonstiges</li>';
            channelsHtml += '</ul>';
            mediaBuyoutHtml += channelsHtml;
            
            mediaBuyoutHtml += '<p><strong>Werbeoptionen:</strong></p>';
            let optionsHtml = '<ul>';
            if (document.getElementById('whitelisting').checked) optionsHtml += '<li>Whitelisting (Meta)</li>';
            if (document.getElementById('spark-ad').checked) optionsHtml += '<li>Spark Ad (TikTok)</li>';
            optionsHtml += '</ul>';
            mediaBuyoutHtml += optionsHtml;
            
            mediaBuyoutHtml += '<p><strong>Nutzungsdauer:</strong> ';
            if (document.getElementById('duration-3').checked) mediaBuyoutHtml += '3 Monate';
            else if (document.getElementById('duration-6').checked) mediaBuyoutHtml += '6 Monate';
            else if (document.getElementById('duration-12').checked) mediaBuyoutHtml += '12 Monate';
            else if (document.getElementById('duration-unlimited').checked) mediaBuyoutHtml += 'Unbegrenzt';
            else mediaBuyoutHtml += 'Nicht spezifiziert';
            mediaBuyoutHtml += '</p>';
        } else {
            mediaBuyoutHtml += '<p>✓ Nein, Inhalte verbleiben ausschließlich beim Influencer und dürfen nicht für Werbung genutzt werden.</p>';
        }
        document.getElementById('preview-media-buyout').innerHTML = mediaBuyoutHtml;
        
        // Rechteübertragung anpassen je nach Vertragstyp
        const rightsTransferElement = document.getElementById('preview-rights-transfer');
        if (isClientContract) {
            rightsTransferElement.textContent = 'Nur bei Zustimmung zur Nutzung für Werbung (§3) überträgt der Influencer dem Unternehmen für die gewählte Nutzungsdauer ein einfaches Nutzungsrecht an den erstellten Inhalten zur Verwendung in den vereinbarten Kanälen. Das Unternehmen ist berechtigt, die Inhalte dem benannten Kunden zur Nutzung zu überlassen.';
        } else {
            rightsTransferElement.textContent = 'Nur bei Zustimmung zur Nutzung für Werbung (§3) überträgt der Influencer dem Unternehmen für die gewählte Nutzungsdauer ein einfaches Nutzungsrecht an den erstellten Inhalten zur Verwendung in den vereinbarten Kanälen. Das Unternehmen ist alleiniger Berechtigter dieser Nutzungsrechte.';
        }
        
        // Produktion & Freigabe
        document.getElementById('preview-briefing-date').textContent = formatDate(document.getElementById('briefing-date').value) || '[Datum]';
        
        const scriptDate = document.getElementById('script-date').value;
        const scriptTime = document.getElementById('script-time').value;
        if (scriptDate) {
            document.getElementById('preview-script-date').textContent = `Sofern vereinbart, erstellt der Influencer ein Skript und übermittelt es zur Freigabe bis ${formatDate(scriptDate)}/${scriptTime}.`;
        } else {
            document.getElementById('preview-script-date').textContent = 'Sofern vereinbart, erstellt der Influencer ein Skript und übermittelt es zur Freigabe bis [Datum/Uhrzeit].';
        }
        
        const productionStart = formatDate(document.getElementById('production-start').value) || '[von]';
        const productionEnd = formatDate(document.getElementById('production-end').value) || '[bis]';
        document.getElementById('preview-production-period').textContent = `${productionStart} – ${productionEnd}`;
        
        const productionLocation = document.getElementById('production-location').value;
        if (productionLocation) {
            document.getElementById('preview-production-location-text').textContent = `, ggf. am Produktionsort ${productionLocation}`;
        } else {
            document.getElementById('preview-production-location-text').textContent = '';
        }
        
        const deliveryDate = document.getElementById('delivery-date').value;
        const deliveryTime = document.getElementById('delivery-time').value;
        if (deliveryDate) {
            document.getElementById('preview-delivery-date').textContent = `${formatDate(deliveryDate)} / ${deliveryTime}`;
        } else {
            document.getElementById('preview-delivery-date').textContent = '[Datum/Uhrzeit]';
        }
        
        document.getElementById('preview-publication-date').textContent = formatDate(document.getElementById('publication-date').value) || '[Datum]';
        
        // Vergütung
        const compensation = document.getElementById('compensation').value || '[€ Betrag]';
        document.getElementById('preview-compensation').textContent = `${compensation} €`;
        
        // Zahlungsziel
        let paymentTerm = '';
        if (document.getElementById('term-14').checked) paymentTerm = '14 Tage';
        else if (document.getElementById('term-30').checked) paymentTerm = '30 Tage';
        else if (document.getElementById('term-45').checked) paymentTerm = '45 Tage';
        document.getElementById('preview-payment-term').textContent = paymentTerm;
        
        // Zusätzliche Vergütung
        let additionalComp = '';
        if (document.getElementById('additional-yes').checked) {
            const additionalCompText = document.getElementById('additional-comp-text').value || '[Details]';
            additionalComp = `ist vereinbart: ${additionalCompText}`;
        } else {
            additionalComp = 'ist nicht vereinbart';
        }
        document.getElementById('preview-additional-comp').textContent = additionalComp;

        // Aktualisiere die Fortschrittsanzeige mit dem tatsächlichen Fortschritt
        const realProgress = calculateRealProgress();
        if (progressFill) {
            progressFill.style.width = `${realProgress}%`;
        }
        if (progressText) {
            progressText.textContent = `${realProgress}% ausgefüllt`;
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
            // Validierung aller Schritte vor der Generierung
            if (validateAllSteps()) {
                console.log('Vertrag wird generiert...');
                
                // Prüfen, ob die generatePDF-Funktion existiert, bevor sie aufgerufen wird
                if (typeof window.generatePDF === 'function') {
                    // Direkt die globale generatePDF-Funktion aufrufen
                    window.generatePDF();
                    showSuccessAnimation();
                } else if (typeof generatePDF === 'function') {
                    // Oder die lokale generatePDF-Funktion aufrufen, falls verfügbar
                    generatePDF();
                    showSuccessAnimation();
                } else {
                    // Fallback für den Fall, dass die Funktion nicht existiert
                    console.error('Die generatePDF-Funktion wurde nicht gefunden.');
                    alert('Der Vertrag kann nicht generiert werden. Die PDF-Generierungsfunktion ist nicht verfügbar.');
                }
            } else {
                // Zeige Hinweis, dass nicht alle Pflichtfelder ausgefüllt sind
                alert('Bitte fülle alle Pflichtfelder aus, bevor du den Vertrag generierst.');
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

    // Funktion zur Validierung aller Schritte
    function validateAllSteps() {
        for (let i = 1; i <= 9; i++) {
            if (!validateCurrentStep(i)) {
                // Bei erstem ungültigen Schritt zu diesem Schritt navigieren
                goToStep(i);
                return false;
            }
        }
        return true;
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

    // Event-Listener für Input-Felder - um die Error-Klasse zu entfernen, sobald Wert eingegeben wird
    document.querySelectorAll('[required]').forEach(field => {
        field.addEventListener('input', function() {
            if (this.value.trim()) {
                this.classList.remove('error');
                this.style.borderColor = '';
            } else {
                this.classList.add('error');
                this.style.borderColor = 'red';
            }
            updateProgress();
        });
    });

    // Initialisierung der Fortschrittsanzeige
    updateProgress();

    // CSS für klickbare Schritte und Fehlerzustände hinzufügen
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
});

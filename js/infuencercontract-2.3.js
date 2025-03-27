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

    // Event-Listener für Klicks auf die Fortschrittsschritte hinzufügen (direkte Navigation)
    progressSteps.forEach(step => {
        step.addEventListener('click', function() {
            const stepNum = parseInt(this.getAttribute('data-step'));
            goToStep(stepNum);
        });
    });

    // Event-Listener für "Weiter"-Buttons
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const nextStep = parseInt(this.getAttribute('data-next'));
            goToStep(nextStep);
        });
    });

    // Event-Listener für "Zurück"-Buttons
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = parseInt(this.getAttribute('data-prev'));
            goToStep(prevStep);
        });
    });

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
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}% ausgefüllt`;
        
        // Fortschrittsnachricht aktualisieren
        updateProgressMessage(currentStep);
        
        // Für die Vorschau im letzten Schritt
        if (currentStep === 9) {
            updatePreview();
        }
    }

    // Fortschrittsnachricht je nach Schritt aktualisieren
    function updateProgressMessage(stepNumber) {
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
        
        // Berechne den Prozentsatz
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
        progressFill.style.width = `${realProgress}%`;
        progressText.textContent = `${realProgress}% ausgefüllt`;
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
            // Hier würde der Aufruf der PDF-Generierungsfunktion stehen
            console.log('Vertrag wird generiert...');
            
            // Validierung der Pflichtfelder
            const requiredFields = document.querySelectorAll('[required]');
            let allFieldsValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value) {
                    allFieldsValid = false;
                    field.classList.add('error');
                } else {
                    field.classList.remove('error');
                }
            });
            
            if (!allFieldsValid) {
                alert('Bitte fülle alle Pflichtfelder aus.');
                return;
            }
            
            // Erfolgsanimation anzeigen
            const successAnimation = document.getElementById('success-animation');
            if (successAnimation) {
                successAnimation.classList.remove('hidden');
            }
            
            // Hier würde dann die tatsächliche PDF-Generierung erfolgen
            // Beispiel: generatePDF(); // Funktion aus deinem PDF-Generator-Skript
        });
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
            
            // Hier könnte ein tatsächlicher Download ausgelöst werden
            console.log('Download startet...');
        });
    }

    // Initialisierung der Fortschrittsanzeige
    updateProgress();

    // CSS für klickbare Schritte hinzufügen
    const style = document.createElement('style');
    style.textContent = `
        .progress-step {
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        .progress-step:hover {
            transform: scale(1.05);
        }
    `;
    document.head.appendChild(style);
});

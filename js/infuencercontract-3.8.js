document.addEventListener('DOMContentLoaded', function() {
    // Globale Variable für den aktuellen Schritt
    let currentStep = 1;
    
    // Globale Variable, um zu verhindern, dass mehrere Navigationen gleichzeitig stattfinden
    let navigationInProgress = false;
    
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
                // Alle Fehlermarkierungen im aktuellen Schritt zurücksetzen
                resetErrorsInCurrentStep();
                goToStep(stepNum);
                navigationInProgress = false;
                return;
            }
            
            // Für vorwärts: nur den aktuellen Schritt validieren
            if (validateCurrentStep()) {
                // Alle Fehlermarkierungen im aktuellen Schritt zurücksetzen
                resetErrorsInCurrentStep();
                goToStep(stepNum);
            } else {
                // Fehlende Felder visuell markieren
                markInvalidFieldsInCurrentStep();
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
            if (!validateCurrentStep()) {
                markInvalidFieldsInCurrentStep();
                showValidationError();
                navigationInProgress = false;
                return;
            }
            
            // Alle Fehlermarkierungen im aktuellen Schritt zurücksetzen
            resetErrorsInCurrentStep();
            goToStep(nextStep);
            navigationInProgress = false;
        });
    });

    // Event-Listener für "Zurück"-Buttons
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (navigationInProgress) return;
            navigationInProgress = true;
            
            const prevStep = parseInt(this.getAttribute('data-prev'));
            // Alle Fehlermarkierungen im aktuellen Schritt zurücksetzen
            resetErrorsInCurrentStep();
            goToStep(prevStep);
            navigationInProgress = false;
        });
    });

    // Funktion zum Zurücksetzen aller Fehlermarkierungen im aktuellen Schritt
    function resetErrorsInCurrentStep() {
        const currentSection = document.getElementById(`step-${currentStep}`);
        if (!currentSection) return;
        
        const fields = currentSection.querySelectorAll('.form-input-field');
        fields.forEach(field => {
            field.classList.remove('error');
            field.style.borderColor = '';
            field.classList.remove('shake');
        });
    }

    // Funktion, um Fehler von nicht ausgefüllten Pflichtfeldern anzuzeigen
    function showValidationError() {
        alert('Bitte fülle alle markierten Pflichtfelder aus.');
    }

    // Funktion zum Markieren ungültiger Felder im aktuellen Schritt
    function markInvalidFieldsInCurrentStep() {
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
    function validateCurrentStep() {
        const currentSection = document.getElementById(`step-${currentStep}`);
        if (!currentSection) return true; // Wenn Abschnitt nicht gefunden, als gültig betrachten
        
        // Finde alle Next-Buttons für diesen Schritt
        const nextButton = document.querySelector(`.next-step[data-next="${currentStep + 1}"]`);
        
        const requiredFields = currentSection.querySelectorAll('[required]');
        let allValid = true;
        
        // Überprüfe alle Pflichtfelder im aktuellen Schritt
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                allValid = false;
            }
        });
        
        // Button-Status aktualisieren
        if (nextButton) {
            updateButtonState(nextButton, allValid);
        }
        
        return allValid;
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
        
        // Status des Weiter-Buttons für den aktuellen Schritt aktualisieren
        validateCurrentStep();
        
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
        try {
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
                // Ausführliche Kundendaten darstellen
                document.getElementById('preview-client-name').textContent = document.getElementById('client-name').value || '[Name des Kunden]';
                document.getElementById('preview-client-street').textContent = document.getElementById('client-street').value || '[Straße]';
                document.getElementById('preview-client-number').textContent = document.getElementById('client-number').value || '[Hausnummer]';
                document.getElementById('preview-client-zip').textContent = document.getElementById('client-zip').value || '[PLZ]';
                document.getElementById('preview-client-city').textContent = document.getElementById('client-city').value || '[Stadt]';
                document.getElementById('preview-client-country').textContent = document.getElementById('client-country').value || '[Land]';
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

    // *** PDF-GENERIERUNG FUNKTIONEN ***

    // Funktion zum Hinzufügen eines Wasserzeichens
    function addWatermark(doc) {
        const totalPages = doc.internal.getNumberOfPages();

        // Setze Schriftart und Größe für das Wasserzeichen
        doc.setFont('helvetica');
        doc.setFontSize(7);
        doc.setTextColor(130); // Graue Farbe für das Wasserzeichen

        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            // Berechne die X- und Y-Position für das Wasserzeichen
            const pageSize = doc.internal.pageSize;
            const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

            // Wasserzeichen in die untere rechte Ecke
            const watermarkTextWidth = doc.getTextWidth('Created with creatorjobs.com');
            doc.text('Created with creatorjobs.com', pageWidth - watermarkTextWidth - 10, pageHeight - 10);
        }
    }

    // Verbesserte und einheitliche Darstellung der Paragraphen-Überschriften
    function addParagraphTitle(doc, title, y) {
        doc.setFont("helvetica", "bold");
        doc.text(title, 30, y);
        doc.setFont("helvetica", "normal");
        return y + 8; // Einheitlicher Abstand nach jeder Überschrift
    }
    
    // Funktion zum Erstellen des Inhaltsverzeichnisses - optimiert für bessere Lesbarkeit
    function addTableOfContents(doc) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text('Inhaltsverzeichnis', 105, 40, null, null, 'center');
        
        doc.setFontSize(11);
        
        let y = 60;
        const paragraphs = [
            { num: "§1", title: "Vertragsgegenstand", page: 3 },
            { num: "§2", title: "Plattformen & Veröffentlichung", page: 3 },
            { num: "§3", title: "Nutzung für Werbung (Media Buyout)", page: 4 },
            { num: "§4", title: "Rechteübertragung", page: 4 },
            { num: "§5", title: "Produktion & Freigabe", page: 4 },
            { num: "§6", title: "Vergütung", page: 5 },
            { num: "§7", title: "Qualität & Upload", page: 5 },
            { num: "§8", title: "Rechte Dritter & Musik", page: 5 },
            { num: "§9", title: "Werbekennzeichnung & Exklusivität", page: 6 },
            { num: "§10", title: "Verbindlichkeit Briefing & Skript", page: 6 },
            { num: "§11", title: "Datenschutz & Vertraulichkeit", page: 6 },
            { num: "§12", title: "Schlussbestimmungen", page: 6 }
        ];
        
        // Bessere Verteilung der Paragraphen auf die Seiten
        paragraphs.forEach(para => {
            doc.setFont("helvetica", "bold");
            doc.text(para.num, 30, y);
            doc.setFont("helvetica", "normal");
            doc.text(para.title, 45, y); // Weniger Abstand zwischen Nummer und Titel
            doc.text(para.page.toString(), 170, y);
            y += 10; // Reduzierter Abstand zwischen den Einträgen für kompakteres Layout
        });
        
        doc.addPage();
    }

    // Funktion zum Hinzufügen einer Titelseite
    function addCoverPage(doc, companyName, companyContact, companyStreet, companyNumber, companyZip, companyCity, companyCountry, influencerName, influencerStreet, influencerNumber, influencerZip, influencerCity, influencerCountry) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text('INFLUENCER-MARKETING-VERTRAG', 105, 80, null, null, 'center');
        
        doc.setFontSize(14);
        doc.text('Vertragspartner', 105, 120, null, null, 'center');
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text('Unternehmen (Auftraggeber):', 30, 150);
        doc.setFont("helvetica", "normal");
        
        // Name mit fetter Schrift für die Variable
        doc.text('Name: ', 30, 160);
        doc.setFont("helvetica", "bold");
        doc.text(companyName, 30 + doc.getTextWidth('Name: '), 160);
        
        // Vertreten durch mit fetter Schrift für die Variable
        doc.setFont("helvetica", "normal");
        doc.text('Vertreten durch: ', 30, 170);
        doc.setFont("helvetica", "bold");
        doc.text(companyContact, 30 + doc.getTextWidth('Vertreten durch: '), 170);
        
        // Straße und Nummer mit fetter Schrift für die Variablen
        doc.setFont("helvetica", "normal");
        doc.text('Straße: ', 30, 180);
        doc.setFont("helvetica", "bold");
        doc.text(companyStreet, 30 + doc.getTextWidth('Straße: '), 180);
        doc.setFont("helvetica", "normal");
        doc.text(', Nr.: ', 30 + doc.getTextWidth('Straße: ') + doc.getTextWidth(companyStreet), 180);
        doc.setFont("helvetica", "bold");
        doc.text(companyNumber, 30 + doc.getTextWidth('Straße: ') + doc.getTextWidth(companyStreet) + doc.getTextWidth(', Nr.: '), 180);
        
        // PLZ, Stadt und Land mit fetter Schrift für die Variablen
        doc.setFont("helvetica", "normal");
        doc.text('PLZ: ', 30, 190);
        doc.setFont("helvetica", "bold");
        doc.text(companyZip, 30 + doc.getTextWidth('PLZ: '), 190);
        doc.setFont("helvetica", "normal");
        doc.text(', Stadt: ', 30 + doc.getTextWidth('PLZ: ') + doc.getTextWidth(companyZip), 190);
        doc.setFont("helvetica", "bold");
        doc.text(companyCity, 30 + doc.getTextWidth('PLZ: ') + doc.getTextWidth(companyZip) + doc.getTextWidth(', Stadt: '), 190);
        doc.setFont("helvetica", "normal");
        doc.text(', Land: ', 30 + doc.getTextWidth('PLZ: ') + doc.getTextWidth(companyZip) + doc.getTextWidth(', Stadt: ') + doc.getTextWidth(companyCity), 190);
        doc.setFont("helvetica", "bold");
        doc.text(companyCountry, 30 + doc.getTextWidth('PLZ: ') + doc.getTextWidth(companyZip) + doc.getTextWidth(', Stadt: ') + doc.getTextWidth(companyCity) + doc.getTextWidth(', Land: '), 190);
        
        doc.setFont("helvetica", "bold");
        doc.text('Influencer (Creator):', 30, 210);
        
        // Name mit fetter Schrift für die Variable
        doc.setFont("helvetica", "normal");
        doc.text('Name: ', 30, 220);
        doc.setFont("helvetica", "bold");
        doc.text(influencerName, 30 + doc.getTextWidth('Name: '), 220);
        
        // Straße und Nummer mit fetter Schrift für die Variablen
        doc.setFont("helvetica", "normal");
        doc.text('Straße: ', 30, 230);
        doc.setFont("helvetica", "bold");
        doc.text(influencerStreet, 30 + doc.getTextWidth('Straße: '), 230);
        doc.setFont("helvetica", "normal");
        doc.text(', Nr.: ', 30 + doc.getTextWidth('Straße: ') + doc.getTextWidth(influencerStreet), 230);
        doc.setFont("helvetica", "bold");
        doc.text(influencerNumber, 30 + doc.getTextWidth('Straße: ') + doc.getTextWidth(influencerStreet) + doc.getTextWidth(', Nr.: '), 230);
        
        // PLZ, Stadt und Land mit fetter Schrift für die Variablen
        doc.setFont("helvetica", "normal");
        doc.text('PLZ: ', 30, 240);
        doc.setFont("helvetica", "bold");
        doc.text(influencerZip, 30 + doc.getTextWidth('PLZ: '), 240);
        doc.setFont("helvetica", "normal");
        doc.text(', Stadt: ', 30 + doc.getTextWidth('PLZ: ') + doc.getTextWidth(influencerZip), 240);
        doc.setFont("helvetica", "bold");
        doc.text(influencerCity, 30 + doc.getTextWidth('PLZ: ') + doc.getTextWidth(influencerZip) + doc.getTextWidth(', Stadt: '), 240);
        doc.setFont("helvetica", "normal");
        doc.text(', Land: ', 30 + doc.getTextWidth('PLZ: ') + doc.getTextWidth(influencerZip) + doc.getTextWidth(', Stadt: ') + doc.getTextWidth(influencerCity), 240);
        doc.setFont("helvetica", "bold");
        doc.text(influencerCountry, 30 + doc.getTextWidth('PLZ: ') + doc.getTextWidth(influencerZip) + doc.getTextWidth(', Stadt: ') + doc.getTextWidth(influencerCity) + doc.getTextWidth(', Land: '), 240);
        
        // Nächste Seite für Inhaltsverzeichnis
        doc.addPage();
        
        // Inhaltsverzeichnis hinzufügen
        addTableOfContents(doc);
    }

    // Verbesserte Funktion zum Anzeigen von Unterschriftsfeldern mit Ort und Datum
    function addSignatureFields(doc, city) {
        // Stellen Sie sicher, dass wir am Ende des Dokuments arbeiten
        let y = doc.internal.pageSize.height - 70;

        // Aktuelles Datum im deutschen Format (TT.MM.JJJJ)
        const today = new Date();
        const formattedDate = today.getDate() + "." + (today.getMonth() + 1) + "." + today.getFullYear();
        
        // Linke Spalte (Unternehmen)
        const leftColumnX = 30;
        const rightColumnX = 120;
        
        // Ort mit vorausgefülltem Wert
        doc.text("Ort:", leftColumnX, y);
        doc.setFont("helvetica", "bold");
        doc.text(city, leftColumnX + 20, y - 3); // Leicht über der Linie
        doc.setFont("helvetica", "normal");
        doc.line(leftColumnX + 20, y, leftColumnX + 80, y); // Linie für Ort
        
        doc.text("Ort:", rightColumnX, y);
        doc.setFont("helvetica", "bold");
        doc.text(city, rightColumnX + 20, y - 3); // Leicht über der Linie
        doc.setFont("helvetica", "normal");
        doc.line(rightColumnX + 20, y, rightColumnX + 80, y); // Linie für Ort
        
        y += 15;
        
        // Datum mit vorausgefülltem Wert
        doc.text("Datum:", leftColumnX, y);
        doc.setFont("helvetica", "bold");
        doc.text(formattedDate, leftColumnX + 30, y - 3); // Leicht über der Linie
        doc.setFont("helvetica", "normal");
        doc.line(leftColumnX + 30, y, leftColumnX + 80, y); // Linie für Datum
        
        doc.text("Datum:", rightColumnX, y);
        doc.setFont("helvetica", "bold");
        doc.text(formattedDate, rightColumnX + 30, y - 3); // Leicht über der Linie
        doc.setFont("helvetica", "normal");
        doc.line(rightColumnX + 30, y, rightColumnX + 80, y); // Linie für Datum
        
        y += 15;
        
        // Unterschriftslinien - dickere Linien
        doc.setLineWidth(0.5); // Erhöhe die Liniendicke
        doc.line(leftColumnX, y, leftColumnX + 80, y); // Linie für Unternehmen
        doc.line(rightColumnX, y, rightColumnX + 80, y); // Linie für Influencer
        doc.setLineWidth(0.3); // Zurück zur Standard-Liniendicke
        
        y += 10;
        
        doc.text("[Unterschrift Unternehmen]", leftColumnX, y);
        doc.text("[Unterschrift Influencer]", rightColumnX, y);
    }

    // Verbesserte Funktion zum Anzeigen von Checkbox-Optionen mit kleineren Boxen
    function renderCheckbox(doc, isChecked, text, x, y) {
        // Verwende eine Lösung ohne Sonderzeichen mit dünneren Linien und kleinerer Box
        const boxSize = 4; // Reduziert von 5 auf 4
        if (isChecked) {
            // Zeichne ein Kästchen mit Kreuz (X)
            doc.rect(x, y - 3.5, boxSize, boxSize); // Position leicht angepasst
            doc.setLineWidth(0.2); // Dünnere Linie für das Kreuz
            doc.line(x, y - 3.5, x + boxSize, y + 0.5); // Diagonal von links oben nach rechts unten
            doc.line(x, y + 0.5, x + boxSize, y - 3.5); // Diagonal von links unten nach rechts oben
            doc.setLineWidth(0.3); // Zurück zur Standard-Liniendicke
        } else {
            // Zeichne ein leeres Kästchen
            doc.rect(x, y - 3.5, boxSize, boxSize); // Position leicht angepasst
        }
        
        // Setze Text daneben mit weniger Abstand
        doc.text(text, x + boxSize + 3, y); // Reduzierter Abstand (von 8 auf 6)
        return y;
    }

    // Hauptfunktion zum Generieren des PDFs
    function generatePDF() {
        console.log('Starting PDF generation');
        try {
            // Daten aus dem Formular extrahieren
            // Vertragstyp
            const contractTypeEl = document.getElementById('contract-type');
            const isClientContract = contractTypeEl ? contractTypeEl.value === 'client' : false;
            
            // Unternehmen (Auftraggeber)
            const companyNameEl = document.getElementById('company-name');
            const companyName = companyNameEl ? companyNameEl.value : '[Name des Unternehmens]';
            
            const companyContactEl = document.getElementById('company-contact');
            const companyContact = companyContactEl ? companyContactEl.value : '[Ansprechpartner]';
            
            const companyStreetEl = document.getElementById('company-street');
            const companyStreet = companyStreetEl ? companyStreetEl.value : '[Straße]';
            
            const companyNumberEl = document.getElementById('company-number');
            const companyNumber = companyNumberEl ? companyNumberEl.value : '[Hausnummer]';
            
            const companyZipEl = document.getElementById('company-zip');
            const companyZip = companyZipEl ? companyZipEl.value : '[PLZ]';
            
            const companyCityEl = document.getElementById('company-city');
            const companyCity = companyCityEl ? companyCityEl.value : '[Stadt]';
            
            const companyCountryEl = document.getElementById('company-country');
            const companyCountry = companyCountryEl ? companyCountryEl.value : '[Land]';
            
            // Influencer (Creator)
            const influencerNameEl = document.getElementById('influencer-name');
            const influencerName = influencerNameEl ? influencerNameEl.value : '[Name des Influencers]';
            
            const influencerStreetEl = document.getElementById('influencer-street');
            const influencerStreet = influencerStreetEl ? influencerStreetEl.value : '[Straße Creator]';
            
            const influencerNumberEl = document.getElementById('influencer-number');
            const influencerNumber = influencerNumberEl ? influencerNumberEl.value : '[Hausnummer Creator]';
            
            const influencerZipEl = document.getElementById('influencer-zip');
            const influencerZip = influencerZipEl ? influencerZipEl.value : '[PLZ Creator]';
            
            const influencerCityEl = document.getElementById('influencer-city');
            const influencerCity = influencerCityEl ? influencerCityEl.value : '[Stadt Creator]';
            
            const influencerCountryEl = document.getElementById('influencer-country');
            const influencerCountry = influencerCountryEl ? influencerCountryEl.value : '[Land Creator]';
            
            // Kunde/Marke - ERWEITERTE FELDER
            let clientName, clientStreet, clientNumber, clientZip, clientCity, clientCountry;
            
            if (isClientContract) {
                // Hole detaillierte Kundendaten aus separaten Feldern für Client-Verträge
                const clientNameEl = document.getElementById('client-name');
                clientName = clientNameEl ? clientNameEl.value : '[Name des Kunden]';
                
                const clientStreetEl = document.getElementById('client-street');
                clientStreet = clientStreetEl ? clientStreetEl.value : '[Straße Kunde]';
                
                const clientNumberEl = document.getElementById('client-number');
                clientNumber = clientNumberEl ? clientNumberEl.value : '[Hausnummer Kunde]';
                
                const clientZipEl = document.getElementById('client-zip');
                clientZip = clientZipEl ? clientZipEl.value : '[PLZ Kunde]';
                
                const clientCityEl = document.getElementById('client-city');
                clientCity = clientCityEl ? clientCityEl.value : '[Stadt Kunde]';
                
                const clientCountryEl = document.getElementById('client-country');
                clientCountry = clientCountryEl ? clientCountryEl.value : '[Land Kunde]';
            } else {
                // Bei direktem Vertrag ist der Kunde das Unternehmen selbst
                clientName = companyName;
                clientStreet = companyStreet;
                clientNumber = companyNumber;
                clientZip = companyZip;
                clientCity = companyCity;
                clientCountry = companyCountry;
            }
            
            // Plattformen
            const instagramSelectedEl = document.getElementById('platform-instagram');
            const instagramSelected = instagramSelectedEl ? instagramSelectedEl.checked : false;
            
            const instagramUsernameEl = document.getElementById('instagram-username');
            const instagramUsername = instagramUsernameEl ? instagramUsernameEl.value : '[@nutzername]';
            
            const tiktokSelectedEl = document.getElementById('platform-tiktok');
            const tiktokSelected = tiktokSelectedEl ? tiktokSelectedEl.checked : false;
            
            const tiktokUsernameEl = document.getElementById('tiktok-username');
            const tiktokUsername = tiktokUsernameEl ? tiktokUsernameEl.value : '[@nutzername]';
            
            const youtubeSelectedEl = document.getElementById('platform-youtube');
            const youtubeSelected = youtubeSelectedEl ? youtubeSelectedEl.checked : false;
            
            const youtubeUrlEl = document.getElementById('youtube-url');
            const youtubeUrl = youtubeUrlEl ? youtubeUrlEl.value : '[URL]';
            
            const otherSelectedEl = document.getElementById('platform-other');
            const otherSelected = otherSelectedEl ? otherSelectedEl.checked : false;
            
            const otherPlatformEl = document.getElementById('other-platform');
            const otherPlatform = otherPlatformEl ? otherPlatformEl.value : '[frei eintragen]';
            
            // Inhalte
            const storySlidesEl = document.getElementById('story-slides');
            const storySlides = storySlidesEl ? storySlidesEl.value : '[Anzahl]';
            
            const reelsTiktokEl = document.getElementById('reels-tiktok');
            const reelsTiktok = reelsTiktokEl ? reelsTiktokEl.value : '[Anzahl]';
            
            const feedPostsEl = document.getElementById('feed-posts');
            const feedPosts = feedPostsEl ? feedPostsEl.value : '[Anzahl]';
            
            const youtubeVideosEl = document.getElementById('youtube-videos');
            const youtubeVideos = youtubeVideosEl ? youtubeVideosEl.value : '[Anzahl]';
            
            // Zusätzliche Vereinbarungen
            const collabPostEl = document.getElementById('collab-post');
            const collabPost = collabPostEl ? collabPostEl.checked : false;
            
            const companyPublicationEl = document.getElementById('company-publication');
            const companyPublication = companyPublicationEl ? companyPublicationEl.checked : false;
            
            const noCompanyPublicationEl = document.getElementById('no-company-publication');
            const noCompanyPublication = noCompanyPublicationEl ? noCompanyPublicationEl.checked : false;
            
            // Media Buyout
            const mediaBuyoutYesEl = document.getElementById('media-buyout-yes');
            const mediaBuyoutYes = mediaBuyoutYesEl ? mediaBuyoutYesEl.checked : false;
            
            const mediaBuyoutNoEl = document.getElementById('media-buyout-no');
            const mediaBuyoutNo = mediaBuyoutNoEl ? mediaBuyoutNoEl.checked : false;
            
            // Werbekanäle
            const adInstagramEl = document.getElementById('ad-instagram');
            const adInstagram = adInstagramEl ? adInstagramEl.checked : false;
            
            const adFacebookEl = document.getElementById('ad-facebook');
            const adFacebook = adFacebookEl ? adFacebookEl.checked : false;
            
            const adTiktokEl = document.getElementById('ad-tiktok');
            const adTiktok = adTiktokEl ? adTiktokEl.checked : false;
            
            const adOtherEl = document.getElementById('ad-other');
            const adOther = adOtherEl ? adOtherEl.checked : false;
            
            // Werbeoptionen
            const whitelistingEl = document.getElementById('whitelisting');
            const whitelisting = whitelistingEl ? whitelistingEl.checked : false;
            
            const sparkAdEl = document.getElementById('spark-ad');
            const sparkAd = sparkAdEl ? sparkAdEl.checked : false;
            
            // Nutzungsdauer
            let usageDuration = '';
            const duration3El = document.getElementById('duration-3');
            const duration6El = document.getElementById('duration-6');
            const duration12El = document.getElementById('duration-12');
            const durationUnlimitedEl = document.getElementById('duration-unlimited');
            
            if (duration3El && duration3El.checked) usageDuration = '3 Monate';
            else if (duration6El && duration6El.checked) usageDuration = '6 Monate';
            else if (duration12El && duration12El.checked) usageDuration = '12 Monate';
            else if (durationUnlimitedEl && durationUnlimitedEl.checked) usageDuration = 'Unbegrenzt';
            else usageDuration = ''; // Wenn nichts ausgewählt ist
            
            // Zeitplan
            const briefingDateEl = document.getElementById('briefing-date');
            const briefingDate = formatDate(briefingDateEl ? briefingDateEl.value : '') || '[Datum]';
            
            const scriptDateEl = document.getElementById('script-date');
            const scriptDate = formatDate(scriptDateEl ? scriptDateEl.value : '') || '[Datum/Uhrzeit]';
            
            const scriptTimeEl = document.getElementById('script-time');
            const scriptTime = scriptTimeEl ? scriptTimeEl.value : '12:00';
            
            const productionStartEl = document.getElementById('production-start');
            const productionStart = formatDate(productionStartEl ? productionStartEl.value : '') || '[von]';
            
            const productionEndEl = document.getElementById('production-end');
            const productionEnd = formatDate(productionEndEl ? productionEndEl.value : '') || '[bis]';
            
            const productionLocationEl = document.getElementById('production-location');
            const productionLocation = productionLocationEl ? productionLocationEl.value : '[Adresse]';
            
            const deliveryDateEl = document.getElementById('delivery-date');
            const deliveryDate = formatDate(deliveryDateEl ? deliveryDateEl.value : '') || '[Datum]';
            
            const deliveryTimeEl = document.getElementById('delivery-time');
            const deliveryTime = deliveryTimeEl ? deliveryTimeEl.value : '12:00';
            
            const publicationDateEl = document.getElementById('publication-date');
            const publicationDate = formatDate(publicationDateEl ? publicationDateEl.value : '') || '[Datum]';
            
            // Vergütung
            const compensationEl = document.getElementById('compensation');
            const compensation = compensationEl ? compensationEl.value : '[€ Betrag]';
            
            let paymentTerm = '';
            const term14El = document.getElementById('term-14');
            const term30El = document.getElementById('term-30');
            const term45El = document.getElementById('term-45');
            
            if (term14El && term14El.checked) paymentTerm = '14 Tage';
            else if (term30El && term30El.checked) paymentTerm = '30 Tage';
            else if (term45El && term45El.checked) paymentTerm = '45 Tage';
            else paymentTerm = '';
            
            const additionalCompYesEl = document.getElementById('additional-yes');
            const additionalCompYes = additionalCompYesEl ? additionalCompYesEl.checked : false;
            
            const additionalCompNoEl = document.getElementById('additional-no');
            const additionalCompNo = additionalCompNoEl ? additionalCompNoEl.checked : false;
            
            const additionalCompTextEl = document.getElementById('additional-comp-text');
            const additionalCompText = additionalCompTextEl ? additionalCompTextEl.value : '[Textfeld falls ja]';

            // PDF erstellen
            const doc = new jsPDF();
            
            // Deckblatt hinzufügen
            addCoverPage(doc, companyName, companyContact, companyStreet, companyNumber, companyZip, companyCity, companyCountry, influencerName, influencerStreet, influencerNumber, influencerZip, influencerCity, influencerCountry);
            
            // Vertragsinhalt
            let y = 30;
            
            // §1 Vertragsgegenstand
            y = addParagraphTitle(doc, "§1 Vertragsgegenstand", y);
            doc.text("Der Influencer verpflichtet sich zur Erstellung und Veröffentlichung werblicher Inhalte", 30, y);
            y += 5;
            doc.text("zugunsten des Unternehmens bzw. einer vom Unternehmen vertretenen Marke.", 30, y);
            y += 8;
            
            // Client info mit detaillierten Angaben
            if (isClientContract) {
                // Bei Client-Vertrag: Formulierung als Agentur mit detaillierten Kundenangaben
                doc.text("Das Unternehmen handelt dabei als bevollmächtigte Agentur des Kunden:", 30, y);
                y += 8;
                
                // Name mit fetter Schrift für die Variable
                doc.text("Name: ", 30, y);
                doc.setFont("helvetica", "bold");
                doc.text(clientName, 30 + doc.getTextWidth("Name: "), y);
                doc.setFont("helvetica", "normal");
                y += 5;
                
                // Straße und Nummer mit fetter Schrift für die Variablen
                doc.text("Straße: ", 30, y);
                doc.setFont("helvetica", "bold");
                doc.text(clientStreet, 30 + doc.getTextWidth("Straße: "), y);
                doc.setFont("helvetica", "normal");
                doc.text(", Nr.: ", 30 + doc.getTextWidth("Straße: ") + doc.getTextWidth(clientStreet), y);
                doc.setFont("helvetica", "bold");
                doc.text(clientNumber, 30 + doc.getTextWidth("Straße: ") + doc.getTextWidth(clientStreet) + doc.getTextWidth(", Nr.: "), y);
                doc.setFont("helvetica", "normal");
                y += 5;
                
                // PLZ, Stadt und Land mit fetter Schrift für die Variablen
                doc.text("PLZ: ", 30, y);
                doc.setFont("helvetica", "bold");
                doc.text(clientZip, 30 + doc.getTextWidth("PLZ: "), y);
                doc.setFont("helvetica", "normal");
                doc.text(", Stadt: ", 30 + doc.getTextWidth("PLZ: ") + doc.getTextWidth(clientZip), y);
                doc.setFont("helvetica", "bold");
                doc.text(clientCity, 30 + doc.getTextWidth("PLZ: ") + doc.getTextWidth(clientZip) + doc.getTextWidth(", Stadt: "), y);
                doc.setFont("helvetica", "normal");
                doc.text(", Land: ", 30 + doc.getTextWidth("PLZ: ") + doc.getTextWidth(clientZip) + doc.getTextWidth(", Stadt: ") + doc.getTextWidth(clientCity), y);
                doc.setFont("helvetica", "bold");
                doc.text(clientCountry, 30 + doc.getTextWidth("PLZ: ") + doc.getTextWidth(clientZip) + doc.getTextWidth(", Stadt: ") + doc.getTextWidth(clientCity) + doc.getTextWidth(", Land: "), y);
                doc.setFont("helvetica", "normal");
                y += 8;
                
                doc.text("Alle Leistungen erfolgen im Namen und auf Rechnung des Unternehmens.", 30, y);
            } else {
                // Bei direktem Vertrag: Keine Agentur-Beziehung
                doc.text("Das Unternehmen handelt im eigenen Namen und auf eigene Rechnung.", 30, y);
            }
            y += 12;
            
            // §2 Plattformen & Veröffentlichung
            y = addParagraphTitle(doc, "§2 Plattformen & Veröffentlichung", y);
            doc.text("Die Veröffentlichung der Inhalte erfolgt auf folgenden Plattformen:", 30, y);
            y += 8;
            
            // Plattformen auflisten - Format: "Plattform - Profil: Name" ohne Klammern
            y = renderCheckbox(doc, instagramSelected, "Instagram - Profil: ", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(instagramUsername, 30 + doc.getTextWidth("Instagram - Profil: ") + 7, y);
            doc.setFont("helvetica", "normal");
            y += 6;
            
            y = renderCheckbox(doc, tiktokSelected, "TikTok - Profil: ", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(tiktokUsername, 30 + doc.getTextWidth("TikTok - Profil: ") + 7, y);
            doc.setFont("helvetica", "normal");
            y += 6;
            
            y = renderCheckbox(doc, youtubeSelected, "YouTube - Profil: ", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(youtubeUrl, 30 + doc.getTextWidth("YouTube - Profil: ") + 7, y);
            doc.setFont("helvetica", "normal");
            y += 6;
            
            y = renderCheckbox(doc, otherSelected, "Sonstiges: ", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(otherPlatform, 30 + doc.getTextWidth("Sonstiges: ") + 7, y);
            doc.setFont("helvetica", "normal");
            y += 10;
            
            // Inhalte
            doc.text("Folgende Inhalte werden erstellt und veröffentlicht:", 30, y);
            y += 8;
            
            // Story-Slides mit hervorgehobener Variable
            doc.text("• Story-Slides: ", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(storySlides, 30 + doc.getTextWidth("• Story-Slides: "), y);
            doc.setFont("helvetica", "normal");
            y += 5;
            
            // Reels / TikTok Videos mit hervorgehobener Variable
            doc.text("• Reels / TikTok Videos: ", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(reelsTiktok, 30 + doc.getTextWidth("• Reels / TikTok Videos: "), y);
            doc.setFont("helvetica", "normal");
            y += 5;
            
            // Feed-Posts mit hervorgehobener Variable
            doc.text("• Feed-Posts (Bild/Karussell): ", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(feedPosts, 30 + doc.getTextWidth("• Feed-Posts (Bild/Karussell): "), y);
            doc.setFont("helvetica", "normal");
            y += 5;
            
            // YouTube Video mit hervorgehobener Variable
            doc.text("• YouTube Video: ", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(youtubeVideos, 30 + doc.getTextWidth("• YouTube Video: "), y);
            doc.setFont("helvetica", "normal");
            y += 10;
            
            // Zusätzliche Vereinbarungen
            doc.text("Zusätzlich wird vereinbart:", 30, y);
            y += 8;
            
            // Verbesserte Checkbox-Rendering für Co-Autoren-Post
            renderCheckbox(doc, collabPost, "Co-Autoren-Post (Instagram Collab)", 30, y);
            y += 6;
            
            // Checkbox für Veröffentlichung durch Unternehmen
            renderCheckbox(doc, companyPublication, "Veröffentlichung des Contents durch das Unternehmen / den Kunden auf dessen", 30, y);
            y += 5;
            doc.text("eigenem Kanal", 30 + 7, y);
            y += 6;
            
            // Checkbox für keine Veröffentlichung
            renderCheckbox(doc, noCompanyPublication, "Keine zusätzliche Veröffentlichung durch das Unternehmen", 30, y);
            
            // Neue Seite für §3
            doc.addPage();
            y = 30;
            
            // §3 Nutzung für Werbung (Media Buyout)
            y = addParagraphTitle(doc, "§3 Nutzung für Werbung (Media Buyout)", y);
            doc.text("Darf der erstellte Content für Werbezwecke genutzt werden?", 30, y);
            y += 8;
            
            if (mediaBuyoutYes) {
                renderCheckbox(doc, true, "Ja", 30, y);
                y += 8;
                
                // Kanäle
                doc.text("– Kanäle:", 30, y);
                renderCheckbox(doc, adInstagram, "Instagram", 70, y);
                renderCheckbox(doc, adFacebook, "Facebook", 110, y);
                renderCheckbox(doc, adTiktok, "TikTok", 150, y);
                y += 6;
                
                renderCheckbox(doc, adOther, "Sonstiges", 70, y);
                y += 8;
                
                // Whitelisting
                doc.text("– Whitelisting (Meta):", 30, y);
                renderCheckbox(doc, whitelisting, "Ja", 70, y);
                y += 6;
                
                // Spark Ad
                doc.text("– Spark Ad (TikTok):", 30, y);
                renderCheckbox(doc, sparkAd, "Ja", 70, y);
                y += 6;
                
                // Nutzungsdauer
                doc.text("– Nutzungsdauer:", 30, y);
                renderCheckbox(doc, usageDuration === "3 Monate", "3 Monate", 70, y);
                renderCheckbox(doc, usageDuration === "6 Monate", "6 Monate", 110, y);
                renderCheckbox(doc, usageDuration === "12 Monate", "12 Monate", 150, y);
                y += 6;
                
                renderCheckbox(doc, usageDuration === "Unbegrenzt", "Unbegrenzt", 70, y);
                
            } else {
                renderCheckbox(doc, false, "Ja", 30, y);
                y += 8;
                renderCheckbox(doc, true, "Nein", 30, y);
                y += 6;
                
                // Fester Text ohne Leerzeichen für problematische Passage
                doc.text("Inhalte verbleiben ausschließlich beim Influencer und dürfen nicht für Werbung", 30, y);
                y += 5;
                doc.text("genutzt werden.", 30, y);
            }
            y += 12;
            
            // §4 Rechteübertragung
            y = addParagraphTitle(doc, "§4 Rechteübertragung", y);
            doc.text("Nur bei Zustimmung zur Nutzung für Werbung (§3) überträgt der Influencer dem", 30, y);
            y += 5;
            doc.text("Unternehmen für die gewählte Nutzungsdauer ein einfaches Nutzungsrecht an den", 30, y);
            y += 5;
            doc.text("erstellten Inhalten zur Verwendung in den vereinbarten Kanälen. Das Unternehmen ist", 30, y);
            y += 5;
            
            // Unterschiedliche Formulierung je nach Vertragstyp
            if (isClientContract) {
                doc.text("berechtigt, die Inhalte dem benannten Kunden zur Nutzung zu überlassen.", 30, y);
            } else {
                doc.text("alleiniger Berechtigter dieser Nutzungsrechte.", 30, y);
            }
            y += 8;
            
            doc.text("Die Inhalte dürfen technisch angepasst und bearbeitet werden. Die Weitergabe an", 30, y);
            y += 5;
            doc.text("sonstige Dritte ist nicht gestattet. Nach Ablauf der Nutzungsdauer erlischt das", 30, y);
            y += 5;
            doc.text("Nutzungsrecht.", 30, y);
            y += 12;
            
            // §5 Produktion & Freigabe
            y = addParagraphTitle(doc, "§5 Produktion & Freigabe", y);
            
            // Briefing mit hervorgehobener Variable - verbesserte Ausrichtung
            doc.text("Briefing: Das Briefing wird vom Unternehmen bis ", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(briefingDate, 30 + doc.getTextWidth("Briefing: Das Briefing wird vom Unternehmen bis "), y);
            doc.setFont("helvetica", "normal");
            doc.text(" bereitgestellt.", 30 + doc.getTextWidth("Briefing: Das Briefing wird vom Unternehmen bis ") + doc.getTextWidth(briefingDate), y);
            y += 8;
            
            // Skript mit hervorgehobenen Variablen - verbesserte Ausrichtung
            if (scriptDate && scriptDate !== '[Datum/Uhrzeit]') {
                doc.text("Skript: Sofern vereinbart, erstellt der Influencer ein Skript und übermittelt es zur", 30, y);
                y += 5;
                doc.text("Freigabe bis ", 30, y);
                doc.setFont("helvetica", "bold");
                doc.text(scriptDate, 30 + doc.getTextWidth("Freigabe bis "), y);
                doc.setFont("helvetica", "normal");
                doc.text("/", 30 + doc.getTextWidth("Freigabe bis ") + doc.getTextWidth(scriptDate) + 2, y);
                doc.setFont("helvetica", "bold");
                doc.text(scriptTime, 30 + doc.getTextWidth("Freigabe bis ") + doc.getTextWidth(scriptDate) + doc.getTextWidth("/") + 4, y);
                doc.setFont("helvetica", "normal");
                doc.text(".", 30 + doc.getTextWidth("Freigabe bis ") + doc.getTextWidth(scriptDate) + doc.getTextWidth("/") + doc.getTextWidth(scriptTime) + 6, y);
            } else {
                doc.text("Skript: Sofern vereinbart, erstellt der Influencer ein Skript und übermittelt es zur", 30, y);
                y += 5;
                doc.text("Freigabe bis [Datum/Uhrzeit].", 30, y);
            }
            y += 8;
            
            // Produktion mit hervorgehobenen Variablen - verbesserte Ausrichtung
            doc.text("Produktion: Die Produktion erfolgt im Zeitraum ", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(productionStart, 30 + doc.getTextWidth("Produktion: Die Produktion erfolgt im Zeitraum "), y);
            doc.setFont("helvetica", "normal");
            doc.text(" – ", 30 + doc.getTextWidth("Produktion: Die Produktion erfolgt im Zeitraum ") + doc.getTextWidth(productionStart), y);
            doc.setFont("helvetica", "bold");
            doc.text(productionEnd, 30 + doc.getTextWidth("Produktion: Die Produktion erfolgt im Zeitraum ") + doc.getTextWidth(productionStart) + doc.getTextWidth(" – "), y);
            
            if (productionLocation && productionLocation !== '[Adresse]') {
                doc.setFont("helvetica", "normal");
                doc.text(", ggf. am Produktionsort ", 30 + doc.getTextWidth("Produktion: Die Produktion erfolgt im Zeitraum ") + doc.getTextWidth(productionStart) + doc.getTextWidth(" – ") + doc.getTextWidth(productionEnd), y);
                y += 5;
                doc.setFont("helvetica", "bold");
                doc.text(productionLocation, 30, y);
                doc.setFont("helvetica", "normal");
                doc.text(".", 30 + doc.getTextWidth(productionLocation), y);
            } else {
                doc.setFont("helvetica", "normal");
                doc.text(".", 30 + doc.getTextWidth("Produktion: Die Produktion erfolgt im Zeitraum ") + doc.getTextWidth(productionStart) + doc.getTextWidth(" – ") + doc.getTextWidth(productionEnd), y);
            }
            y += 8;
            
            // §5 Produktion & Freigabe - Ende
            y += 8;
            
            // Neue Seite für §6 Vergütung
            doc.addPage();
            y = 30; // Zurück zur Startposition
            
            // §6 Vergütung
            y = addParagraphTitle(doc, "§6 Vergütung", y);
            
            // Nettovergütung mit hervorgehobener Variable und Euro-Zeichen - VERBESSERT
            doc.text("Die Nettovergütung beträgt", 30, y);
            doc.setFont("helvetica", "bold");
            // Reduziere den Abstand um 10 Punkte
            doc.text(compensation + " €", 30 + doc.getTextWidth("Die Nettovergütung beträgt ") - 10, y);
            doc.setFont("helvetica", "normal");
            // Passe auch den Punkt entsprechend an
            doc.text(".", 30 + doc.getTextWidth("Die Nettovergütung beträgt ") + doc.getTextWidth(compensation + " €") - 10, y);
            y += 8;
            
            doc.text("Die Rechnungsstellung erfolgt nach Veröffentlichung.", 30, y);
            y += 8;
            
            // Zahlungsziel mit verbesserten Checkboxen
            doc.text("Das Zahlungsziel beträgt", 30, y);
            
            // Zeichne Checkboxen manuell mit dünneren Linien
            if (paymentTerm === "14 Tage") {
                doc.rect(120, y - 3.5, 4, 4);
                doc.setLineWidth(0.2); // Dünnere Linie
                doc.line(120, y - 3.5, 124, y + 0.5);
                doc.line(120, y + 0.5, 124, y - 3.5);
                doc.setLineWidth(0.3); // Zurück zur Standard-Liniendicke
                doc.text("14 Tage", 127, y);
            } else {
                doc.rect(120, y - 3.5, 4, 4);
                doc.text("14 Tage", 127, y);
            }
            
            y += 6;
            if (paymentTerm === "30 Tage") {
                doc.rect(120, y - 3.5, 4, 4);
                doc.setLineWidth(0.2); // Dünnere Linie
                doc.line(120, y - 3.5, 124, y + 0.5);
                doc.line(120, y + 0.5, 124, y - 3.5);
                doc.setLineWidth(0.3); // Zurück zur Standard-Liniendicke
                doc.text("30 Tage", 127, y);
            } else {
                doc.rect(120, y - 3.5, 4, 4);
                doc.text("30 Tage", 127, y);
            }
            
            y += 6;
            if (paymentTerm === "45 Tage") {
                doc.rect(120, y - 3.5, 4, 4);
                doc.setLineWidth(0.2); // Dünnere Linie
                doc.line(120, y - 3.5, 124, y + 0.5);
                doc.line(120, y + 0.5, 124, y - 3.5);
                doc.setLineWidth(0.3); // Zurück zur Standard-Liniendicke
                doc.text("45 Tage", 127, y);
            } else {
                doc.rect(120, y - 3.5, 4, 4);
                doc.text("45 Tage", 127, y);
            }
            y += 8;
            
            // Zusätzliche Vergütung mit verbesserten Checkboxen
            doc.text("Eine zusätzliche Vergütung", 30, y);
            
            if (additionalCompNo) {
                doc.rect(120, y - 3.5, 4, 4);
                doc.setLineWidth(0.2); // Dünnere Linie
                doc.line(120, y - 3.5, 124, y + 0.5);
                doc.line(120, y + 0.5, 124, y - 3.5);
                doc.setLineWidth(0.3); // Zurück zur Standard-Liniendicke
                doc.text("ist nicht", 127, y);
            } else {
                doc.rect(120, y - 3.5, 4, 4);
                doc.text("ist nicht", 127, y);
            }
            
            y += 6;
            if (additionalCompYes) {
                doc.rect(120, y - 3.5, 4, 4);
                doc.setLineWidth(0.2); // Dünnere Linie
                doc.line(120, y - 3.5, 124, y + 0.5);
                doc.line(120, y + 0.5, 124, y - 3.5);
                doc.setLineWidth(0.3); // Zurück zur Standard-Liniendicke
                doc.text("ist vereinbart: ", 127, y);
                doc.setFont("helvetica", "bold");
                doc.text(additionalCompText, 127 + doc.getTextWidth("ist vereinbart: "), y);
                doc.setFont("helvetica", "normal");
            } else {
                doc.rect(120, y - 3.5, 4, 4);
                doc.text("ist vereinbart: ", 127, y);
                doc.setFont("helvetica", "bold");
                doc.text(additionalCompText, 127 + doc.getTextWidth("ist vereinbart: "), y);
                doc.setFont("helvetica", "normal");
            }
            y += 8;
            
            doc.text("Bei Nichterfüllung entfällt die Vergütungspflicht.", 30, y);
            y += 12;
            
            // §7 Qualität & Upload
            y = addParagraphTitle(doc, "§7 Qualität & Upload", y);
            
            doc.text("Die Inhalte sind in hochwertiger Bild- und Tonqualität zu erstellen. Untertitel und", 30, y);
            y += 5;
            doc.text("Grafiken sind korrekt zu platzieren. Der Upload erfolgt ausschließlich via Drive,", 30, y);
            y += 5;
            doc.text("WeTransfer oder E-Mail (kein Messenger). Dateibenennung:", 30, y);
            y += 5;
            doc.text("[Unternehmen_Creator_VideoX_VersionY]", 30, y);
            y += 10;
            
            // §8 Rechte Dritter & Musik
            y = addParagraphTitle(doc, "§8 Rechte Dritter & Musik", y);
            
            doc.text("Der Influencer darf keine fremden Marken, Logos oder Namen ohne Zustimmung", 30, y);
            y += 5;
            doc.text("verwenden. Persönlichkeitsrechte Dritter dürfen nicht verletzt werden. Bei Nutzung", 30, y);
            y += 5;
            doc.text("lizenzfreier Musik ist die Quelle anzugeben. Für alle Verstöße haftet der Influencer.", 30, y);
            y += 12;
            
            // Neue Seite für die restlichen Paragraphen
            doc.addPage();
            y = 30; // Zurück zur Startposition
            
            // §9 Werbekennzeichnung & Exklusivität
            y = addParagraphTitle(doc, "§9 Werbekennzeichnung & Exklusivität", y);
            
            doc.text("Der Influencer verpflichtet sich zur ordnungsgemäßen Werbekennzeichnung", 30, y);
            y += 5;
            // Reguläre Anführungszeichen für die Darstellung
            doc.text('("Werbung" / "Anzeige"). Bei einem Verstoß dagegen, haftet der Influencer für die', 30, y);
            y += 5;
            doc.text("entstandenen Schäden.", 30, y);
            y += 12;
            
            // §10 Verbindlichkeit Briefing & Skript
            y = addParagraphTitle(doc, "§10 Verbindlichkeit Briefing & Skript", y);
            
            doc.text("Der Influencer verpflichtet sich, die im Briefing festgelegten Do's and Don'ts sowie alle", 30, y);
            y += 5;
            doc.text("sonstigen schriftlichen Vorgaben und das ggf. freigegebene Skript vollständig", 30, y);
            y += 5;
            doc.text("einzuhalten.", 30, y);
            y += 8;
            
            doc.text("Bei Verstoß kann das Unternehmen:", 30, y);
            y += 5;
            doc.text("1. Nachbesserung verlangen", 30, y);
            y += 5;
            doc.text("2. eine Neuproduktion auf eigene Kosten fordern", 30, y);
            y += 5;
            doc.text("3. bei wiederholtem Verstoß vom Vertrag zurücktreten", 30, y);
            y += 8;
            
            doc.text("Vergütung entfällt bei Nichterfüllung.", 30, y);
            y += 12;
            
            // §11 Datenschutz & Vertraulichkeit
            y = addParagraphTitle(doc, "§11 Datenschutz & Vertraulichkeit", y);
            
            doc.text("Beide Parteien verpflichten sich zur Einhaltung der DSGVO. Daten werden", 30, y);
            y += 5;
            doc.text("ausschließlich zur Vertragserfüllung genutzt. Vertraulichkeit gilt auch über das", 30, y);
            y += 5;
            doc.text("Vertragsende hinaus.", 30, y);
            y += 12;
            
            // §12 Schlussbestimmungen - Korrigierte und optimierte Version
            y = addParagraphTitle(doc, "§12 Schlussbestimmungen", y);
            
            // Text in einem Stück mit korrekter Ausrichtung ohne Abstände - VERBESSERT
            let schlussText = "Änderungen bedürfen der Schriftform. Gerichtsstand ist ";
            doc.text(schlussText, 30, y);
            doc.setFont("helvetica", "bold");
            // Reduziere den Abstand um 15 Punkte
            doc.text(companyCity, 30 + doc.getTextWidth(schlussText) - 15, y);
            doc.setFont("helvetica", "normal");
            // Passe auch den nachfolgenden Text entsprechend an
            doc.text(". Es gilt das Recht der", 30 + doc.getTextWidth(schlussText) + doc.getTextWidth(companyCity) - 15, y);
            
            y += 8; // Abstand nach der ersten Zeile
            
            doc.text("Bundesrepublik Deutschland. Sollte eine Bestimmung unwirksam sein, bleibt der", 30, y);
            y += 8; // Abstand nach der zweiten Zeile
            
            doc.text("Vertrag im Übrigen wirksam.", 30, y);
            
            // Verbesserte Unterschriftsfelder mit vorausgefülltem Ort und Datum
            addSignatureFields(doc, companyCity);
            
            // Wasserzeichen hinzufügen
            addWatermark(doc);
            
            // PDF speichern
            doc.save('influencer-marketing-vertrag.pdf');
            console.log('PDF saved successfully');
            
            // Erfolgsanzeige - mit Null-Check
            const successAnimation = document.getElementById('success-animation');
            if (successAnimation) {
                successAnimation.classList.remove('hidden');
            } else {
                console.log("Element 'success-animation' nicht gefunden. Erfolgsanimation kann nicht angezeigt werden.");
            }
            
        } catch (error) {
            console.error('Ein Fehler ist während der PDF-Generierung aufgetreten:', error);
            alert('Beim Generieren des PDFs ist ein Fehler aufgetreten: ' + error.message);
        }
    }

    // Generieren-Button
    const generateButton = document.getElementById('generate-contract');
    if (generateButton) {
        generateButton.addEventListener('click', function() {
            // Validierung aller Schritte vor der PDF-Generierung
            let allStepsValid = true;
            
            for (let i = 1; i <= 9; i++) {
                const stepSection = document.getElementById(`step-${i}`);
                if (stepSection) {
                    const requiredFields = stepSection.querySelectorAll('[required]');
                    requiredFields.forEach(field => {
                        if (!field.value.trim()) {
                            allStepsValid = false;
                            // Navigiere zum ersten Schritt mit fehlenden Pflichtfeldern
                            if (i < currentStep) {
                                goToStep(i);
                                markInvalidFieldsInCurrentStep();
                                return;
                            }
                        }
                    });
                }
                
                if (!allStepsValid) break;
            }
            
            if (allStepsValid) {
                console.log('Vertrag wird generiert...');
                
                // Direkter Aufruf der generatePDF-Funktion
                try {
                    generatePDF();
                    showSuccessAnimation();
                } catch (error) {
                    console.error("Fehler bei der PDF-Generierung:", error);
                    alert('Bei der Generierung des Vertrags ist ein Fehler aufgetreten: ' + error.message);
                }
            } else {
                showValidationError();
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
            }
            // Überprüfe den Button-Status für den aktuellen Schritt
            validateCurrentStep();
            updateProgress();
        });
    });

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

    // Initial den Weiter-Button des aktuellen Schritts validieren
    validateCurrentStep();
    
    // Initialisierung der Fortschrittsanzeige
    updateProgress();
});

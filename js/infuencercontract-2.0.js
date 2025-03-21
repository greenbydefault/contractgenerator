document.addEventListener('DOMContentLoaded', (event) => {
    console.log("Dokument vollständig geladen und bereit.");

    if (typeof jsPDF === 'undefined') {
        console.error('jsPDF ist nicht geladen oder nicht definiert.');
        return;
    } else {
        console.log('jsPDF erfolgreich geladen.');
    }
    
    // Füge autoTable hinzu, falls verfügbar
    if (typeof jspdf !== 'undefined' && typeof jspdf.jsPDF !== 'undefined' && typeof jspdf.jsPDF.autoTableSetDefaults !== 'undefined') {
        jspdf.jsPDF.autoTableSetDefaults({
            headStyles: { fillColor: [220, 220, 220], textColor: 40 },
            styles: { font: 'helvetica', fontStyle: 'normal' }
        });
    }

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

    // Funktion zum Hinzufügen von Unterschriftsfeldern
    function addSignatureFields(doc) {
        // Stellen Sie sicher, dass wir am Ende des Dokuments arbeiten
        let y = doc.internal.pageSize.height - 50; // 50 Einheiten vom unteren Rand

        doc.text("Ort, Datum", 30, y);
        doc.text("Ort, Datum", 120, y);
        y += 20;
        
        // Unterschriftslinien
        doc.line(30, y, 90, y); // Linie für Unternehmen
        doc.line(120, y, 180, y); // Linie für Influencer
        y += 10;
        
        doc.text("[Unterschrift Unternehmen]", 30, y);
        doc.text("[Unterschrift Influencer]", 120, y);
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
    
    // Funktion zum Hervorheben von Variablen im Text
    function renderLabeledValue(doc, label, value, x, y) {
        doc.setFont("helvetica", "normal");
        doc.text(label, x, y);
        
        // Variable in Fettschrift
        doc.setFont("helvetica", "bold");
        doc.text(value, x + doc.getTextWidth(label), y);
        
        // Reset Font für weitere Operationen
        doc.setFont("helvetica", "normal");
        
        return doc.getTextWidth(label) + doc.getTextWidth(value);
    }

    // Hauptfunktion zum Generieren des PDFs
    function generatePDF() {
        console.log('Starting PDF generation');
        try {
            // Daten aus dem Formular extrahieren
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
            
            // Kunde/Marke (falls vorhanden)
            const clientNameEl = document.getElementById('client-name');
            const clientName = clientNameEl ? clientNameEl.value : '[Name / Marke, Adresse]';
            
            const clientAddressEl = document.getElementById('client-address');
            const clientAddress = clientAddressEl ? clientAddressEl.value : '';
            
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
            
            // Client info falls vorhanden
            const clientInfo = clientAddress ? clientName + ", " + clientAddress : clientName;
            doc.text("Das Unternehmen handelt dabei als bevollmächtigte Agentur des Kunden " + clientInfo + ".", 30, y);
            y += 5;
            doc.text("Alle Leistungen erfolgen im Namen und auf Rechnung des Unternehmens.", 30, y);
            y += 12;
            
            // §2 Plattformen & Veröffentlichung
            y = addParagraphTitle(doc, "§2 Plattformen & Veröffentlichung", y);
            doc.text("Die Veröffentlichung der Inhalte erfolgt auf folgenden Plattformen:", 30, y);
            y += 8;
            
            // Plattformen auflisten - verbesserter Ansatz ohne Unicode-Spacing-Probleme
            y = renderCheckbox(doc, instagramSelected, "Instagram (Profil: ", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(instagramUsername, 30 + doc.getTextWidth("Instagram (Profil: ") + 7, y);
            doc.setFont("helvetica", "normal");
            doc.text(")", 30 + doc.getTextWidth("Instagram (Profil: ") + 7 + doc.getTextWidth(instagramUsername), y);
            y += 6;
            
            y = renderCheckbox(doc, tiktokSelected, "TikTok (Profil: ", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(tiktokUsername, 30 + doc.getTextWidth("TikTok (Profil: ") + 7, y);
            doc.setFont("helvetica", "normal");
            doc.text(")", 30 + doc.getTextWidth("TikTok (Profil: ") + 7 + doc.getTextWidth(tiktokUsername), y);
            y += 6;
            
            y = renderCheckbox(doc, youtubeSelected, "YouTube (Profil: ", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(youtubeUrl, 30 + doc.getTextWidth("YouTube (Profil: ") + 7, y);
            doc.setFont("helvetica", "normal");
            doc.text(")", 30 + doc.getTextWidth("YouTube (Profil: ") + 7 + doc.getTextWidth(youtubeUrl), y);
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
            renderCheckbox(doc, collabPost, "Co-Autoren-Post (Instagram Collab): Ja", 30, y);
            y += 6;
            
            // Checkbox für Veröffentlichung durch Unternehmen
            renderCheckbox(doc, companyPublication, "Veröffentlichung des Contents durch das Unternehmen / den Kunden auf dessen", 30, y);
            y += 5;
            doc.text("eigenem Kanal: Ja", 30 + 7, y);
            y += 6;
            
            // Checkbox für keine Veröffentlichung
            renderCheckbox(doc, noCompanyPublication, "Keine zusätzliche Veröffentlichung durch das Unternehmen: Ja", 30, y);
            
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
                doc.text("→ Inhalte verbleiben ausschließlich beim Influencer und dürfen nicht für Werbung", 30, y);
                y += 5;
                doc.text("   genutzt werden.", 30, y);
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
            doc.text("berechtigt, die Inhalte dem benannten Kunden zur Nutzung zu überlassen.", 30, y);
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
            doc.text("Briefing: Das Briefing wird vom Unternehmen bis", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(briefingDate, 30 + doc.getTextWidth("Briefing: Das Briefing wird vom Unternehmen bis "), y);
            doc.setFont("helvetica", "normal");
            doc.text("bereitgestellt.", 30 + doc.getTextWidth("Briefing: Das Briefing wird vom Unternehmen bis ") + doc.getTextWidth(briefingDate) + 2, y);
            y += 8;
            
            // Skript mit hervorgehobenen Variablen - verbesserte Ausrichtung
            if (scriptDate && scriptDate !== '[Datum/Uhrzeit]') {
                doc.text("Skript: Sofern vereinbart, erstellt der Influencer ein Skript und übermittelt es zur", 30, y);
                y += 5;
                doc.text("Freigabe bis", 30, y);
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
            doc.text("Produktion: Die Produktion erfolgt im Zeitraum", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(productionStart, 30 + doc.getTextWidth("Produktion: Die Produktion erfolgt im Zeitraum "), y);
            doc.setFont("helvetica", "normal");
            doc.text("–", 30 + doc.getTextWidth("Produktion: Die Produktion erfolgt im Zeitraum ") + doc.getTextWidth(productionStart) + 3, y);
            doc.setFont("helvetica", "bold");
            doc.text(productionEnd, 30 + doc.getTextWidth("Produktion: Die Produktion erfolgt im Zeitraum ") + doc.getTextWidth(productionStart) + doc.getTextWidth("–") + 6, y);
            
            if (productionLocation && productionLocation !== '[Adresse]') {
                doc.setFont("helvetica", "normal");
                doc.text(", ggf. am Produktionsort", 30 + doc.getTextWidth("Produktion: Die Produktion erfolgt im Zeitraum ") + doc.getTextWidth(productionStart) + doc.getTextWidth(" – ") + doc.getTextWidth(productionEnd), y);
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
            
            // Nettovergütung mit hervorgehobener Variable und Euro-Zeichen
            doc.text("Die Nettovergütung beträgt ", 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(compensation + " €", 30 + doc.getTextWidth("Die Nettovergütung beträgt "), y);
            doc.setFont("helvetica", "normal");
            doc.text(".", 30 + doc.getTextWidth("Die Nettovergütung beträgt ") + doc.getTextWidth(compensation + " €"), y);
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
            
            // Text in einem Stück mit korrekter Ausrichtung ohne Abstände
            let schlussText = "Änderungen bedürfen der Schriftform. Gerichtsstand ist ";
            doc.text(schlussText, 30, y);
            doc.setFont("helvetica", "bold");
            doc.text(companyCity, 30 + doc.getTextWidth(schlussText), y);
            doc.setFont("helvetica", "normal");
            doc.text(". Es gilt das Recht der", 30 + doc.getTextWidth(schlussText) + doc.getTextWidth(companyCity), y);
            
            y += 8; // Abstand nach der ersten Zeile
            
            doc.text("Bundesrepublik Deutschland. Sollte eine Bestimmung unwirksam sein, bleibt der", 30, y);
            y += 8; // Abstand nach der zweiten Zeile
            
            doc.text("Vertrag im Übrigen wirksam.", 30, y);
            
            y += 30; // Großzügiger Abstand vor den Unterschriftsfeldern (aber nicht zu groß)
            
            // Nur ein Satz von Unterschriftsfeldern, optimiert und mit mehr Platz
            doc.text("Ort, Datum", 50, y);
            doc.text("Ort, Datum", 140, y);
            y += 15; // Sinnvoller Abstand für die Datumsangabe
            
            // Unterschriftslinien
            doc.line(30, y, 90, y); // Linie für Unternehmen
            doc.line(120, y, 180, y); // Linie für Influencer
            y += 8; // Abstand nach den Linien
            
            doc.text("[Unterschrift Unternehmen]", 35, y);
            doc.text("[Unterschrift Influencer]", 125, y);
            
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
    
    // Helfer-Funktion zum Formatieren von Datumsangaben
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE');
    }
    
    // Event-Listener für den "Vertrag generieren"-Button
    const generateContractButton = document.getElementById('generate-contract');
    if (generateContractButton) {
        generateContractButton.addEventListener('click', function() {
            console.log('Generate contract button clicked');
            
            // Prüfen, ob Pflichtfelder ausgefüllt sind
            const requiredFields = document.querySelectorAll('.form-input-field[required]');
            let allFilled = true;
            
            requiredFields.forEach(field => {
                if (field.value.trim() === '') {
                    allFilled = false;
                    field.classList.add('error');
                }
            });
            
            if (!allFilled) {
                alert('Bitte fülle alle erforderlichen Felder aus, bevor du den Vertrag generierst.');
                return;
            }
            
            generatePDF();
        });
    } else {
        console.log("Element 'generate-contract' nicht gefunden. Button-Ereignisbehandlung konnte nicht hinzugefügt werden.");
    }
    
    // Event-Listener für den Download-Button
    const downloadButton = document.getElementById('download-button');
    if (downloadButton) {
        downloadButton.addEventListener('click', function() {
            const successAnimation = document.getElementById('success-animation');
            if (successAnimation) {
                successAnimation.classList.add('hidden');
            }
        });
    } else {
        console.log("Element 'download-button' nicht gefunden. Button-Ereignisbehandlung konnte nicht hinzugefügt werden.");
    }
});

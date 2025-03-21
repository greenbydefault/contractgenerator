document.addEventListener('DOMContentLoaded', (event) => {
    console.log("Dokument vollständig geladen und bereit.");

    if (typeof jsPDF === 'undefined') {
        console.error('jsPDF ist nicht geladen oder nicht definiert.');
        return;
    } else {
        console.log('jsPDF erfolgreich geladen.');
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
        doc.text('Name: ' + companyName, 30, 160);
        doc.text('Vertreten durch: ' + companyContact, 30, 170);
        doc.text('Straße: ' + companyStreet + ', Nr.: ' + companyNumber, 30, 180);
        doc.text('PLZ: ' + companyZip + ', Stadt: ' + companyCity + ', Land: ' + companyCountry, 30, 190);
        
        doc.setFont("helvetica", "bold");
        doc.text('Influencer (Creator):', 30, 210);
        doc.setFont("helvetica", "normal");
        doc.text('Name: ' + influencerName, 30, 220);
        doc.text('Straße: ' + influencerStreet + ', Nr.: ' + influencerNumber, 30, 230);
        doc.text('PLZ: ' + influencerZip + ', Stadt: ' + influencerCity + ', Land: ' + influencerCountry, 30, 240);
        
        // Nächste Seite
        doc.addPage();
    }

    // Funktion zum Hinzufügen von Unterschriftenfeldern
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

    // Hauptfunktion zum Generieren des PDFs
    function generatePDF() {
        console.log('Starting PDF generation');
        try {
            // Daten aus dem Formular extrahieren
            // Unternehmen (Auftraggeber)
            const companyName = document.getElementById('company-name').value || '[Name des Unternehmens]';
            const companyContact = document.getElementById('company-contact').value || '[Ansprechpartner]';
            const companyStreet = document.getElementById('company-street').value || '[Straße]';
            const companyNumber = document.getElementById('company-number').value || '[Hausnummer]';
            const companyZip = document.getElementById('company-zip').value || '[PLZ]';
            const companyCity = document.getElementById('company-city').value || '[Stadt]';
            const companyCountry = document.getElementById('company-country').value || '[Land]';
            
            // Influencer (Creator)
            const influencerName = document.getElementById('influencer-name').value || '[Name des Influencers]';
            const influencerStreet = document.getElementById('influencer-street').value || '[Straße Creator]';
            const influencerNumber = document.getElementById('influencer-number').value || '[Hausnummer Creator]';
            const influencerZip = document.getElementById('influencer-zip').value || '[PLZ Creator]';
            const influencerCity = document.getElementById('influencer-city').value || '[Stadt Creator]';
            const influencerCountry = document.getElementById('influencer-country').value || '[Land Creator]';
            
            // Kunde/Marke (falls vorhanden)
            const clientName = document.getElementById('client-name').value || '[Name / Marke, Adresse]';
            const clientAddress = document.getElementById('client-address').value || '';
            
            // Plattformen
            const instagramSelected = document.getElementById('platform-instagram').checked;
            const instagramUsername = document.getElementById('instagram-username').value || '[@nutzername]';
            const tiktokSelected = document.getElementById('platform-tiktok').checked;
            const tiktokUsername = document.getElementById('tiktok-username').value || '[@nutzername]';
            const youtubeSelected = document.getElementById('platform-youtube').checked;
            const youtubeUrl = document.getElementById('youtube-url').value || '[URL]';
            const otherSelected = document.getElementById('platform-other').checked;
            const otherPlatform = document.getElementById('other-platform').value || '[frei eintragen]';
            
            // Inhalte
            const storySlides = document.getElementById('story-slides').value || '[Anzahl]';
            const reelsTiktok = document.getElementById('reels-tiktok').value || '[Anzahl]';
            const feedPosts = document.getElementById('feed-posts').value || '[Anzahl]';
            const youtubeVideos = document.getElementById('youtube-videos').value || '[Anzahl]';
            
            // Zusätzliche Vereinbarungen
            const collabPost = document.getElementById('collab-post').checked;
            const companyPublication = document.getElementById('company-publication').checked;
            const noCompanyPublication = document.getElementById('no-company-publication').checked;
            
            // Media Buyout
            const mediaBuyoutYes = document.getElementById('media-buyout-yes').checked;
            const mediaBuyoutNo = document.getElementById('media-buyout-no').checked;
            
            // Werbekanäle
            const adInstagram = document.getElementById('ad-instagram')?.checked || false;
            const adFacebook = document.getElementById('ad-facebook')?.checked || false;
            const adTiktok = document.getElementById('ad-tiktok')?.checked || false;
            const adOther = document.getElementById('ad-other')?.checked || false;
            
            // Werbeoptionen
            const whitelisting = document.getElementById('whitelisting')?.checked || false;
            const sparkAd = document.getElementById('spark-ad')?.checked || false;
            
            // Nutzungsdauer
            let usageDuration = '';
            if (document.getElementById('duration-3')?.checked) usageDuration = '3 Monate';
            else if (document.getElementById('duration-6')?.checked) usageDuration = '6 Monate';
            else if (document.getElementById('duration-12')?.checked) usageDuration = '12 Monate';
            else if (document.getElementById('duration-unlimited')?.checked) usageDuration = 'Unbegrenzt';
            else usageDuration = ''; // Wenn nichts ausgewählt ist
            
            // Zeitplan
            const briefingDate = formatDate(document.getElementById('briefing-date').value) || '[Datum]';
            const scriptDate = formatDate(document.getElementById('script-date').value) || '[Datum/Uhrzeit]';
            const scriptTime = document.getElementById('script-time').value || '12:00';
            const productionStart = formatDate(document.getElementById('production-start').value) || '[von]';
            const productionEnd = formatDate(document.getElementById('production-end').value) || '[bis]';
            const productionLocation = document.getElementById('production-location').value || '[Adresse]';
            const deliveryDate = formatDate(document.getElementById('delivery-date').value) || '[Datum]';
            const deliveryTime = document.getElementById('delivery-time').value || '12:00';
            const publicationDate = formatDate(document.getElementById('publication-date').value) || '[Datum]';
            
            // Vergütung
            const compensation = document.getElementById('compensation').value || '[€ Betrag]';
            let paymentTerm = '';
            if (document.getElementById('term-14').checked) paymentTerm = '14 Tage';
            else if (document.getElementById('term-30').checked) paymentTerm = '30 Tage';
            else if (document.getElementById('term-45').checked) paymentTerm = '45 Tage';
            else paymentTerm = '';
            
            const additionalCompYes = document.getElementById('additional-yes')?.checked || false;
            const additionalCompNo = document.getElementById('additional-no')?.checked || false;
            const additionalCompText = document.getElementById('additional-comp-text')?.value || '[Textfeld falls ja]';

            // PDF erstellen
            const doc = new jsPDF();
            
            // Deckblatt hinzufügen
            addCoverPage(doc, companyName, companyContact, companyStreet, companyNumber, companyZip, companyCity, companyCountry, influencerName, influencerStreet, influencerNumber, influencerZip, influencerCity, influencerCountry);
            
            // Vertragsinhalt
            let y = 30;
            
            // §1 Vertragsgegenstand
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("§1 Vertragsgegenstand", 30, y);
            y += 10;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("Der Influencer verpflichtet sich zur Erstellung und Veröffentlichung werblicher Inhalte", 30, y);
            y += 6;
            doc.text("zugunsten des Unternehmens bzw. einer vom Unternehmen vertretenen Marke.", 30, y);
            y += 8;
            
            // Client info falls vorhanden
            const clientInfo = clientAddress ? clientName + ", " + clientAddress : clientName;
            doc.text("Das Unternehmen handelt dabei als bevollmächtigte Agentur des Kunden " + clientInfo + ".", 30, y);
            y += 6;
            doc.text("Alle Leistungen erfolgen im Namen und auf Rechnung des Unternehmens.", 30, y);
            y += 12;
            
            // §2 Plattformen & Veröffentlichung
            doc.setFont("helvetica", "bold");
            doc.text("§2 Plattformen & Veröffentlichung", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Die Veröffentlichung der Inhalte erfolgt auf folgenden Plattformen:", 30, y);
            y += 8;
            
            // Plattformen auflisten
            if (instagramSelected) {
                doc.text("☒ Instagram (Profil: " + instagramUsername + ")", 30, y);
            } else {
                doc.text("☐ Instagram (Profil: " + instagramUsername + ")", 30, y);
            }
            y += 6;
            
            if (tiktokSelected) {
                doc.text("☒ TikTok (Profil: " + tiktokUsername + ")", 30, y);
            } else {
                doc.text("☐ TikTok (Profil: " + tiktokUsername + ")", 30, y);
            }
            y += 6;
            
            if (youtubeSelected) {
                doc.text("☒ YouTube (Profil: " + youtubeUrl + ")", 30, y);
            } else {
                doc.text("☐ YouTube (Profil: " + youtubeUrl + ")", 30, y);
            }
            y += 6;
            
            if (otherSelected) {
                doc.text("☒ Sonstiges: " + otherPlatform, 30, y);
            } else {
                doc.text("☐ Sonstiges: " + otherPlatform, 30, y);
            }
            y += 10;
            
            // Inhalte
            doc.text("Folgende Inhalte werden erstellt und veröffentlicht:", 30, y);
            y += 8;
            doc.text("• Story-Slides: " + storySlides, 30, y);
            y += 6;
            doc.text("• Reels / TikTok Videos: " + reelsTiktok, 30, y);
            y += 6;
            doc.text("• Feed-Posts (Bild/Karussell): " + feedPosts, 30, y);
            y += 6;
            doc.text("• YouTube Video: " + youtubeVideos, 30, y);
            y += 10;
            
            // Zusätzliche Vereinbarungen
            doc.text("Zusätzlich wird vereinbart:", 30, y);
            y += 8;
            
            if (collabPost) {
                doc.text("☒ Co-Autoren-Post (Instagram Collab): Ja", 30, y);
            } else {
                doc.text("☐ Co-Autoren-Post (Instagram Collab): Ja", 30, y);
            }
            y += 6;
            
            if (companyPublication) {
                doc.text("☒ Veröffentlichung des Contents durch das Unternehmen / den Kunden auf dessen", 30, y);
                y += 6;
                doc.text("eigenem Kanal: Ja", 30, y);
            } else {
                doc.text("☐ Veröffentlichung des Contents durch das Unternehmen / den Kunden auf dessen", 30, y);
                y += 6;
                doc.text("eigenem Kanal: Ja", 30, y);
            }
            y += 6;
            
            if (noCompanyPublication) {
                doc.text("☒ Keine zusätzliche Veröffentlichung durch das Unternehmen: Ja", 30, y);
            } else {
                doc.text("☐ Keine zusätzliche Veröffentlichung durch das Unternehmen: Ja", 30, y);
            }
            
            // Neue Seite für §3
            doc.addPage();
            y = 30;
            
            // §3 Nutzung für Werbung (Media Buyout)
            doc.setFont("helvetica", "bold");
            doc.text("§3 Nutzung für Werbung (Media Buyout)", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Darf der erstellte Content für Werbezwecke genutzt werden?", 30, y);
            y += 8;
            
            if (mediaBuyoutYes) {
                doc.text("☒ Ja", 30, y);
                y += 8;
                
                // Kanäle
                doc.text("– Kanäle:", 30, y);
                if (adInstagram) {
                    doc.text("☒ Instagram", 70, y);
                } else {
                    doc.text("☐ Instagram", 70, y);
                }
                
                if (adFacebook) {
                    doc.text("☒ Facebook", 110, y);
                } else {
                    doc.text("☐ Facebook", 110, y);
                }
                
                if (adTiktok) {
                    doc.text("☒ TikTok", 150, y);
                } else {
                    doc.text("☐ TikTok", 150, y);
                }
                y += 6;
                
                if (adOther) {
                    doc.text("☒ Sonstiges", 70, y);
                } else {
                    doc.text("☐ Sonstiges", 70, y);
                }
                y += 8;
                
                // Whitelisting
                doc.text("– Whitelisting (Meta):", 30, y);
                if (whitelisting) {
                    doc.text("☒ Ja", 70, y);
                } else {
                    doc.text("☐ Ja", 70, y);
                }
                y += 6;
                
                // Spark Ad
                doc.text("– Spark Ad (TikTok):", 30, y);
                if (sparkAd) {
                    doc.text("☒ Ja", 70, y);
                } else {
                    doc.text("☐ Ja", 70, y);
                }
                y += 6;
                
                // Nutzungsdauer
                doc.text("– Nutzungsdauer:", 30, y);
                if (usageDuration === "3 Monate") {
                    doc.text("☒ 3 Monate", 70, y);
                } else {
                    doc.text("☐ 3 Monate", 70, y);
                }
                
                if (usageDuration === "6 Monate") {
                    doc.text("☒ 6 Monate", 110, y);
                } else {
                    doc.text("☐ 6 Monate", 110, y);
                }
                
                if (usageDuration === "12 Monate") {
                    doc.text("☒ 12 Monate", 150, y);
                } else {
                    doc.text("☐ 12 Monate", 150, y);
                }
                y += 6;
                
                if (usageDuration === "Unbegrenzt") {
                    doc.text("☒ Unbegrenzt", 70, y);
                } else {
                    doc.text("☐ Unbegrenzt", 70, y);
                }
                
            } else {
                doc.text("☐ Ja", 30, y);
                y += 8;
                doc.text("☒ Nein", 30, y);
                y += 6;
                doc.text("→ Inhalte verbleiben ausschließlich beim Influencer und dürfen nicht für Werbung", 30, y);
                y += 6;
                doc.text("genutzt werden.", 30, y);
            }
            y += 12;
            
            // §4 Rechteübertragung
            doc.setFont("helvetica", "bold");
            doc.text("§4 Rechteübertragung", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Nur bei Zustimmung zur Nutzung für Werbung (§3) überträgt der Influencer dem", 30, y);
            y += 6;
            doc.text("Unternehmen für die gewählte Nutzungsdauer ein einfaches Nutzungsrecht an den", 30, y);
            y += 6;
            doc.text("erstellten Inhalten zur Verwendung in den vereinbarten Kanälen. Das Unternehmen ist", 30, y);
            y += 6;
            doc.text("berechtigt, die Inhalte dem benannten Kunden zur Nutzung zu überlassen.", 30, y);
            y += 8;
            doc.text("Die Inhalte dürfen technisch angepasst und bearbeitet werden. Die Weitergabe an", 30, y);
            y += 6;
            doc.text("sonstige Dritte ist nicht gestattet. Nach Ablauf der Nutzungsdauer erlischt das", 30, y);
            y += 6;
            doc.text("Nutzungsrecht.", 30, y);
            y += 12;
            
            // §5 Produktion & Freigabe
            doc.setFont("helvetica", "bold");
            doc.text("§5 Produktion & Freigabe", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Briefing: Das Briefing wird vom Unternehmen bis " + briefingDate + " bereitgestellt.", 30, y);
            y += 8;
            
            if (scriptDate && scriptDate !== '[Datum/Uhrzeit]') {
                doc.text("Skript: Sofern vereinbart, erstellt der Influencer ein Skript und übermittelt es zur", 30, y);
                y += 6;
                doc.text("Freigabe bis " + scriptDate + "/" + scriptTime + ".", 30, y);
            } else {
                doc.text("Skript: Sofern vereinbart, erstellt der Influencer ein Skript und übermittelt es zur", 30, y);
                y += 6;
                doc.text("Freigabe bis [Datum/Uhrzeit].", 30, y);
            }
            y += 8;
            
            // Produktion
            doc.text("Produktion: Die Produktion erfolgt im Zeitraum " + productionStart + " – " + productionEnd, 30, y);
            if (productionLocation && productionLocation !== '[Adresse]') {
                doc.text(", ggf. am Produktionsort", 30 + doc.getTextWidth("Produktion: Die Produktion erfolgt im Zeitraum " + productionStart + " – " + productionEnd), y);
                y += 6;
                doc.text(productionLocation + ".", 30, y);
            } else {
                doc.text(".", 30 + doc.getTextWidth("Produktion: Die Produktion erfolgt im Zeitraum " + productionStart + " – " + productionEnd), y);
            }
            y += 8;
            
            // Überprüfen, ob wir eine neue Seite benötigen
            if (y > 250) {
                doc.addPage();
                y = 30;
            }
            
            // Abgabe
            doc.text("Abgabe: Die finale Content-Abgabe erfolgt bis " + deliveryDate + "/" + deliveryTime + ".", 30, y);
            y += 8;
            
            // Veröffentlichung
            doc.text("Veröffentlichung: Geplanter Veröffentlichungstermin: " + publicationDate, 30, y);
            y += 8;
            
            doc.text("Maximal zwei Korrekturschleifen sind vereinbart. Eine Produktion darf erst nach", 30, y);
            y += 6;
            doc.text("Freigabe durch das Unternehmen erfolgen.", 30, y);
            y += 8;
            
            doc.text("Exklusivität am Tag der Veröffentlichung:", 30, y);
            y += 6;
            doc.text("Der Creator verpflichtet sich am Tag der Veröffentlichung für keine andere Marke", 30, y);
            y += 6;
            doc.text("Werbung auf dem Kanal zu platzieren.", 30, y);
            y += 12;
            
            // §6 Vergütung
            doc.setFont("helvetica", "bold");
            doc.text("§6 Vergütung", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Die Nettovergütung beträgt " + compensation + ".", 30, y);
            y += 8;
            
            doc.text("Die Rechnungsstellung erfolgt nach Veröffentlichung.", 30, y);
            y += 8;
            
            // Zahlungsziel
            doc.text("Das Zahlungsziel beträgt ", 30, y);
            if (paymentTerm === "14 Tage") {
                doc.text("☒ 14 Tage ", 160, y, null, null, "right");
            } else {
                doc.text("☐ 14 Tage ", 160, y, null, null, "right");
            }
            
            y += 6;
            if (paymentTerm === "30 Tage") {
                doc.text("☒ 30 Tage ", 160, y, null, null, "right");
            } else {
                doc.text("☐ 30 Tage ", 160, y, null, null, "right");
            }
            
            y += 6;
            if (paymentTerm === "45 Tage") {
                doc.text("☒ 45 Tage.", 160, y, null, null, "right");
            } else {
                doc.text("☐ 45 Tage.", 160, y, null, null, "right");
            }
            y += 8;
            
            // Zusätzliche Vergütung
            doc.text("Eine zusätzliche Vergütung ", 30, y);
            if (additionalCompNo) {
                doc.text("☒ ist nicht ", 160, y, null, null, "right");
            } else {
                doc.text("☐ ist nicht ", 160, y, null, null, "right");
            }
            
            y += 6;
            if (additionalCompYes) {
                doc.text("☒ ist vereinbart: " + additionalCompText, 160, y, null, null, "right");
            } else {
                doc.text("☐ ist vereinbart: " + additionalCompText, 160, y, null, null, "right");
            }
            y += 8;
            
            doc.text("Bei Nichterfüllung entfällt die Vergütungspflicht.", 30, y);
            y += 12;
            
            // Neue Seite wenn nötig
            if (y > 250) {
                doc.addPage();
                y = 30;
            }
            
            // §7 Qualität & Upload
            doc.setFont("helvetica", "bold");
            doc.text("§7 Qualität & Upload", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Die Inhalte sind in hochwertiger Bild- und Tonqualität zu erstellen. Untertitel und", 30, y);
            y += 6;
            doc.text("Grafiken sind korrekt zu platzieren. Der Upload erfolgt ausschließlich via Drive,", 30, y);
            y += 6;
            doc.text("WeTransfer oder E-Mail (kein Messenger). Dateibenennung:", 30, y);
            y += 6;
            doc.text("[Unternehmen_Creator_VideoX_VersionY]", 30, y);
            y += 12;
            
            // §8 Rechte Dritter & Musik
            doc.setFont("helvetica", "bold");
            doc.text("§8 Rechte Dritter & Musik", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Der Influencer darf keine fremden Marken, Logos oder Namen ohne Zustimmung", 30, y);
            y += 6;
            doc.text("verwenden. Persönlichkeitsrechte Dritter dürfen nicht verletzt werden. Bei Nutzung", 30, y);
            y += 6;
            doc.text("lizenzfreier Musik ist die Quelle anzugeben. Für alle Verstöße haftet der Influencer.", 30, y);
            y += 12;
            
            // §9 Werbekennzeichnung & Exklusivität
            doc.setFont("helvetica", "bold");
            doc.text("§9 Werbekennzeichnung & Exklusivität", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Der Influencer verpflichtet sich zur ordnungsgemäßen Werbekennzeichnung", 30, y);
            y += 6;
            // Reguläre Anführungszeichen für die Darstellung
            doc.text('("Werbung" / "Anzeige"). Bei einem Verstoß dagegen, haftet der Influencer für die', 30, y);
            y += 6;
            doc.text("entstandenen Schäden.", 30, y);
            y += 12;
            
            // Neue Seite wenn nötig
            if (y > 250) {
                doc.addPage();
                y = 30;
            }
            
            // §10 Verbindlichkeit Briefing & Skript
            doc.setFont("helvetica", "bold");
            doc.text("§10 Verbindlichkeit Briefing & Skript", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Der Influencer verpflichtet sich, die im Briefing festgelegten Do's and Don'ts sowie alle", 30, y);
            y += 6;
            doc.text("sonstigen schriftlichen Vorgaben und das ggf. freigegebene Skript vollständig", 30, y);
            y += 6;
            doc.text("einzuhalten.", 30, y);
            y += 8;
            
            doc.text("Bei Verstoß kann das Unternehmen:", 30, y);
            y += 6;
            doc.text("1. Nachbesserung verlangen", 30, y);
            y += 6;
            doc.text("2. eine Neuproduktion auf eigene Kosten fordern", 30, y);
            y += 6;
            doc.text("3. bei wiederholtem Verstoß vom Vertrag zurücktreten", 30, y);
            y += 8;
            
            doc.text("Vergütung entfällt bei Nichterfüllung.", 30, y);
            y += 12;
            
            // §11 Datenschutz & Vertraulichkeit
            doc.setFont("helvetica", "bold");
            doc.text("§11 Datenschutz & Vertraulichkeit", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Beide Parteien verpflichten sich zur Einhaltung der DSGVO. Daten werden", 30, y);
            y += 6;
            doc.text("ausschließlich zur Vertragserfüllung genutzt. Vertraulichkeit gilt auch über das", 30, y);
            y += 6;
            doc.text("Vertragsende hinaus.", 30, y);
            y += 12;
            
            // Neue Seite wenn nötig
            if (y > 250) {
                doc.addPage();
                y = 30;
            }
            
            // §12 Schlussbestimmungen
            doc.setFont("helvetica", "bold");
            doc.text("§12 Schlussbestimmungen", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Änderungen bedürfen der Schriftform. Gerichtsstand ist " + companyCity + ". Es gilt das Recht der", 30, y);
            y += 6;
            doc.text("Bundesrepublik Deutschland. Sollte eine Bestimmung unwirksam sein, bleibt der", 30, y);
            y += 6;
            doc.text("Vertrag im Übrigen wirksam.", 30, y);
            y += 30;
            
            // Unterschriftsfelder hinzufügen
            addSignatureFields(doc);
            
            // Wasserzeichen hinzufügen
            addWatermark(doc);
            
            // PDF speichern
            doc.save('influencer-marketing-vertrag.pdf');
            console.log('PDF saved successfully');
            
            // Erfolgsanzeige
            document.getElementById('success-animation').classList.remove('hidden');
            
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
    document.getElementById('generate-contract').addEventListener('click', function() {
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
    
    // Event-Listener für den Download-Button
    document.getElementById('download-button').addEventListener('click', function() {
        document.getElementById('success-animation').classList.add('hidden');
    });
});

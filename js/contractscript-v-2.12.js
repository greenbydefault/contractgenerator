document.addEventListener('DOMContentLoaded', (event) => {
    console.log("Dokument vollständig geladen und bereit.");

    if (typeof jsPDF === 'undefined') {
        console.error('jsPDF ist nicht geladen oder nicht definiert.');
        return;
    } else {
        console.log('jsPDF erfolgreich geladen.');
    }
function addWatermark(doc) {
    const totalPages = doc.internal.getNumberOfPages();

    // Setze Schriftart und Größe für das Wasserzeichen
    doc.setFont('helvetica');
    doc.setFontSize(7);
    doc.setTextColor(130); // Graue Farbe für das Wasserzeichen

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        // Berechne die X- und Y-Position für das Wasserzeichen, um es in den unteren Ecken zu platzieren
        const pageSize = doc.internal.pageSize;
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

        // Optional: Setze das Wasserzeichen auch in die untere rechte Ecke
        const watermarkTextWidth = doc.getTextWidth('Created with creatorjobs.com');
        doc.text('Created with creatorjobs.com', pageWidth - watermarkTextWidth - 10, pageHeight - 10);
    }
}
function addCoverPage(doc, brandName, brandStreet, brandHouseNumber, brandPLZ, brandCity, brandCountry, creatorName, creatorStreet, creatorHouseNumber, creatorPLZ, creatorCity, creatorCountry) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text('Kooperationsvertrag', 105, 80, null, null, 'center');
    doc.setFont("helvetica", "normal");	
    doc.setFontSize(12);
    doc.text('zwischen', 105, 90, null, null, 'center');
    // Unternehmen
    let y = 100;
    doc.text(brandName, 105, y, null, null, 'center');
    y += 6;
    doc.text(`${brandStreet} ${brandHouseNumber}`, 105, y, null, null, 'center');
    y += 6;
    doc.text(`${brandPLZ} ${brandCity}`, 105, y, null, null, 'center');
    y += 6;
    doc.text(brandCountry, 105, y, null, null, 'center');
    y += 10;
    doc.text('- im Folgenden kurz "Unternehmen" genannt –', 105, y, null, null, 'center');
    y += 20;	
    doc.text('und', 105, y, null, null, 'center');
    // Creator
    y += 10;
    doc.text(creatorName, 105, y, null, null, 'center');
    y += 6;
    doc.text(`${creatorStreet} ${creatorHouseNumber}`, 105, y, null, null, 'center');
    y += 6;
    doc.text(`${creatorPLZ} ${creatorCity}`, 105, y, null, null, 'center');
    y += 6;
    doc.text(creatorCountry, 105, y, null, null, 'center');
    y += 20;
    doc.text('- im Folgenden kurz "Creator" genannt -', 105, y, null, null, 'center');
    
    // Nächste Seite für Inhaltsverzeichnis und Vertragstext
    doc.addPage();
}
 function addSignatureFields(doc) {
    // Stellen Sie sicher, dass wir am Ende des Dokuments arbeiten
    //doc.addPage(); // Fügen Sie diese Zeile hinzu, wenn Sie möchten, dass die Unterschriftenseite eine eigene Seite ist

    // Setzen der Y-Position für den Beginn der Unterschriftenfelder
    let y = doc.internal.pageSize.height - 160; // Beispiel: 90 Einheiten vom unteren Rand

    // Allgemeine Einstellungen für die Position
    const leftColumnX = 30; // X-Position für das linke Feld (Brand)
    const rightColumnX = doc.internal.pageSize.width / 2 + 20; // X-Position für das rechte Feld (Creator), basierend auf der Seitenbreite
    doc.setFontSize(9);
    // Text für das Brand
    doc.text("Ort:", leftColumnX, y);
    doc.text("Datum:", leftColumnX, y + 10);
    doc.text("Unterschrift:", leftColumnX, y + 20);
    // Linie für die Unterschrift des Brands
    doc.line(leftColumnX, y + 25, leftColumnX + 60, y + 25); // Unterschriftlinie

    // Text für den Creator
    doc.text("Ort:", rightColumnX, y);
    doc.text("Datum:", rightColumnX, y + 10);
    doc.text("Unterschrift:", rightColumnX, y + 20);
    // Linie für die Unterschrift des Creators
    doc.line(rightColumnX, y + 25, rightColumnX + 60, y + 25); // Unterschriftlinie
}

	
function addTableOfContents(doc, y) {
    y += 30;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Inhaltsverzeichnis", 30, y);
    y += 10;

    const contents = [
        "1. Rechte und Pflichten des Creators								         3",
            "	 1.1. Verpflichtung zur Erstellung von Content 						   3",
	    "	 1.2. Verpflichtung zur Erstellung von Content 						   3",
	    "	 1.3. Verpflichtung zur Einhaltung von Deadlines 					      4",
	    "	 1.4. Verpflichtung zur Erstellung von Skripten   					        4",
		    "	 1.5. Verpflichtung zur ordnungsgemäßen Bereitstellung der Videos                 5",
	    "	 1.6. Verpflichtung zur Anpassung am erstellten Inhalt 				      5",
	    "	 1.7. Verpflichtung zur ordnungsgemäßen Erstellung der Rechnung	          6",
	 "2. Rechte und Pflichten des Unternehmens							        7",	
	 "3. Vertragsdauer, Beendigung, Nutzungsrecht							   7",   
	 "4. Vertraulichkeit, Geheimhaltung 								              8",
	 "5. Datenschutz 											                   8", 
         "6. Sonstiges												                8", 
    ];

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    contents.forEach(line => {
        doc.text(line, 30, y);
        y += 6;
    });
    return y;
}
	
    function generatePDF() {
        console.log('Starting PDF generation');
        try {
			const selectValue = document.getElementById('vertrag-type-select').value;
            		const brandName = document.getElementById('vertrag-brandname').value;
			const brandStreet = document.getElementById('vertrag-brand-street').value;
			const brandHouseNumber = document.getElementById('vertrag-brand-housenumber').value;
			const brandPLZ = document.getElementById('vertrag-brand-plz').value;
			const brandCity = document.getElementById('vertrag-brand-city').value;
			const brandCountry = document.getElementById('vertrag-brand-country').value;
			const anzahlVideos = document.getElementById('vertrag-anzahl-video').value;
			const videoDauer = document.getElementById('vertrag-video-dauer').value;
			const abgabeScript = document.getElementById('vertrag-abgabe-script').value;
			const abgabeContent = document.getElementById('vertrag-abgabe-content').value;
			const abgabeKorrektur = document.getElementById('vertrag-abgabe-korrektur').value;
			const abgabeZweiteKorrektur = document.getElementById('vertrag-abgabe-zweite-korrektur').value;
			const jobBezahlung = document.getElementById('vertrag-job-bezahlung').value;
			const jobDauer = document.getElementById('vertrag-video-nutzungsdauer').value;
		        // Creator Daten
			const creatorName = document.getElementById('vertrag-creator-name').value;
			const creatorStreet = document.getElementById('vertrag-creator-street').value;
			const creatorHouseNumber = document.getElementById('vertrag-creator-housenumber').value;
			const creatorPLZ = document.getElementById('vertrag-creator-plz').value;
			const creatorCity = document.getElementById('vertrag-creator-city').value;
			const creatorCountry = document.getElementById('vertrag-creator-country').value;
			//Adressdaten
			let contractualRightName, contractualRightsStreet, contractualRightsHouseNumber, contractualRightsPLZ, contractualRightsCity, contractualRightsCountry;
			if (selectValue === 'Ja') {
			        // Verwende die Daten von 'vertrag-kunde-' Feldern für den unteren Teil
			        contractualRightName = document.getElementById('vertrag-kunde-name').value;
			        contractualRightsStreet = document.getElementById('vertrag-kunde-street').value;
				contractualRightsNumber = document.getElementById('vertrag-kunde-housenumber').value;
				contractualRightsPLZ = document.getElementById('vertrag-kunde-plz').value;
				contractualRightsCity = document.getElementById('vertrag-kunde-city').value;
				contractualRightsCountry = document.getElementById('vertrag-kunde-country').value;
			        // ...setze dies fort für die anderen benötigten Felder
			} else {
			        // Verwende die gleichen Daten wie für das Deckblatt
			        contractualRightName = brandName;
				contractualRightsStreet = brandStreet
				contractualRightsHouseNumber = brandHouseNumber
				contractualRightsPLZ = brandPLZ
				contractualRightsCity = brandCity
				contractualRightsCountry = brandCountry
			        // ...setze dies fort für die anderen benötigten Felder
		  	  }
            // Fügen Sie hier alle weiteren Variablen ein, die Sie aus dem Formular holen möchten

            const doc = new jsPDF();
	    const imgData = 'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAABBAAD/4QMxaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA5LjAtYzAwMCA3OS5kYTRhN2U1ZWYsIDIwMjIvMTEvMjItMTM6NTA6MDcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCAyNC4xIChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkMxQ0M0RjFDQURDNjExRUQ4RDFERDdDNDQ3RTc2RUE2IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkMxQ0M0RjFEQURDNjExRUQ4RDFERDdDNDQ3RTc2RUE2Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QzFDQzRGMUFBREM2MTFFRDhEMUREN0M0NDdFNzZFQTYiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QzFDQzRGMUJBREM2MTFFRDhEMUREN0M0NDdFNzZFQTYiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAFBAQEBAQFBAQFBwUE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';
            doc.addImage(imgData, 'JPEG', 88, 30, 32, 32);
	    
	    addCoverPage(doc, brandName, brandStreet, brandHouseNumber, brandPLZ, brandCity, brandCountry, creatorName, creatorStreet, creatorHouseNumber, creatorPLZ, creatorCity, creatorCountry, jobBezahlung);
            console.log('jsPDF instance created');
            doc.setFont("Helvetica");
            doc.setFontSize(10);
	    doc.setCharSpace(5);
           	
            
            doc.addPage();
	    let y = 10;	
	    y = addTableOfContents(doc, y);
			// Define the static parts of the contract and insert dynamic values
			const contractText = [
				"1. Rechte und Pflichten des Creators",
				"1.1. Verpflichtung zur Erstellung von Content",
				"        1.1.1. Der Creator verpflichtet sich, gemäß dem Briefing für das",
				"                  Unternehmen User-Generated-Content Videos zu erstellen.",
				`        1.1.2. Die Anzahl der Videos beläuft sich auf: ${anzahlVideos} Videos mit einer`,
				`                  Länge von ${videoDauer} Sekunden.`,
				`        1.1.3. Der Creator erhält eine Festpreisvergütung von ${jobBezahlung} € netto für die`,
				"                  genannten Leistungen.",
				"        1.1.4. Der Content Creator erklärt sich damit einverstanden, sämtliche",
				"                  Kosten im Zusammenhang mit der Umsetzung des Videos",
				"                  eigenständig zu tragen, es sei denn, es wurde ausdrücklich und",
				"                  schriftlich etwas anderes vereinbart, z.B. über Mailverkehr.",
				"        1.1.5. Der Creator erbringt seine Dienstleistungen selbst, kann aber",
				"                  Erfüllungsgehilfen beauftragen. Die Kosten dafür trägt der Creator",
				"                  selbst.",
				"        1.1.6. Der Creator wird sich ausführlich mit dem Unternehmen und dessen",
				"                  Social-Media-Kanälen auseinandersetzen, um die Marke zu verstehen",
				"                  und sicherzustellen, dass der Content optimal mit den",
				"                  Social-Media-Strategien des Unternehmens harmoniert.",
				"        1.1.7. Der Creator darf die User-Generated-Content-Videos auf seinem Kanal",
				"                  nur nach schriftlicher Freigabe durch das Unternehmen posten und als",
				"                  Referenz nutzen.",
				"        1.1.8. Das Unternehmen haftet nicht für Schäden oder Verluste, die dem",
				"                  Creator während der Ausführung des Auftrags entstehen.",

				"1.2. Verpflichtung zur Einhaltung von Deadlines",

				"        1.2.1. Der Creator verpflichtet sich alle Deadlines einzuhalten. Das",
				"                  Unternehmen kann die Zusammenarbeit fristlos beenden, wenn der",
				"                  Creator eine der genannten Deadlines nicht einhält und ist daraufhin",
				"                  nicht verpflichtet, für entstandene Kosten aufzukommen.",
				"        1.2.1.1. Sollten die Deadlines aufgrund einer Verzögerung seitens des",
				"                  Unternehmens nicht eingehalten werden können, so",
				"                  verschieben sich die Deadlines in diesem Vertrag automatisch",
				"                  um die Anzahl der Wochentage des verzögerten Zeitraums.",
				"        1.2.2. Der Creator ist dazu verpflichtet, etwaige Verzögerungen seinerseits",
				"                  durch Urlaube oder andere Verhinderungen frühzeitig mitzuteilen.",
				"        1.2.3. Folgende Deadlines sind einzuhalten:",
				`        1.2.4. Abgabe des Skripts: ${abgabeScript} um 12:00 Uhr mittags`,
				`        1.2.5. Abgabe des Contents: ${abgabeContent} um 12:00 Uhr mittags`,
				`        1.2.6. Abgabe der Korrektur: ${abgabeKorrektur} um 12:00 Uhr mittags`,
				`        1.2.7. Abgabe der zweiten Korrektur: ${abgabeZweiteKorrektur} um 12:00 Uhr mittags`,
				"        1.2.8. Der Vertrag muss vom Creator innerhalb von 3 Tagen nach Erhalt",
				"                  unterschrieben werden, sonst kann das Unternehmen den Auftrag an",
				"                  einen anderen Creator vergeben.",

				"1.3. Verpflichtung zur Erstellung von Skripten",

				"        1.3.1. Der Content Creator verpflichtet sich zur Erstellung eines detaillierten",
				"                  Skripts für die Videos unter Berücksichtigung der folgenden Punkte:",
				"        1.3.2. Das Skript umfasst Setting, Hook, Hauptteil und Call-To-Action und",
				"                  wird eng an den Job-Informationen, dem Briefing des Unternehmens",
				"                  sowie den zu vermittelnden Botschaften orientiert sein.",
				"        1.3.3. Das Skript umfasst eine klare und präzise Beschreibung des textlichen",
				"                  und bildlichen Umfelds, einschließlich relevanter Details zu einzelnen",
				"                  Szenen.",
				"        1.3.4. Das Skript umfasst eine Integration von überzeugendem Storytelling",
				"                  und einer effektiven Dramaturgie, um die Aufmerksamkeit zu fesseln,",
				"                  die Botschaft zu vermitteln und gewünschte Aktionen zu fördern.",
				"        1.3.5. Das Skript erfüllt alle Vorgaben, Anforderungen und Stilrichtlinien",
				"                  gemäß den bereitgestellten Job-Informationen und dem Briefing des",
				"                  Unternehmens.",
				"        1.3.6. Sollte das erstellte Skript nicht den festgelegten Anforderungen des",
				"                  Unternehmens entsprechen, behält sich das Unternehmen das Recht",
				"                  vor, den Content Creator zur Anpassung des Skripts aufzufordern.",
				"                  Maximal jedoch zweimal. Sollte anschließend das Skript immer noch",
				"                  nicht den Anforderungen genügen, behält sich das Unternehmen das",
				"                  Recht vor, diesen Vertrag fristlos zu kündigen.",
				"        1.3.7. Das Unternehmen behält sich das Recht vor, Anpassungen am Skript",
				"                  vor der Videoproduktion selbst vorzunehmen, die anschließend so",
				"                  vom Creator umgesetzt werden.",
				"        1.3.8. Der Creator verpflichtet sich, die Videoproduktion erst zu starten,",
				"                  nachdem die Skripte final freigegeben wurden. Ansonsten müssen die",
				"                  Videos neu gedreht werden.",
				"        1.3.9. Jegliche Änderungen vom Creator am Skript müssen in Absprache mit",
				"                  dem Unternehmen erfolgen und dürfen nicht im Widerspruch zu den",
				"                  Grundsätzen oder Zielen des Unternehmens stehen.",

				"1.4. Verpflichtung zur ordnungsgemäßen Bereitstellung der Videos",

				"        1.4.1. Der Content Creator verpflichtet sich zur ordnungsgemäßen",
				"                  Bereitstellung der produzierten Videos unter Berücksichtigung",
				"                  folgender Bestimmungen:",
				"        1.4.2. Der Creator produziert Videos mit einheitlichem Ton und",
				"                  höchstmöglicher Auflösung.",
				"        1.4.3. Der Creator achtet auf die Platzierung von Untertiteln, Texten, Grafiken",
				"                  der Buttons bei der Nutzung auf Social Media - sogenannte Safe",
				"                  Spaces.",
				"        1.4.4. Die Bild- und Tonqualität gewährleisten eine adäquate Erfüllung der",
				"                  visuellen Anforderungen des Unternehmens.",
				"        1.4.5. Die Videos werden ausschließlich über geeignete Plattformen wie z.B.",
				"                  “Google Drive” oder “WeTransfer” zur Verfügung gestellt, die eine",
				"                  sichere und effiziente Übertragung ermöglichen. Die Verwendung von",
				"                  Messaging-Diensten wie z.B. “WhatsApp” ist für diesen Zweck nicht",
				"                  gestattet. Die Übertragung muss per Mail erfolgen.",
				"        1.4.6. Der Content Creator wird jedes abgelieferte Video nach dem",
				"                  folgenden Benennungsschema benennen und abgeben:",
				"                  'Unternehmen_Creator_Video_Nummer X des Videos_VersionY'",

				"1.5. Verpflichtung zur Bewahrung der Rechte Dritter",

				"        1.5.1. Der Creator stellt sicher, dass in den Videos keine",
				"                  Persönlichkeitsrechte von Privatpersonen oder Markenrechte verletzt",
				"                  werden.",
				"        1.5.2. Der Creator verpflichtet sich, in den erstellten Videos keine anderen",
				"                  Marken zu erwähnen oder darzustellen, es sei denn, dies wurde",
				"                  ausdrücklich schriftlich mit dem Unternehmen vereinbart.",
				"        1.5.3. Der Creator gewährleistet, dass in den Videos keine Namen oder",
				"                  Darstellungen von Privatpersonen verwendet werden, deren Rechte",
				"                  ohne ausdrückliche Genehmigung verletzt werden.",
				"        1.5.4. Sollte der Creator entgegen dieser Vereinbarung handeln und andere",
				"                  Markenrechte oder Persönlichkeitsrechte in den Videos verletzen,",
				"                  haftet der Creator für sämtliche daraus entstehenden Schäden.",
				"        1.5.5. Der Creator verpflichtet sich, das Unternehmen unverzüglich zu",
				"                  informieren, falls er versehentlich gegen diese Klausel verstoßen hat,",
				"                  um gemeinsam eine Lösung zu finden.",
				"        1.5.6. Verwendest du lizenzfreie Musik in deinen Videos, so bist du dazu",
				"                  verpflichtet, dem Unternehmen die jeweilige Quelle zur Verfügung zu",
				"                  stellen.",

				"1.6. Verpflichtung zur Anpassung am erstellten Inhalt",

				"        1.6.1. Der Creator verpflichtet sich, Änderungen am erstellten Inhalt gemäß",
				"                  den berechtigten Anforderungen des Unternehmens vorzunehmen, um",
				"                  sicherzustellen, dass der Content den Qualitätsstandards und den",
				"                  spezifischen Anforderungen des Unternehmens entspricht. Das",
				"                  Unternehmen behält sich das Recht vor, den Vertrag zu kündigen,",
				"                  wenn der Creator wiederholt (zwei Korrekturen) die Qualitätsstandards",
				"                  nicht erfüllt. Die Feedbackschleife umfasst dabei folgende Punkte:",
				"        1.6.2. Der Creator wird berechtigte Anfragen des Unternehmens",
				"                  berücksichtigen, die darauf abzielen, den Inhalt zu verbessern, ohne",
				"                  dabei die grundlegende Botschaft oder Idee zu verändern.",
				"        1.6.3. Der Creator akzeptiert berechtigte Anpassungen am gesprochenen",
				"                  Text, vorausgesetzt, dass die vorab genehmigten Abschnitte im Skript",
				"                  unberührt bleiben.",
				"        1.6.4. Der Creator wird Änderungen am Voice Over vornehmen, um",
				"                  sicherzustellen, dass der Ton und die Stimmung den Vorgaben des",
				"                  Unternehmens entsprechen.",
				"        1.6.5. Der Creator wird alle Do’s & Dont’s, wie im vorher festgelegten Briefing",
				"                  vereinbart, beachten. Abweichungen müssen auf berechtigtes",
				"                  Anfordern des Unternehmens korrigiert werden, um einen",
				"                  Vertragsbruch zu vermeiden.",
				"        1.6.6. Der Creator wird Anpassungen am Schnitt vornehmen, um eine",
				"                  bessere Erzählstruktur sicherzustellen.",
				"        1.6.7. Der Creator wird berechtigte Anfragen des Unternehmens zur",
				"                  Verbesserung der Tonqualität umsetzen.",
				"        1.6.8. Der Creator wird Anpassungen vornehmen, um die Bildqualität zu",
				"                  verbessern und sicherzustellen, dass das visuelle Material den",
				"                  Standards des Unternehmens entspricht.",
				"        1.6.9. Der Creator wird berechtigte Anfragen des Unternehmens zur",
				"                  Anpassung der Videolänge umsetzen.",
				"        1.6.10. Der Creator wird unverzüglich auf berechtigtes Feedback des",
				"                  Unternehmens reagieren und alle erforderlichen Korrekturen an",
				"                  Falschinformationen vornehmen.",
				"        1.6.11. Der Creator wird berechtigte Anfragen des Unternehmens zur",
				"                  Verbesserung von Rechtschreibung, Grammatik und Interpunktion in",
				"                  den Untertiteln umsetzen.",
				"        1.6.12. Der Creator wird die Inhalte neu aufnehmen oder schneiden, wenn die",
				"                  Videos beide identisch aufgenommen wurden (gleiches Setting,",
				"                  gleiche Klamotten). Dies gilt nicht, wenn der Dreh vor Ort ist oder",
				"                   nderweitige Vereinbarungen getroffen wurden.",

				"1.7. Verpflichtung zur ordnungsgemäßen Erstellung der Rechnung",

				"        1.7.1. Der Creator erhält die vereinbarte Vergütung nach erfolgreicher",
				"                  Fertigstellung der Videos und deren Abnahme gemäß den im Vertrag",
				"                  festgelegten Informationen.",
				"        1.7.2. Der Creator ist berechtigt, die Rechnung zu stellen, nachdem der",
				"                  Auftrag gemäß den Vertragsbedingungen erfolgreich abgewickelt",
				"                  wurde, die Videos abgenommen wurden und sämtliche Deadlines",
				"                  fristgerecht eingehalten wurden. Die Rechnung wird im PDF-Format",
				"                  übermittelt.",
				"        1.7.3. Der Creator bestätigt hiermit, dass er gesetzlich dazu berechtigt ist,",
				"                  als Rechnungssteller aufzutreten und sämtliche rechtlichen",
				"                  Anforderungen für die Rechnungsstellung erfüllt.",
				"                1.7.4. Der Creator verpflichtet sich, das Zahlungsziel von 30 Tagen auf die",
				"                  Rechnung zu schreiben.",

				"2. Rechte und Pflichten des Unternehmens",

				"        2.1. Das Unternehmen unterstützt den Creator mit allen erforderlichen",
				"                  Informationen für seine Tätigkeit und hat diese im Briefing verfasst.",
				"        2.2. Falls das Unternehmen während der Zusammenarbeit Änderungen am",
				"                  Briefing oder Skript vornehmen möchte, müssen diese schriftlich festgehalten",
				"                  und von beiden Parteien genehmigt werden.",
				"        2.3. Das Unternehmen verpflichtet sich, Änderungsanfragen des Creators in",
				"                  angemessener Frist zu prüfen und zu beantworten.",
				"        2.4. Das Unternehmen stellt sicher, dass alle notwendigen Ressourcen, wie",
				"                  Materialien, Zugang zu Experten oder technische Unterstützung, zeitnah zur",
				"                  Verfügung stehen, um die Effizienz der Zusammenarbeit zu fördern.",
				"        2.5. Die Rechnung wird binnen 30 Tagen nach Erhalt durch das Unternehmen fällig",
				"                  und wird innerhalb dieses Zeitraums beglichen.",
				"        2.6. Das Unternehmen darf den Creator nicht rechtsgeschäftlich vertreten und",
				"                  respektiert die eigenständige juristische Identität des Creators.",

				"3. Vertragsdauer, Beendigung, Nutzungsrecht",

				"        3.1. Der Vertrag beginnt mit der beidseitigen Unterzeichnung und endet nach",
				"                  Abschluss der Content-Abnahme.",
				"        3.2. Der Creator überträgt dem Unternehmen unwiderruflich, zeitlich und räumlich",
				`                  uneingeschränkte Nutzungsrechte am erstellten Inhalt für ${jobDauer}.`,
				"        3.3. Das Unternehmen darf die erstellten Leistungen des Creators für eigene",
				"                  Werbezwecke nutzen, einschließlich Übersetzungen, Umgestaltungen oder",
				"                  Bearbeitungen.",
				"        3.4. Bei Krankheit oder anderen wichtigen Gründen, die die Leistungserbringung",
				"                  beeinflussen, muss der Creator das Unternehmen innerhalb von zwei Tagen",
				"                  darüber informieren und die voraussichtliche Dauer der Verhinderung",
				"                  angeben.",
				"        3.5. Der Creator muss die Leistungen nach Wegfall der Verhinderung umgehend",
				"                  nachholen, spätestens innerhalb einer Woche, sofern zweckmäßig.",
				"                  Andernfalls kann das Unternehmen den Vertrag auflösen.",
				"        3.6. Der Creator gewährt dem Unternehmen das uneingeschränkte Recht, alle im",
				"                  Rahmen dieses Vertrags erstellten Inhalte, einschließlich Bilder und Videos,",
				"                  an den folgenden Kunden des Unternehmens zu übertragen:",
				"                  ",
				`                  ${contractualRightName}`,
				`                  ${contractualRightsStreet} ${contractualRightsHouseNumber}`,
				`                  ${contractualRightsPLZ} ${contractualRightsCity}`,
				"                  ",
				"        3.6.1. Die Übertragung dieser Rechte an den Kunden erfolgt unter der",
				"                  edingung, dass alle Verpflichtungen, Rechte und Pflichten, die sich",
				"                  aus diesem Vertrag ergeben, auf den Kunden in gleicher Weise",
				"                  übertragen werden, wie sie für das Unternehmen gelten. Insbesondere",
				"                  gilt dies für sämtliche geistigen Eigentumsrechte, Nutzungslizenzen",
				"                  und Haftungsbeschränkungen, die in diesem Vertrag festgelegt sind.",
				"                  Das Unternehmen stellt sicher, dass der Kunde die gleichen",
				"                  rechtlichen Verpflichtungen und Einschränkungen hinsichtlich der",
				"                  Verwendung und Verbreitung der Inhalte einhält, wie sie in diesem",
				"                  Vertrag für die Agentur festgelegt sind.",

				"4. Vertraulichkeit, Geheimhaltung",

				"        4.1. Beide Parteien müssen vertrauliche Informationen vertraulich behandeln, es",
				"                 sei denn, diese sind allgemein bekannt, wurden von einem Dritten mitgeteilt",
				"                 oder waren bereits vor der Übermittlung bekannt.",
				"        4.2. Alle Rechte an den vertraulichen Informationen verbleiben bei der",
				"                 informierenden Partei.",
				"        4.3. Geschäfts- und Betriebsunterlagen müssen ordnungsgemäß aufbewahrt",
				"                 werden, um Dritten den Zugriff zu verwehren.",

				"5. Datenschutz",

				"        5.1. Das Unternehmen erhebt, speichert und verwendet personenbezogene Daten",
				"                 des Creators gemäß DSGVO für die Vertragsdurchführung.",
				"        5.2. Das Unternehmen gewährleistet die Einhaltung der DSGVO und verweist auf",
				"                 seine Datenschutzerklärung für weitere Informationen.",

				"6. Sonstiges",

				"        6.1. Weder das Unternehmen noch der Creator sind berechtigt, die andere Partei",
				"                 rechtsgeschäftlich zu vertreten oder in irgendeiner Weise zu verpflichten, es",
				"                 sei denn, es liegt eine ausdrückliche schriftliche Vollmacht vor.",
				"        6.2. Unwirksame oder undurchführbare Bestimmungen werden durch gültige",
				"                 Regelungen ersetzt, die dem wirtschaftlichen Zweck am nächsten kommen.",
				"        6.3. Nebenabreden bedürfen der Schriftform. Gesetzliche Formerfordernisse",
				"                 bleiben unberührt.",
				"        6.4. Der Vertrag unterliegt dem deutschen Recht, und der Gerichtsstand ist",
				`                 ${brandCity}`
			];
			
		contractText.forEach(line => {
                if (y > 280) {
                    doc.addPage();
                    y = 25;
                }
			const headlineTopPadding = 4; // Abstand über der Überschrift
			const headlineBottomPadding = 4; // Abstand unter der Überschrift

                // Formatierung für Überschriften
                if (line.startsWith('1. Rechte und Pflichten des Creators') || line.startsWith('2. Rechte und Pflichten des Unternehmens') || line.startsWith('3. Vertragsdauer, Beendigung, Nutzungsrecht') || line.startsWith('4. Vertraulichkeit, Geheimhaltung') || line.startsWith('5. Datenschutz') || line.startsWith('6. Sonstiges')) {
                    	y += 5;
			doc.setFontSize(14);
                    	doc.setFont("helvetica", "bold");
                }else if (line.startsWith('        1.1.1. Der Creator verpflichtet sich, gemäß dem Briefing für das') || line.startsWith('        1.2.1. Der Creator verpflichtet sich alle Deadlines einzuhalten. Das') || line.startsWith('        1.3.1. Der Content Creator verpflichtet sich zur Erstellung eines detaillierten') || line.startsWith('        1.4.1. Der Content Creator verpflichtet sich zur ordnungsgemäßen') || line.startsWith('        1.5.1. Der Creator stellt sicher, dass in den Videos keine') || line.startsWith('        1.6.1. Der Creator verpflichtet sich, Änderungen am erstellten Inhalt gemäß') || line.startsWith('        1.7.1. Der Creator erhält die vereinbarte Vergütung nach erfolgreicher') || line.startsWith('        2.1. Das Unternehmen unterstützt den Creator mit allen erforderlichen') || line.startsWith('        3.1. Der Vertrag beginnt mit der beidseitigen Unterzeichnung und endet nach') || line.startsWith('        4.1. Beide Parteien müssen vertrauliche Informationen vertraulich behandeln, es') || line.startsWith('        5.1. Das Unternehmen erhebt, speichert und verwendet personenbezogene Daten') || line.startsWith('        6.1. Weder das Unternehmen noch der Creator sind berechtigt, die andere Partei'))    {
    			y += 5; // Größeres Padding Top für spezifische Unterabschnitte
    			doc.setFontSize(10);
    			doc.setFont("helvetica", "normal");
    			// Kein zusätzliches y += 5 hier, da wir bereits einen größeren Abstand oben eingefügt haben
		} else if (line.startsWith('1.1. Verpflichtung zur Erstellung von Content') || line.startsWith('1.2. Verpflichtung zur Einhaltung von Deadlines') || line.startsWith('1.3. Verpflichtung zur Erstellung von Skripten') || line.startsWith('1.4. Verpflichtung zur ordnungsgemäßen Bereitstellung der Videos') || line.startsWith('1.5. Verpflichtung zur Bewahrung der Rechte Dritter') || line.startsWith('1.6. Verpflichtung zur Anpassung am erstellten Inhalt') || line.startsWith('1.7. Verpflichtung zur ordnungsgemäßen Erstellung der Rechnung')) {
                    	y += 5;
			doc.setFontSize(11);
                    	doc.setFont("helvetica", "bold");
                } else {
                    // Standardformatierung
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "normal");
                }

               doc.text(line, 30, y);
                y += 5;
		});
		
	    addSignatureFields(doc);
	    addWatermark(doc);	
            doc.save('contract.pdf');
            console.log('PDF saved successfully');
        } catch (error) {
            console.error('An error occurred during PDF generation:', error);
        }
    }
    
    const form = document.getElementById('vertragsgenerator-v2');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submission intercepted');
	    
            generatePDF();
        });
    } else {
        console.error('Formular mit ID vertragsgenerator-v2 nicht gefunden.');
    }
});

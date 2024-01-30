document.addEventListener('DOMContentLoaded', (event) => {
    console.log("Dokument vollständig geladen und bereit.");

    if (typeof jsPDF === 'undefined') {
        console.error('jsPDF ist nicht geladen oder nicht definiert.');
        return;
    } else {
        console.log('jsPDF erfolgreich geladen.');
    }

    function generatePDF() {
        console.log('Starting PDF generation');
        try {
            const brandName = document.getElementById('vertrag-brandname').value;
            // Fügen Sie hier alle weiteren Variablen ein, die Sie aus dem Formular holen möchten

            const doc = new jsPDF();
            console.log('jsPDF instance created');
            doc.setFont("Arial");
            doc.setFontSize(10);

            const introText = `Marke: ${brandName}`;
            // Fügen Sie hier alle weiteren Texte ein, die Sie in die PDF aufnehmen möchten

            doc.text(introText, 10, 10); // Position des Textes anpassen
            // Fügen Sie hier weitere doc.text Aufrufe für die anderen Texte ein

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

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument();
const outputPath = path.join(__dirname, 'test_pdf.pdf');
const stream = fs.createWriteStream(outputPath);

doc.pipe(stream);
doc.fontSize(25).text('8º RC MEC - TESTE PDF', 100, 100);
doc.end();

stream.on('finish', () => {
    console.log('PDF generated at ' + outputPath);
});
stream.on('error', (err) => {
    console.error('Error generating PDF:', err);
});

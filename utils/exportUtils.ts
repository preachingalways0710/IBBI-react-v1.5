

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function copyRichText(htmlContent: string) {
  try {
    const plainText = new DOMParser().parseFromString(htmlContent, 'text/html').body.textContent || "";
    const blobHtml = new Blob([htmlContent], { type: 'text/html' });
    const blobText = new Blob([plainText], { type: 'text/plain' });
    const clipboardItem = new ClipboardItem({
      'text/html': blobHtml,
      'text/plain': blobText,
    });
    await navigator.clipboard.write([clipboardItem]);
  } catch (err) {
    console.error('Failed to copy rich text: ', err);
    // Fallback for browsers that might not support ClipboardItem or text/html.
    try {
        await navigator.clipboard.writeText(new DOMParser().parseFromString(htmlContent, 'text/html').body.textContent || "");
    } catch (fallbackErr) {
        console.error('Fallback plain text copy failed: ', fallbackErr);
        alert('Failed to copy.');
    }
  }
}

export async function copyContent(getContent: () => string) {
  try {
    const textToCopy = getContent().replace(/<br\s*\/?>/gi, '\n').replace(/<\/?[^>]+(>|$)/g, "");
    await navigator.clipboard.writeText(textToCopy);
  } catch (err) {
    console.error('Failed to copy text: ', err);
    alert('Failed to copy text.');
  }
}

export async function printContent(getContent: () => string, title: string) {
  const content = getContent();
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; line-height: 1.6; color: #333; }
            h1 { font-size: 2em; }
            h2 { font-size: 1.5em; }
            h2, h3, h4 { color: #000; }
            strong { font-weight: bold; }
            em { font-style: italic; }
            u { text-decoration: underline; }
            s { text-decoration: line-through; }
            p { margin-bottom: 1em; }
            .verse-block { margin-bottom: 1.5em; }
            .commentary-block { margin-top: 0.5em; padding-left: 1.5em; border-left: 2px solid #ccc; }
            ul { list-style-type: disc; margin-left: 20px; }
            ol { list-style-type: decimal; margin-left: 20px; }
            blockquote { border-left: 4px solid #ccc; padding-left: 1em; margin-left: 0; font-style: italic; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          ${content}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}


export async function downloadPdf(getContent: () => string, fileName: string) {
  const content = getContent();
  
  // Create a temporary element to render the HTML for PDF conversion
  const element = document.createElement('div');
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  element.style.width = '800px'; 
  element.style.padding = '20px';
  element.style.fontFamily = 'sans-serif';
  element.style.color = 'black';
  element.innerHTML = content;
  document.body.appendChild(element);

  try {
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    // a4 size in points: 595.28 x 841.89
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    let newImgWidth = pdfWidth - 40; // with margin
    let newImgHeight = newImgWidth / ratio;
    
    if (newImgHeight > pdfHeight - 40) {
        newImgHeight = pdfHeight - 40;
        newImgWidth = newImgHeight * ratio;
    }

    const totalPages = Math.ceil(imgHeight / (pdfHeight * (imgWidth / pdfWidth)));
    let yPos = 0;

    for (let i = 0; i < totalPages; i++) {
        const pageCanvas = await html2canvas(element, {
            scale: 2,
            y: (i * canvas.height / totalPages)
        });
        const pageImgData = pageCanvas.toDataURL('image/png');
        if (i > 0) {
            pdf.addPage();
        }
        pdf.addImage(pageImgData, 'PNG', 20, 20, newImgWidth, newImgHeight, undefined, 'FAST');
    }

    pdf.save(`${fileName}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF.');
  } finally {
    // Clean up the temporary element
    document.body.removeChild(element);
  }
}
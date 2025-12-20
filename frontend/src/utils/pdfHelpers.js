import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function getDocumentPages(url) {
  const pdf = await pdfjsLib.getDocument(url).promise;
  const numPages = pdf.numPages;
  const pages = [];

  for (let i = 1; i <= numPages; i++) {
    pages.push({
      pageIndex: i - 1, // 0-based for backend
      pdfUrl: url,
      originalPageIndex: i
    });
  }
  return pages;
}

export async function renderPage(url, pageIndex, canvas, rotation = 0, signal) {
  if (signal?.aborted) return;
  
  const loadingTask = pdfjsLib.getDocument(url);
  const pdf = await loadingTask.promise;
  
  if (signal?.aborted) return;
  const page = await pdf.getPage(pageIndex + 1);
  
  if (signal?.aborted) return;

  const viewport = page.getViewport({ scale: 1, rotation: rotation });
  const desiredWidth = 240; 
  const scale = desiredWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale: scale, rotation: rotation });

  canvas.height = scaledViewport.height;
  canvas.width = scaledViewport.width;

  const renderContext = {
    canvasContext: canvas.getContext('2d'),
    viewport: scaledViewport,
  };

  const renderTask = page.render(renderContext);
  
  if (signal) {
      signal.addEventListener('abort', () => {
          renderTask.cancel();
      }, { once: true });
  }

  try {
      await renderTask.promise;
  } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
          throw err;
      }
  }
}

import * as pdfjs from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

/** PDF의 한 쪽을 그림(캔버스)으로 그린다. 대표 이미지를 만들 때만 쓰므로, 필요할 때 불러온다. */
export async function renderPdfPage(
  pdf: Blob,
  pageNumber: number,
  targetWidth = 900,
): Promise<{ canvas: HTMLCanvasElement; numPages: number; page: number }> {
  const data = new Uint8Array(await pdf.arrayBuffer())
  const task = pdfjs.getDocument({ data })
  const doc = await task.promise
  try {
    const page = Math.min(Math.max(1, Math.round(pageNumber) || 1), doc.numPages)
    const pdfPage = await doc.getPage(page)
    const base = pdfPage.getViewport({ scale: 1 })
    const viewport = pdfPage.getViewport({ scale: targetWidth / base.width })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas')
    await pdfPage.render({ canvasContext: ctx, canvas, viewport }).promise
    return { canvas, numPages: doc.numPages, page }
  } finally {
    void task.destroy()
  }
}

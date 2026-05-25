import axiosClient from '../axiosClient';

export interface ExportRange {
  /** ISO yyyy-MM-dd, inclusive. */
  from?: string;
  to?: string;
}

/**
 * Browser-initiated downloads. Each call fetches the file as a blob and
 * triggers a synthetic <a download> click — works with HttpOnly cookies
 * because withCredentials is on by default via axiosClient.
 *
 * The filename ultimately written to disk comes from the server's
 * Content-Disposition (which includes the date window when one is passed).
 * `fallback` is only used if the response didn't set one.
 */
async function downloadBlob(url: string, fallback: string, range?: ExportRange): Promise<void> {
  const params: Record<string, string> = {};
  if (range?.from) params.from = range.from;
  if (range?.to) params.to = range.to;

  const res = await axiosClient.get<Blob>(url, {
    responseType: 'blob',
    params: Object.keys(params).length ? params : undefined,
  });

  const filename = parseContentDispositionFilename(res.headers?.['content-disposition']) ?? fallback;
  const blobUrl = window.URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

function parseContentDispositionFilename(header: unknown): string | null {
  if (typeof header !== 'string') return null;
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match ? match[1] : null;
}

export const exportService = {
  downloadCsv: (range?: ExportRange) => downloadBlob('/export/csv', 'expenses.csv', range),
  downloadPdf: (range?: ExportRange) => downloadBlob('/export/pdf', 'expense-report.pdf', range),
};

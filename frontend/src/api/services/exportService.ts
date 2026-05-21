import axiosClient from '../axiosClient';

/**
 * Browser-initiated downloads. Each call fetches the file as a blob and
 * triggers a synthetic <a download> click — works with HttpOnly cookies
 * because withCredentials is on by default via axiosClient.
 */
async function downloadBlob(url: string, filename: string): Promise<void> {
  const res = await axiosClient.get<Blob>(url, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export const exportService = {
  downloadCsv: () => downloadBlob('/export/csv', 'expenses.csv'),
  downloadPdf: () => downloadBlob('/export/pdf', 'expense-report.pdf'),
};

export interface UploadJobResult {
  job_id: string;
  status: string;
  eta_sec?: number | null;
}

function uploadTo(
  url: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadJobResult> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        onProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status === 201) {
        resolve(JSON.parse(xhr.responseText));
        return;
      }
      let msg = "Upload failed";
      try { msg = JSON.parse(xhr.responseText).detail || msg; } catch { /* ignore */ }
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(fd);
  });
}

export function uploadVideo(file: File, onProgress?: (pct: number) => void) {
  return uploadTo("/v1/jobs", file, onProgress);
}

export function uploadGuestVideo(file: File, onProgress?: (pct: number) => void) {
  return uploadTo("/v1/guest/jobs", file, onProgress);
}

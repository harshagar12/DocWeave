let API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Force HTTPS in production to avoid redirect issues (307 vs 301/302)
if (API_URL.includes("onrender.com") && API_URL.startsWith("http:")) {
    API_URL = API_URL.replace("http:", "https:");
}

export async function uploadFiles(files) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append("files", file);
  });

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  return response.json();
}

export async function processPDF(pages, outputName) {
  const response = await fetch(`${API_URL}/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pages: pages,
      output_name: outputName
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Processing failed");
  }

  return response.json();
}

export function getDownloadUrl(path) {
    return `${API_URL}${path}`;
}

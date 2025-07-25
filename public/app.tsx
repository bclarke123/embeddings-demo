import React, { useState } from "react";
import { createRoot } from "react-dom/client";

interface SearchResult {
  content: string;
  scriptTitle: string;
  similarity: number;
  scriptId: number;
}

interface Script {
  id: number;
  title: string;
  uploadedAt: string;
}

function App() {
  const [mode, setMode] = useState<"search" | "upload">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptContent, setScriptContent] = useState("");
  const [scripts, setScripts] = useState<Script[]>([]);
  const [uploadProgress, setUploadProgress] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Search failed:", error);
      alert("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptTitle.trim() || !scriptContent.trim()) {
      alert("Please provide both title and content");
      return;
    }

    setLoading(true);
    setUploadProgress("Uploading and processing script...");
    try {
      const response = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: scriptTitle, content: scriptContent }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        if (data.chunksCreated < data.totalChunks) {
          setUploadProgress(`Partial success: ${data.chunksCreated}/${data.totalChunks} chunks processed. Some chunks failed due to rate limits.`);
        } else {
          setUploadProgress(`Success! Created ${data.chunksCreated} chunks.`);
        }
        setScriptTitle("");
        setScriptContent("");
        loadScripts();
        setTimeout(() => setUploadProgress(""), 5000);
      } else {
        throw new Error(data.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setUploadProgress(`Upload failed: ${errorMessage}`);
      setTimeout(() => setUploadProgress(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const loadScripts = async () => {
    try {
      const response = await fetch("/api/scripts");
      const data = await response.json();
      setScripts(data);
    } catch (error) {
      console.error("Failed to load scripts:", error);
    }
  };

  React.useEffect(() => {
    loadScripts();
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Text Semantic Search</h1>
      
      <div style={styles.nav}>
        <button
          style={{...styles.navButton, ...(mode === "search" ? styles.navButtonActive : {})}}
          onClick={() => setMode("search")}
        >
          Search
        </button>
        <button
          style={{...styles.navButton, ...(mode === "upload" ? styles.navButtonActive : {})}}
          onClick={() => setMode("upload")}
        >
          Upload Document
        </button>
      </div>

      {mode === "search" ? (
        <div>
          <form onSubmit={handleSearch} style={styles.form}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for content (e.g., 'action scene', 'dialogue', 'description')"
              style={styles.input}
              disabled={loading}
            />
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          <div style={styles.results}>
            {results.map((result, index) => (
              <div key={index} style={styles.resultCard}>
                <div style={styles.resultHeader}>
                  <span style={styles.scriptTitle}>{result.scriptTitle}</span>
                  <span style={styles.similarity}>
                    {(result.similarity * 100).toFixed(1)}% match
                  </span>
                </div>
                <p style={styles.resultContent}>{result.content}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <form onSubmit={handleUpload} style={styles.uploadForm}>
            <input
              type="text"
              value={scriptTitle}
              onChange={(e) => setScriptTitle(e.target.value)}
              placeholder="Document title (e.g., 'Chapter 1', 'Meeting Notes')"
              style={styles.input}
              disabled={loading}
            />
            <textarea
              value={scriptContent}
              onChange={(e) => setScriptContent(e.target.value)}
              placeholder="Paste your text content here..."
              style={styles.textarea}
              disabled={loading}
            />
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Processing..." : "Upload Document"}
            </button>
          </form>
          
          {uploadProgress && (
            <div style={styles.progress}>{uploadProgress}</div>
          )}

          <div style={styles.scriptsList}>
            <h3>Uploaded Documents</h3>
            {scripts.map((script) => (
              <div key={script.id} style={styles.scriptItem}>
                {script.title} - {new Date(script.uploadedAt).toLocaleDateString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  title: {
    textAlign: "center" as const,
    marginBottom: "30px",
    color: "#333",
  },
  nav: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "30px",
    gap: "10px",
  },
  navButton: {
    padding: "10px 20px",
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
    borderRadius: "5px",
    transition: "all 0.2s",
  },
  navButtonActive: {
    background: "#333",
    color: "white",
  },
  form: {
    display: "flex",
    gap: "10px",
    marginBottom: "30px",
  },
  uploadForm: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "15px",
  },
  input: {
    flex: 1,
    padding: "12px",
    fontSize: "16px",
    border: "1px solid #ddd",
    borderRadius: "5px",
  },
  textarea: {
    padding: "12px",
    fontSize: "16px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    minHeight: "300px",
    resize: "vertical" as const,
  },
  button: {
    padding: "12px 24px",
    background: "#333",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
  results: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "15px",
  },
  resultCard: {
    padding: "15px",
    border: "1px solid #eee",
    borderRadius: "8px",
    background: "#f9f9f9",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  scriptTitle: {
    fontWeight: "bold",
    color: "#333",
  },
  similarity: {
    color: "#666",
    fontSize: "14px",
  },
  resultContent: {
    margin: 0,
    lineHeight: 1.6,
    color: "#555",
  },
  progress: {
    padding: "10px",
    background: "#e8f5e9",
    borderRadius: "5px",
    textAlign: "center" as const,
    marginTop: "15px",
  },
  scriptsList: {
    marginTop: "30px",
  },
  scriptItem: {
    padding: "8px",
    borderBottom: "1px solid #eee",
  },
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
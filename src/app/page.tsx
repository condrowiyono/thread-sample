"use client";

import { useState } from "react";
import SearchForm, { type SearchFormValues } from "@/components/SearchForm";
import ResultDisplay from "@/components/ResultDisplay";
import ResizablePanels from "@/components/ResizablePanels";

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: SearchFormValues) {
    setLoading(true);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error submitting form:", error);
      setResult({ error: "Failed to submit form" });
    } finally {
      setLoading(false);
    }
  }

  const handleReset = () => {
    setResult(null);
  };

  return (
    <ResizablePanels
      leftPanel={
        <SearchForm
          loading={loading}
          onSubmit={handleSubmit}
          onReset={handleReset}
        />
      }
      rightPanel={<ResultDisplay result={result} />}
    />
  );
}

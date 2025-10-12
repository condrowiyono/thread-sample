"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Papa from "papaparse";
import { Download } from "lucide-react";

interface ResultDisplayProps {
  result: any;
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
  const [showPreview, setShowPreview] = useState(true);

  const handleDownloadCSV = () => {
    if (!result?.data || !Array.isArray(result.data)) {
      alert("No data available to export");
      return;
    }

    // Convert data to CSV using papaparse
    const csv = Papa.unparse(result.data);

    // Create blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `search-results-${Date.now()}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-10 overflow-y-auto bg-slate-50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Result</h2>
        {result?.data && result.data.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-preview"
                checked={showPreview}
                onCheckedChange={(checked) => setShowPreview(checked === true)}
              />
              <Label
                htmlFor="show-preview"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Show preview
              </Label>
            </div>
            <Button onClick={handleDownloadCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </div>
        )}
      </div>
      {result ? (
        showPreview && result.data && result.data.length > 0 ? (
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Username</TableHead>
                  <TableHead>Caption</TableHead>
                  <TableHead className="w-[150px]">Post ID</TableHead>
                  <TableHead className="w-[150px]">User ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.map((item: any, index: number) => (
                  <TableRow key={item.postId || index}>
                    <TableCell className="font-medium">
                      {item.username || "-"}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {item.caption || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.postId || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.userId || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t bg-slate-50 text-sm text-slate-600">
              Total Results: {result.totalResults || result.data.length}
            </div>
          </div>
        ) : result.data && result.data.length > 0 ? (
          <div className="bg-white p-6 rounded-lg border text-center text-slate-500">
            Preview is hidden. Check the "Show preview" option to view the table.
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg border text-center text-slate-500">
            No data available
          </div>
        )
      ) : (
        <p className="text-slate-500">Submit the form to see the result here</p>
      )}
    </div>
  );
}

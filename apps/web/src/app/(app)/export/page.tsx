import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Export Data</h1>
        <p className="text-slate-600">Download CSV reports for portfolio and budget summary</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Projects List</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              All projects with status, client, physical/payment progress, and flags
            </p>
            <a href="/api/export/projects?type=projects">
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              FY allocation, warrant, spent, unspent, and RAG status per project
            </p>
            <a href="/api/export/projects?type=budget">
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

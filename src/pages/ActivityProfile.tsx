import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { API_BASE_URL } from "@/config";

interface ActivityLog {
    id: number;
    data: string; // JSON string
    feedback: string | null; // JSON string
    created_at: string;
}

export default function ActivityProfile() {
    const { coachId } = useParams();
    const navigate = useNavigate();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!coachId) return;
            try {
                const token = localStorage.getItem("sessionToken");
                if (!token) throw new Error("No session token");

                const res = await fetch(`${API_BASE_URL}/api/chat/logs/${coachId}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch logs");
                }

                const data = await res.json();
                setLogs(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load activity profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [coachId]);

    const parseData = (jsonStr: string) => {
        try {
            const data = JSON.parse(jsonStr);
            return Object.entries(data).map(([key, value]) => (
                <div key={key} className="text-sm">
                    <span className="font-medium capitalize">{key.replace(/-/g, ' ')}:</span> {String(value)}
                </div>
            ));
        } catch (e) {
            return <span className="text-muted-foreground">Invalid data</span>;
        }
    };

    const parseFeedback = (jsonStr: string | null) => {
        if (!jsonStr) return <span className="italic text-muted-foreground">No feedback</span>;
        try {
            const feedback = JSON.parse(jsonStr);
            // Check if it matches our new structure { status, analysis: { ... } }
            if (feedback.analysis && feedback.analysis.summary_impression) {
                return feedback.analysis.summary_impression;
            }
            // Fallback for older format if any
            return JSON.stringify(feedback).slice(0, 50) + "...";
        } catch (e) {
            return <span className="text-muted-foreground">Analysis error</span>;
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-full"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Activity Profile
                    </h1>
                </div>

                {/* Content */}
                <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground animate-pulse">
                            Loading specific activity data...
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-destructive">
                            {error}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center space-y-3">
                            <div className="text-4xl">📊</div>
                            <h3 className="text-lg font-medium">No Activities Logged Yet</h3>
                            <p className="text-muted-foreground">
                                Complete a session with your coach to see your history here.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[150px]">Date</TableHead>
                                        <TableHead className="w-[300px]">Session Data</TableHead>
                                        <TableHead>Coach Feedback</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium align-top py-4">
                                                {new Date(log.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </TableCell>
                                            <TableCell className="align-top py-4 space-y-1">
                                                {parseData(log.data)}
                                            </TableCell>
                                            <TableCell className="align-top py-4 text-muted-foreground">
                                                {parseFeedback(log.feedback)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

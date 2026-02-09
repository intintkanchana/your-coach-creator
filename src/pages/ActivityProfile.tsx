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
import { apiFetch } from "@/lib/api";
import { Coach } from "@/types/coach";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ArrowUpDown } from "lucide-react";
import { useMemo } from "react";
import { format } from "date-fns";

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

    // Helper functions moved out of useMemo to be accessible inside and outside
    const getTrackingValue = (jsonStr: string, trackingId: string) => {
        try {
            const data = JSON.parse(jsonStr);
            // Try to parse number for correct sorting if possible
            const val = data[trackingId];
            if (val === undefined || val === null) return "-";
            return val;
        } catch (e) {
            return "-";
        }
    };

    const parseFeedback = (jsonStr: string | null) => {
        if (!jsonStr) return <span className="italic text-muted-foreground">No feedback</span>;
        try {
            const feedback = JSON.parse(jsonStr);
            if (feedback.analysis && feedback.analysis.summary_impression) {
                return feedback.analysis.summary_impression;
            }
            return JSON.stringify(feedback).slice(0, 50) + "...";
        } catch (e) {
            return <span className="text-muted-foreground">Analysis error</span>;
        }
    };
    const [coach, setCoach] = useState<Coach | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!coachId) return;
            try {
                const [logsRes, coachRes] = await Promise.all([
                    apiFetch(`/api/chat/logs/${coachId}`),
                    apiFetch(`/api/coaches/${coachId}`)
                ]);

                if (!logsRes.ok || !coachRes.ok) throw new Error("Failed to fetch data");

                const logsData = await logsRes.json();
                const coachData = await coachRes.json();

                setLogs(logsData);
                setCoach(coachData);
            } catch (err) {
                console.error(err);
                setError("Failed to load activity profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [coachId]);

    const columns = useMemo<ColumnDef<ActivityLog>[]>(() => {
        const baseColumns: ColumnDef<ActivityLog>[] = [
            {
                accessorKey: "created_at",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => {
                    return (
                        <div className="whitespace-nowrap">
                            {format(new Date(row.getValue("created_at")), "MMM d, yyyy • h:mm a")}
                        </div>
                    );
                },
            },
        ];

        if (coach?.trackings) {
            coach.trackings.forEach(tracking => {
                baseColumns.push({
                    id: tracking.id.toString(),
                    header: ({ column }) => {
                        return (
                            <Button
                                variant="ghost"
                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            >
                                {tracking.name}
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        );
                    },
                    accessorFn: (row) => getTrackingValue(row.data, tracking.id.toString()),
                    cell: ({ row }) => {
                        return <div className="pl-4">{getTrackingValue(row.original.data, tracking.id.toString())}</div>;
                    }
                });
            });
        }

        baseColumns.push({
            accessorKey: "feedback",
            header: "Coach Feedback",
            cell: ({ row }) => <div className="min-w-[300px]">{parseFeedback(row.getValue("feedback"))}</div>,
        });

        return baseColumns;
    }, [coach]);

    return (
        <div className="min-h-screen bg-background p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
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
                            <DataTable columns={columns} data={logs} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

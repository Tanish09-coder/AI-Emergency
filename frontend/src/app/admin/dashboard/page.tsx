"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { Incident, IncidentsResponse, Report } from "@/types";
import { ShieldAlert, Activity, AlertOctagon, RefreshCcw } from "lucide-react";
import IncidentDetailModal from "@/components/IncidentDetailModal";

export default function AdminDashboard() {
  const router = useRouter();
  
  const [data, setData] = useState<IncidentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidentReports, setIncidentReports] = useState<Report[]>([]);

  const fetchIncidents = async () => {
    try {
      const res = await api.get<IncidentsResponse>("/api/incidents");
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch incidents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "ADMIN") {
      router.push("/login");
      return;
    }

    fetchIncidents();
    // Poll every 10 seconds for live updates
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const handleStatusChange = async (incidentId: string, newStatus: string) => {
    try {
      await api.patch(`/api/incidents/${incidentId}/status`, { status: newStatus });
      // Update local state optimistically
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          incidents: prev.incidents.map(inc => 
            inc._id === incidentId ? { ...inc, status: newStatus as any } : inc
          )
        };
      });
    } catch (err) {
      console.error("Failed to update status", err);
      // Revert/refresh on error
      fetchIncidents();
    }
  };

  const openIncidentDetails = async (incident: Incident) => {
    setSelectedIncident(incident);
    setIncidentReports([]);
    try {
      // Fetch full incident details including reports
      const res = await api.get<{ incident: Incident, reports: Report[] }>(`/api/incidents/${incident._id}`);
      setIncidentReports(res.data.reports || []); // Ensure fallback
    } catch (err) {
      console.error("Failed to fetch incident details", err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      
      {/* Navbar */}
      <header className="bg-surface border-b border-slate-700 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-blue-500" />
          <h1 className="text-xl font-bold tracking-tight">Response Center <span className="text-blue-500 font-normal">| Admin</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchIncidents}
            className="p-2 text-slate-400 hover:text-white rounded-full transition-colors"
            title="Refresh data"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              router.push("/login");
            }}
            className="text-sm font-medium bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        
        {/* Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface border border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 font-medium">Total Incidents</h3>
              <Activity className="w-5 h-5 text-slate-500" />
            </div>
            <p className="text-3xl font-bold">{data?.stats?.total || 0}</p>
          </div>
          
          <div className="bg-surface border border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 font-medium">Active Incidents</h3>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            </div>
            <p className="text-3xl font-bold text-blue-100">{data?.stats?.active || 0}</p>
          </div>

          <div className="bg-surface border border-red-900/50 rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-critical"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-red-200 font-medium">Critical Priority</h3>
              <AlertOctagon className="w-5 h-5 text-critical" />
            </div>
            <p className="text-3xl font-bold text-white">{data?.stats?.critical || 0}</p>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="bg-surface border border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
            <h2 className="font-semibold text-lg">Live Incident Feed</h2>
            <span className="text-xs font-medium px-2 py-1 bg-green-900/30 text-green-400 rounded-full border border-green-800/50 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Severity</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Location</th>
                  <th className="px-6 py-3 font-medium">Reports</th>
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading incidents...</td>
                  </tr>
                ) : data?.incidents?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No incidents reported.</td>
                  </tr>
                ) : (
                  data?.incidents?.map(incident => (
                    <tr key={incident._id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full text-white inline-flex items-center gap-1.5
                          ${incident.severity === 'CRITICAL' ? 'bg-critical animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                            incident.severity === 'HIGH' ? 'bg-high' : 
                            incident.severity === 'MEDIUM' ? 'bg-medium text-amber-950' : 'bg-low'}
                        `}>
                          {incident.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{incident.type}</td>
                      <td className="px-6 py-4 text-slate-300 max-w-[200px] truncate" title={incident.location.address}>
                        {incident.location.address}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-slate-300">
                          <FileText className="w-4 h-4 text-slate-500" />
                          {incident.reportCount}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          className={`text-xs font-semibold rounded-md px-2 py-1 border outline-none cursor-pointer appearance-none pr-6 custom-select-bg
                            ${incident.status === 'RESOLVED' ? 'bg-green-900/30 text-green-400 border-green-800' :
                              incident.status === 'RESPONDING' ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
                              incident.status === 'VERIFIED' ? 'bg-purple-900/30 text-purple-400 border-purple-800' :
                              'bg-slate-800 text-slate-300 border-slate-600'
                            }
                          `}
                          value={incident.status}
                          onChange={(e) => handleStatusChange(incident._id, e.target.value)}
                        >
                          <option value="REPORTED" className="bg-slate-800 text-white">REPORTED</option>
                          <option value="VERIFIED" className="bg-slate-800 text-white">VERIFIED</option>
                          <option value="RESPONDING" className="bg-slate-800 text-white">RESPONDING</option>
                          <option value="RESOLVED" className="bg-slate-800 text-white">RESOLVED</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openIncidentDetails(incident)}
                          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Incident Details Modal */}
      {selectedIncident && (
        <IncidentDetailModal 
          incident={selectedIncident} 
          reports={incidentReports} 
          onClose={() => setSelectedIncident(null)} 
        />
      )}

    </div>
  );
}

import { X, AlertCircle, FileText, MapPin, Clock } from "lucide-react";
import { Incident, Report } from "@/types";

interface IncidentDetailModalProps {
  incident: Incident | null;
  reports: Report[];
  onClose: () => void;
}

export default function IncidentDetailModal({ incident, reports, onClose }: IncidentDetailModalProps) {
  if (!incident) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-bold rounded-full text-white
              ${incident.severity === 'CRITICAL' ? 'bg-critical' : 
                incident.severity === 'HIGH' ? 'bg-high' : 
                incident.severity === 'MEDIUM' ? 'bg-medium' : 'bg-low'}
            `}>
              {incident.severity}
            </span>
            <h2 className="text-xl font-bold text-white">{incident.type} Incident</h2>
            <span className="text-sm text-slate-400">ID: {incident._id.slice(-6)}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* AI Summary Section */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              AI Incident Summary
            </h3>
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-5">
              <p className="text-blue-100 text-lg leading-relaxed font-medium">
                {incident.summary || "Summary generation in progress..."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <MapPin className="w-4 h-4" /> Location
              </div>
              <p className="text-white font-medium">{incident.location.address}</p>
              {incident.location.coordinates && (
                <p className="text-xs text-slate-500 mt-1">
                  GPS: {incident.location.coordinates.lat.toFixed(4)}, {incident.location.coordinates.lng.toFixed(4)}
                </p>
              )}
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Clock className="w-4 h-4" /> Reported At
              </div>
              <p className="text-white font-medium">
                {new Date(incident.createdAt).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Status: <span className="font-semibold text-slate-300">{incident.status}</span>
              </p>
            </div>
          </div>

          {/* User Reports Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              Merged User Reports ({incident.reportCount})
            </h3>
            <div className="space-y-3">
              {reports.length > 0 ? (
                reports.map((report, idx) => (
                  <div key={report._id || idx} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <p className="text-slate-200 mb-2">{report.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Source: Citizen Reporter</span>
                      {report.createdAt && <span>{new Date(report.createdAt).toLocaleTimeString()}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 border border-dashed border-slate-700 rounded-lg">
                  Fetching underlying reports...
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

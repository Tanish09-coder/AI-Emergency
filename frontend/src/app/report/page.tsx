"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { MapPin, Navigation, AlertTriangle, CheckCircle, Loader2, Sparkles } from "lucide-react";

const presetEmergencyData: Record<
  string,
  { description: string; address: string; coordinates: { lat: number; lng: number } }
> = {
  Fire: {
    description: "Heavy smoke and flames coming from Block B first floor window room 102",
    address: "Block B, First Floor",
    coordinates: { lat: 12.9716, lng: 77.5946 },
  },
  Medical: {
    description: "Student collapsed and unresponsive near main campus sports ground bleachers",
    address: "Main Campus Sports Ground",
    coordinates: { lat: 12.975, lng: 77.598 },
  },
  Accident: {
    description: "Two vehicle collision near north gate entrance blocking main exit lane",
    address: "North Gate Entrance Road",
    coordinates: { lat: 12.978, lng: 77.592 },
  },
  Security: {
    description: "Suspicious unauthorized intruder spotted attempting break-in near lab block",
    address: "Science Lab Block, Rear Entrance",
    coordinates: { lat: 12.973, lng: 77.5955 },
  },
  "Natural Disaster": {
    description: "Storm water accumulation and heavy fallen tree branch blocking central avenue",
    address: "Main Campus Central Avenue",
    coordinates: { lat: 12.9745, lng: 77.596 },
  },
  Other: {
    description: "Electrical short circuit and sparks emitting from distribution transformer panel",
    address: "Engineering Block Substation",
    coordinates: { lat: 12.9725, lng: 77.5935 },
  },
};

export default function ReportPage() {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [emergencyType, setEmergencyType] = useState("Other");
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");

  const emergencyTypes = ["Fire", "Medical", "Accident", "Security", "Natural Disaster", "Other"];

  // Ensure user is authenticated
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "REPORTER" && user.role !== "ADMIN") {
      router.push("/login");
    }
  }, [router]);

  const handleSelectType = (type: string) => {
    setEmergencyType(type);
    const preset = presetEmergencyData[type];
    if (preset) {
      setDescription(preset.description);
      setAddress(preset.address);
      setCoordinates(preset.coordinates);
    }
  };

  const detectLocation = () => {
    setDetectingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setAddress(
            `GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
          );
          setDetectingLocation(false);
        },
        (error) => {
          console.error("Error getting location", error);
          setError("Failed to get location. Please type your address manually.");
          setDetectingLocation(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setDetectingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/api/reports", {
        description,
        emergencyType,
        location: {
          address,
          coordinates: coordinates || undefined,
        },
      });
      setSubmitSuccess(true);
      
      // Reset form
      setDescription("");
      setAddress("");
      setCoordinates(null);
      setEmergencyType("Other");

      // Hide success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-4 md:p-8">
      <header className="max-w-2xl mx-auto mb-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-8 h-8 text-critical" />
          <h1 className="text-2xl font-bold">Submit Report</h1>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/login");
          }}
          className="text-sm text-slate-400 hover:text-white"
        >
          Logout
        </button>
      </header>

      <main className="max-w-2xl mx-auto bg-surface p-6 md:p-8 rounded-2xl shadow-xl border border-slate-700">
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg flex items-center gap-3 text-green-200">
            <CheckCircle className="w-6 h-6 text-resolved shrink-0" />
            <div>
              <h3 className="font-semibold text-white">Report Submitted Successfully</h3>
              <p className="text-sm">Your report is being processed and emergency services will be notified.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Emergency Type Selection with Auto-Fill Database */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-slate-300">Emergency Type</label>
              <span className="text-xs text-blue-400 flex items-center gap-1 font-medium">
                <Sparkles className="w-3.5 h-3.5" /> Auto-fills description & location
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {emergencyTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSelectType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    emergencyType === type
                      ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20 scale-105"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description (Required)
            </label>
            <textarea
              required
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please describe what is happening..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Address or landmark"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={detectLocation}
                disabled={detectingLocation}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 border border-slate-600"
                title="Use current location"
              >
                {detectingLocation ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Navigation className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-critical hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Emergency Report"}
          </button>
        </form>
      </main>
    </div>
  );
}

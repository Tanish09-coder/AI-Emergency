const { GoogleGenAI } = require('@google/genai');

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Fallback keyword heuristic classifier if Gemini API key is unavailable
 */
const fallbackClassify = (description, emergencyType, locationAddress) => {
  const text = `${description} ${emergencyType || ''} ${locationAddress || ''}`.toLowerCase();

  let type = emergencyType || 'Other';
  if (!emergencyType || emergencyType === 'Other') {
    if (/fire|smoke|flame|blaze|burn/i.test(text)) type = 'Fire';
    else if (/medical|patient|collapsed|unconscious|heart|injury|bleed|ambulance/i.test(text)) type = 'Medical';
    else if (/crash|accident|collision|hit|vehicle|car/i.test(text)) type = 'Accident';
    else if (/gun|weapon|thief|robbery|fight|assault|security/i.test(text)) type = 'Security';
    else if (/flood|earthquake|storm|landslide|disaster/i.test(text)) type = 'Natural Disaster';
  }

  let severity = 'MEDIUM';
  if (/explosion|trapped|massive fire|unconscious|gunshot|critical|life threatening|fatal/i.test(text)) {
    severity = 'CRITICAL';
  } else if (/fire|severe|heavy|break-in|multi-vehicle/i.test(text)) {
    severity = 'HIGH';
  } else if (/minor|small|scratches|alarm/i.test(text)) {
    severity = 'LOW';
  }

  return { type, severity, keyKeywords: text.split(' ').slice(0, 5) };
};

/**
 * Classify single report to determine emergency type and severity
 */
const classifyReport = async (description, emergencyType, locationAddress) => {
  const ai = getGeminiClient();
  if (!ai) {
    return fallbackClassify(description, emergencyType, locationAddress);
  }

  try {
    const prompt = `You are an emergency triage AI. Analyze this incident report and output strictly valid JSON.
Report Description: "${description}"
User Selected Type: "${emergencyType || 'Unspecified'}"
Location Address: "${locationAddress || 'Unspecified'}"

Return JSON strictly in this structure (no markdown fences, raw JSON only):
{
  "type": "Fire" | "Medical" | "Accident" | "Security" | "Natural Disaster" | "Other",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "keyKeywords": ["keyword1", "keyword2"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text ? response.text.trim() : '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      type: parsed.type || emergencyType || 'Other',
      severity: parsed.severity || 'MEDIUM',
      keyKeywords: Array.isArray(parsed.keyKeywords) ? parsed.keyKeywords : [],
    };
  } catch (err) {
    console.warn('[AI Service Warning] Gemini classification failed, using fallback:', err.message);
    return fallbackClassify(description, emergencyType, locationAddress);
  }
};

/**
 * Summarize multiple user reports into a cohesive incident summary
 */
const summarizeIncident = async (reports, locationAddress) => {
  const descriptions = reports.map((r, i) => `${i + 1}. "${r.description}"`).join('\n');
  const ai = getGeminiClient();

  if (!ai) {
    const combined = reports.map((r) => r.description).join(' ');
    const fallback = fallbackClassify(combined, reports[0]?.emergencyType, locationAddress);
    return {
      summary: `Merged incident report based on ${reports.length} user submissions: ${reports[0]?.description}`,
      severity: fallback.severity,
      primaryType: fallback.type,
    };
  }

  try {
    const prompt = `You are an emergency situation coordinator AI. Combine multiple user reports for an incident into one concise executive summary for first responders.

Location: "${locationAddress || 'Unknown location'}"
Reports received:
${descriptions}

Return JSON strictly in this structure (no markdown fences, raw JSON only):
{
  "summary": "Concise 1-2 sentence summary of what is happening based on all reports.",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "primaryType": "Fire" | "Medical" | "Accident" | "Security" | "Natural Disaster" | "Other"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text ? response.text.trim() : '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      summary: parsed.summary || reports[0]?.description,
      severity: parsed.severity || 'MEDIUM',
      primaryType: parsed.primaryType || 'Other',
    };
  } catch (err) {
    console.warn('[AI Service Warning] Gemini summarization failed, using fallback:', err.message);
    return {
      summary: `${reports.length} user reports submitted for ${locationAddress || 'this location'}. Primary report: "${reports[0]?.description}"`,
      severity: 'HIGH',
      primaryType: reports[0]?.emergencyType || 'Other',
    };
  }
};

/**
 * Evaluate if a new report matches any existing candidate incident
 */
const checkDuplicateWithAI = async (newReport, candidateIncidents) => {
  if (!candidateIncidents || candidateIncidents.length === 0) {
    return { isMatch: false, matchedIncidentId: null };
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Basic text heuristic for fallback
    const reportText = `${newReport.description} ${newReport.location?.address || ''}`.toLowerCase();
    for (const incident of candidateIncidents) {
      const incText = `${incident.summary} ${incident.location?.address || ''}`.toLowerCase();
      const reportWords = newReport.description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const commonWords = reportWords.filter(word => incText.includes(word));
      if (commonWords.length >= 2 || (incident.location?.address && newReport.location?.address && incident.location.address.toLowerCase() === newReport.location.address.toLowerCase())) {
        return { isMatch: true, matchedIncidentId: incident._id.toString() };
      }
    }
    return { isMatch: false, matchedIncidentId: null };
  }

  try {
    const candidatesStr = candidateIncidents.map((inc, i) => `Incident ID: "${inc._id}"
Location: "${inc.location?.address}"
Summary: "${inc.summary}"
Type: "${inc.type}"`).join('\n\n');

    const prompt = `You are an AI emergency report deduplication engine. Determine if the new report describes the same emergency incident as any of the candidate incidents listed below.

New Report:
Description: "${newReport.description}"
Location: "${newReport.location?.address}"
Type: "${newReport.emergencyType || 'Unspecified'}"

Candidate Active Incidents:
${candidatesStr}

Return JSON strictly in this format (no markdown fences, raw JSON only):
{
  "isMatch": true | false,
  "matchedIncidentId": "string" | null,
  "confidence": 0.0 to 1.0
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text ? response.text.trim() : '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      isMatch: Boolean(parsed.isMatch && parsed.matchedIncidentId),
      matchedIncidentId: parsed.matchedIncidentId || null,
      confidence: parsed.confidence || 0,
    };
  } catch (err) {
    console.warn('[AI Service Warning] Gemini deduplication check failed, using fallback heuristic:', err.message);
    return { isMatch: false, matchedIncidentId: null };
  }
};

module.exports = {
  classifyReport,
  summarizeIncident,
  checkDuplicateWithAI,
};

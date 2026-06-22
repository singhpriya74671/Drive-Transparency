import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from "react-native";
import { useVehicle } from "../context/VehicleContext";

const STATUS_COLOR = {
  critical: "#ef4444",
  warning:  "#f59e0b",
  good:     "#10b981",
};

const STATUS_LABEL = {
  critical: "Immediate Attention Required",
  warning:  "Service Recommended Soon",
  good:     "Vehicle in Good Condition",
};

const COMPONENT_ICONS = {
  engine_oil:   "🛢️",
  battery:      "🔋",
  brakes:       "🛑",
  tyres:        "⚙️",
  coolant:      "🌡️",
  fuel_system:  "⛽",
  transmission: "⚙️",
  spark_plugs:  "⚡",
};

const URGENCY_LABEL = {
  critical: "Critical",
  warning:  "Warning",
  good:     "Healthy",
};

function ComponentCard({ comp }) {
  const [expanded, setExpanded] = useState(false);
  const color = STATUS_COLOR[comp.urgency] || "#10b981";
  const icon  = COMPONENT_ICONS[comp.component] || "🔧";

  return (
    <TouchableOpacity
      style={[styles.compCard, { borderColor: color + "44" }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.compHeader}>
        <View style={styles.compLeft}>
          <Text style={styles.compIcon}>{icon}</Text>
          <View>
            <Text style={styles.compName}>{comp.label}</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${comp.health_score}%`, backgroundColor: color }]} />
              </View>
              <Text style={[styles.progressText, { color }]}>{Math.round(comp.health_score)}%</Text>
            </View>
          </View>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: color + "22", borderColor: color + "55" }]}>
          <Text style={[styles.urgencyText, { color }]}>{URGENCY_LABEL[comp.urgency] || "—"}</Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.compDetail}>
          <Text style={styles.compExplanation}>{comp.explanation}</Text>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Estimated Cost:</Text>
            <Text style={styles.costValue}>
              ₹{comp.estimated_cost_min.toLocaleString()} – ₹{comp.estimated_cost_max.toLocaleString()}
            </Text>
          </View>
          {comp.shap_factors?.length > 0 && (
            <View style={styles.factorsSection}>
              <Text style={styles.factorsTitle}>Key Factors:</Text>
              <View style={styles.factorChips}>
                {comp.shap_factors.map((f, i) => (
                  <View key={i} style={styles.factorChip}>
                    <Text style={styles.factorText}>
                      {f.factor}: <Text style={{ color: "#fff" }}>{String(f.value)}</Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }) {
  const { report } = useVehicle();

  if (!report) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>No Report Available</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("VehicleInput")}>
          <Text style={styles.primaryBtnText}>Check My Vehicle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const alertColor   = STATUS_COLOR[report.overall_status] || "#10b981";
  const totalCostMin = report.components.reduce((s, c) => s + (c.urgency !== "good" ? c.estimated_cost_min : 0), 0);
  const totalCostMax = report.components.reduce((s, c) => s + (c.urgency !== "good" ? c.estimated_cost_max : 0), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Overall Health Card */}
      <View style={[styles.healthCard, { borderColor: alertColor + "44" }]}>
        <View style={styles.healthTop}>
          <View style={[styles.scoreBig, { backgroundColor: alertColor + "22" }]}>
            <Text style={[styles.scoreNum, { color: alertColor }]}>{Math.round(report.overall_health_score)}</Text>
            <Text style={[styles.scoreOut, { color: alertColor }]}>/100</Text>
          </View>
          <View style={styles.healthRight}>
            <Text style={[styles.statusLabel, { color: alertColor }]}>
              {STATUS_LABEL[report.overall_status]}
            </Text>
            {report.top_alert && (
              <Text style={styles.alertMsg}>{report.top_alert}</Text>
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { count: report.components.filter((c) => c.urgency === "critical").length, label: "Critical", color: "#ef4444" },
            { count: report.components.filter((c) => c.urgency === "warning").length,  label: "Warning",  color: "#f59e0b" },
            { count: report.components.filter((c) => c.urgency === "good").length,     label: "Healthy",  color: "#10b981" },
          ].map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.count}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {totalCostMin > 0 && (
          <View style={styles.costCard}>
            <Text style={styles.costCardLabel}>Total Estimated Service Cost</Text>
            <Text style={styles.costCardValue}>
              ₹{totalCostMin.toLocaleString()} – ₹{totalCostMax.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Components */}
      <Text style={styles.sectionTitle}>Component Analysis</Text>
      <Text style={styles.sectionHint}>Tap a component to view details</Text>
      {report.components.map((comp) => (
        <ComponentCard key={comp.component} comp={comp} />
      ))}

      <Text style={styles.timestamp}>
        Report generated: {new Date(report.generated_at).toLocaleString("en-IN")}
      </Text>

      <TouchableOpacity
        style={styles.recheckBtn}
        onPress={() => navigation.navigate("VehicleInput")}
        activeOpacity={0.8}
      >
        <Text style={styles.recheckBtnText}>🔄 Run Another Check</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#0f172a" },
  content:          { padding: 16, paddingBottom: 40 },
  emptyContainer:   { flex: 1, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center", gap: 12 },
  emptyIcon:        { fontSize: 48 },
  emptyTitle:       { fontSize: 18, color: "#9ca3af", fontWeight: "600" },
  primaryBtn:       { backgroundColor: "#4f46e5", borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  primaryBtnText:   { color: "#fff", fontWeight: "700", fontSize: 15 },

  healthCard:       { backgroundColor: "#1e293b", borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1 },
  healthTop:        { flexDirection: "row", gap: 16, alignItems: "center", marginBottom: 16 },
  scoreBig:         { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  scoreNum:         { fontSize: 28, fontWeight: "900" },
  scoreOut:         { fontSize: 12, fontWeight: "600", marginTop: -4 },
  healthRight:      { flex: 1 },
  statusLabel:      { fontSize: 14, fontWeight: "800" },
  alertMsg:         { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  statsRow:         { flexDirection: "row", gap: 8, marginBottom: 12 },
  statBox:          { flex: 1, backgroundColor: "#0f172a", borderRadius: 12, padding: 10, alignItems: "center" },
  statNum:          { fontSize: 22, fontWeight: "800" },
  statLabel:        { fontSize: 10, color: "#6b7280" },
  costCard:         { backgroundColor: "#0f172a", borderRadius: 12, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  costCardLabel:    { fontSize: 12, color: "#6b7280" },
  costCardValue:    { fontSize: 13, fontWeight: "700", color: "#fff" },

  sectionTitle:     { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 2 },
  sectionHint:      { fontSize: 12, color: "#4b5563", marginBottom: 12 },

  compCard:         { backgroundColor: "#1e293b", borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1 },
  compHeader:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  compLeft:         { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  compIcon:         { fontSize: 22, width: 30 },
  compName:         { fontSize: 14, fontWeight: "700", color: "#fff" },
  progressRow:      { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  progressBg:       { width: 80, height: 5, backgroundColor: "#374151", borderRadius: 3, overflow: "hidden" },
  progressFill:     { height: "100%", borderRadius: 3 },
  progressText:     { fontSize: 11, fontWeight: "600" },
  urgencyBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  urgencyText:      { fontSize: 11, fontWeight: "700" },

  compDetail:       { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#374151" },
  compExplanation:  { fontSize: 13, color: "#d1d5db", lineHeight: 20 },
  costRow:          { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  costLabel:        { fontSize: 12, color: "#6b7280" },
  costValue:        { fontSize: 13, fontWeight: "700", color: "#fff" },
  factorsSection:   { marginTop: 8 },
  factorsTitle:     { fontSize: 11, color: "#6b7280", marginBottom: 4 },
  factorChips:      { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  factorChip:       { backgroundColor: "#374151", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  factorText:       { fontSize: 11, color: "#9ca3af" },

  timestamp:        { fontSize: 11, color: "#4b5563", textAlign: "center", marginTop: 16, marginBottom: 12 },
  recheckBtn:       { backgroundColor: "#1e293b", borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#334155" },
  recheckBtnText:   { color: "#d1d5db", fontSize: 14, fontWeight: "600" },
});

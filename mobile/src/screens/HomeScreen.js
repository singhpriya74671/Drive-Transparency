import React, { useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
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

export default function HomeScreen({ navigation }) {
  const { report, loadCachedReport } = useVehicle();

  useEffect(() => { loadCachedReport(); }, []);

  const alertColor = report ? STATUS_COLOR[report.overall_status] || "#10b981" : "#6366f1";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🚗</Text>
        <Text style={styles.appName}>DriveTransparency</Text>
        <Text style={styles.tagline}>Vehicle health at a glance</Text>
      </View>

      {/* Health Score Card */}
      {report ? (
        <View style={[styles.scoreCard, { borderColor: alertColor + "66" }]}>
          <View style={[styles.scoreBadge, { backgroundColor: alertColor + "22" }]}>
            <Text style={[styles.scoreNumber, { color: alertColor }]}>
              {Math.round(report.overall_health_score)}
            </Text>
            <Text style={[styles.scoreLabel, { color: alertColor }]}>/ 100</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={[styles.statusText, { color: alertColor }]}>
              {STATUS_LABEL[report.overall_status]}
            </Text>
            {report.top_alert && (
              <Text style={styles.alertText}>{report.top_alert}</Text>
            )}
            <View style={styles.countRow}>
              <View style={styles.countBadge}>
                <Text style={[styles.countNum, { color: "#ef4444" }]}>
                  {report.components.filter((c) => c.urgency === "critical").length}
                </Text>
                <Text style={styles.countLabel}>Critical</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={[styles.countNum, { color: "#f59e0b" }]}>
                  {report.components.filter((c) => c.urgency === "warning").length}
                </Text>
                <Text style={styles.countLabel}>Warning</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={[styles.countNum, { color: "#10b981" }]}>
                  {report.components.filter((c) => c.urgency === "good").length}
                </Text>
                <Text style={styles.countLabel}>Healthy</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No Data Available</Text>
          <Text style={styles.emptyDesc}>Tap "Check My Vehicle" below to get started</Text>
        </View>
      )}

      {/* Action Buttons */}
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.navigate("VehicleInput")}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryBtnText}>🔍 Check My Vehicle</Text>
      </TouchableOpacity>

      {report && (
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate("Dashboard")}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>📊 View Full Report</Text>
        </TouchableOpacity>
      )}

      {/* Features */}
      <Text style={styles.sectionTitle}>What you get</Text>
      {[
        { icon: "🧠", text: "AI-powered health prediction for each component" },
        { icon: "📖", text: "Clear explanation for every recommendation" },
        { icon: "💰", text: "Estimated service cost before you visit a workshop" },
        { icon: "⚠️", text: "Instant alerts for critical issues" },
        { icon: "📅", text: "Complete service history in one place" },
      ].map((f, i) => (
        <View key={i} style={styles.featureRow}>
          <Text style={styles.featureIcon}>{f.icon}</Text>
          <Text style={styles.featureText}>{f.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#0f172a" },
  content:        { padding: 20, paddingBottom: 40 },
  header:         { alignItems: "center", marginBottom: 24 },
  logo:           { fontSize: 56, marginBottom: 4 },
  appName:        { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  tagline:        { fontSize: 14, color: "#6b7280", marginTop: 4 },
  scoreCard:      { flexDirection: "row", backgroundColor: "#1e293b", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, gap: 16, alignItems: "center" },
  scoreBadge:     { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  scoreNumber:    { fontSize: 30, fontWeight: "900" },
  scoreLabel:     { fontSize: 12, fontWeight: "600", marginTop: -4 },
  scoreInfo:      { flex: 1 },
  statusText:     { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  alertText:      { fontSize: 12, color: "#9ca3af", marginBottom: 8 },
  countRow:       { flexDirection: "row", gap: 12 },
  countBadge:     { alignItems: "center" },
  countNum:       { fontSize: 20, fontWeight: "800" },
  countLabel:     { fontSize: 10, color: "#6b7280" },
  emptyCard:      { backgroundColor: "#1e293b", borderRadius: 20, padding: 32, alignItems: "center", marginBottom: 16 },
  emptyIcon:      { fontSize: 40, marginBottom: 8 },
  emptyTitle:     { fontSize: 18, fontWeight: "700", color: "#fff" },
  emptyDesc:      { fontSize: 13, color: "#6b7280", marginTop: 4, textAlign: "center" },
  primaryBtn:     { backgroundColor: "#4f46e5", borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 12 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtn:   { backgroundColor: "#1e293b", borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 24, borderWidth: 1, borderColor: "#334155" },
  secondaryBtnText: { color: "#d1d5db", fontSize: 15, fontWeight: "600" },
  sectionTitle:   { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 12 },
  featureRow:     { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  featureIcon:    { fontSize: 20, width: 28 },
  featureText:    { fontSize: 14, color: "#9ca3af", flex: 1 },
});

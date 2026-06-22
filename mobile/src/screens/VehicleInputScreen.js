import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Switch, Alert,
} from "react-native";
import { useVehicle } from "../context/VehicleContext";

const INITIAL = {
  owner_name: "", vehicle_model: "", manufacturer: "",
  manufacturing_year: "2020", mileage_km: "", fuel_type: "petrol",
  last_oil_change_date: "", battery_age_months: "0",
  brake_condition: "good", fuel_efficiency_kmpl: "",
  has_unusual_noise: false, has_vibration: false,
  has_reduced_mileage: false, has_braking_issues: false,
};

export default function VehicleInputScreen({ navigation }) {
  const [form, setForm] = useState(INITIAL);
  const { analyzeQuick, loading } = useVehicle();

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleAnalyze = async () => {
    if (!form.vehicle_model || !form.mileage_km) {
      Alert.alert("Required Fields", "Vehicle model and mileage are required.");
      return;
    }
    const payload = {
      ...form,
      manufacturing_year:   Number(form.manufacturing_year) || 2020,
      mileage_km:           Number(form.mileage_km) || 0,
      battery_age_months:   Number(form.battery_age_months) || 0,
      fuel_efficiency_kmpl: form.fuel_efficiency_kmpl ? Number(form.fuel_efficiency_kmpl) : null,
      last_oil_change_date: form.last_oil_change_date || null,
      last_service_date:    null,
    };
    try {
      await analyzeQuick(payload);
      navigation.navigate("Dashboard");
    } catch {
      Alert.alert("Error", "Analysis failed. Please check your server connection.");
    }
  };

  const InputField = ({ label, field, placeholder, keyboardType = "default" }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={form[field]}
        onChangeText={(v) => set(field, v)}
        placeholder={placeholder}
        placeholderTextColor="#4b5563"
        keyboardType={keyboardType}
        autoCapitalize="words"
      />
    </View>
  );

  const ToggleField = ({ label, field, desc }) => (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <Switch
        value={form[field]}
        onValueChange={(v) => set(field, v)}
        trackColor={{ false: "#374151", true: "#4f46e5" }}
        thumbColor={form[field] ? "#fff" : "#9ca3af"}
      />
    </View>
  );

  const SelectField = ({ label, field, options }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.selectRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.selectBtn, form[field] === opt.value && styles.selectBtnActive]}
            onPress={() => set(field, opt.value)}
          >
            <Text style={[styles.selectBtnText, form[field] === opt.value && styles.selectBtnTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>🚗 Vehicle Details</Text>
        <Text style={styles.subtitle}>Accurate information leads to a more precise analysis</Text>

        <Text style={styles.sectionHead}>Basic Information</Text>
        <InputField label="Owner Name" field="owner_name" placeholder="Your full name" />
        <InputField label="Vehicle Model *" field="vehicle_model" placeholder="e.g. Swift Dzire, i20" />
        <InputField label="Manufacturer" field="manufacturer" placeholder="e.g. Maruti, Hyundai" />
        <InputField label="Manufacturing Year *" field="manufacturing_year" placeholder="e.g. 2019" keyboardType="numeric" />

        <SelectField
          label="Fuel Type"
          field="fuel_type"
          options={[
            { value: "petrol",   label: "Petrol" },
            { value: "diesel",   label: "Diesel" },
            { value: "cng",      label: "CNG" },
            { value: "electric", label: "Electric" },
          ]}
        />

        <Text style={styles.sectionHead}>Service Details</Text>
        <InputField label="Total Mileage (km) *" field="mileage_km" placeholder="e.g. 45000" keyboardType="numeric" />
        <InputField label="Last Oil Change Date (YYYY-MM-DD)" field="last_oil_change_date" placeholder="e.g. 2024-01-15" />
        <InputField label="Battery Age (months)" field="battery_age_months" placeholder="e.g. 24" keyboardType="numeric" />
        <InputField label="Fuel Efficiency (km/l)" field="fuel_efficiency_kmpl" placeholder="e.g. 18.5" keyboardType="decimal-pad" />

        <SelectField
          label="Brake Condition"
          field="brake_condition"
          options={[
            { value: "good", label: "Good" },
            { value: "fair", label: "Fair" },
            { value: "poor", label: "Poor" },
          ]}
        />

        <Text style={styles.sectionHead}>Reported Symptoms</Text>
        <ToggleField label="Unusual Noise"   field="has_unusual_noise"    desc="Strange or abnormal sounds from the engine or body" />
        <ToggleField label="Vibration"        field="has_vibration"         desc="Unusual vibrations in the steering wheel or cabin" />
        <ToggleField label="Reduced Mileage" field="has_reduced_mileage"  desc="Fuel consumption has increased noticeably" />
        <ToggleField label="Braking Issues"  field="has_braking_issues"   desc="Brakes feel delayed, different, or unresponsive" />

        <TouchableOpacity
          style={[styles.analyzeBtn, loading && { opacity: 0.6 }]}
          onPress={handleAnalyze}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.analyzeBtnText}>
            {loading ? "🔄 Analyzing..." : "✅ Run Analysis"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: "#0f172a" },
  content:            { padding: 20, paddingBottom: 40 },
  title:              { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 4 },
  subtitle:           { fontSize: 13, color: "#6b7280", marginBottom: 20 },
  sectionHead:        { fontSize: 13, fontWeight: "700", color: "#6366f1", letterSpacing: 1, textTransform: "uppercase", marginTop: 20, marginBottom: 12 },
  fieldGroup:         { marginBottom: 14 },
  label:              { fontSize: 12, color: "#9ca3af", marginBottom: 6 },
  input:              { backgroundColor: "#1e293b", borderRadius: 10, padding: 12, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "#334155" },
  selectRow:          { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  selectBtn:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#334155" },
  selectBtnActive:    { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  selectBtnText:      { color: "#9ca3af", fontSize: 13 },
  selectBtnTextActive:{ color: "#fff", fontWeight: "700" },
  toggleRow:          { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  toggleLabel:        { fontSize: 15, color: "#fff", fontWeight: "600" },
  toggleDesc:         { fontSize: 12, color: "#6b7280", marginTop: 2 },
  analyzeBtn:         { backgroundColor: "#4f46e5", borderRadius: 14, padding: 18, alignItems: "center", marginTop: 24 },
  analyzeBtnText:     { color: "#fff", fontSize: 16, fontWeight: "800" },
});

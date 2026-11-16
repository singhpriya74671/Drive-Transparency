import unittest

from fastapi.testclient import TestClient

from app.main import app


class MaintenancePredictionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def analyze(self, **payload):
        return self.client.post("/api/maintenance/analyze-quick", json=payload)

    def test_healthy_readings_are_rule_based_and_do_not_claim_an_ml_model(self):
        response = self.analyze(
            vehicle_model="Test vehicle",
            battery_voltage=12.6,
            engine_temp_c=90,
            has_dtc=False,
            brake_condition="good",
        )

        self.assertEqual(response.status_code, 200)
        report = response.json()
        self.assertEqual(report["model_status"], "not_trained")
        self.assertEqual(report["assessment_method"], "threshold_rules")
        self.assertFalse(report["service_required"])
        self.assertEqual(report["overall_status"], "good")
        self.assertTrue(all(c["assessment_source"] == "threshold_rule" for c in report["components"]))
        self.assertTrue(all(c["maintenance_probability"] is None for c in report["components"]))

    def test_low_battery_voltage_is_reported_as_critical(self):
        response = self.analyze(battery_voltage=11.6)

        self.assertEqual(response.status_code, 200)
        battery = next(c for c in response.json()["components"] if c["component"] == "battery")
        self.assertEqual(battery["urgency"], "critical")
        self.assertEqual(battery["risk_score"], 90)
        self.assertTrue(response.json()["service_required"])

    def test_high_engine_temperature_is_reported_as_critical(self):
        response = self.analyze(engine_temp_c=120)

        self.assertEqual(response.status_code, 200)
        engine = next(c for c in response.json()["components"] if c["component"] == "engine")
        self.assertEqual(engine["urgency"], "critical")
        self.assertIn("120", engine["explanation"])

    def test_fault_code_is_not_misrepresented_as_a_specific_failed_part(self):
        response = self.analyze(has_dtc=False, dtc_codes="P0300")

        self.assertEqual(response.status_code, 200)
        engine = next(c for c in response.json()["components"] if c["component"] == "engine")
        self.assertEqual(engine["urgency"], "warning")
        self.assertIn("P0300", engine["explanation"])
        self.assertIn("severity and failed part are not inferred", engine["explanation"])

    def test_multiple_symptoms_produce_explicit_inspection_recommendations(self):
        response = self.analyze(
            has_unusual_noise=True,
            has_vibration=True,
            has_reduced_mileage=True,
            has_braking_issues=True,
        )

        self.assertEqual(response.status_code, 200)
        report = response.json()
        self.assertEqual(report["overall_status"], "critical")
        self.assertEqual(report["components"][0]["component"], "brakes")
        symptoms = next(c for c in report["components"] if c["component"] == "reported_symptoms")
        self.assertIn("Symptoms alone do not identify", symptoms["explanation"])
        self.assertGreaterEqual(len(report["recommendations"]), 2)

    def test_missing_data_does_not_create_a_healthy_vehicle_report(self):
        response = self.analyze(vehicle_model="Test vehicle")

        self.assertEqual(response.status_code, 200)
        report = response.json()
        self.assertIsNone(report["overall_health_score"])
        self.assertIsNone(report["service_required"])
        self.assertEqual(report["overall_status"], "unknown")
        self.assertEqual(report["components"], [])

    def test_invalid_sensor_value_is_rejected(self):
        response = self.analyze(battery_voltage=99)

        self.assertEqual(response.status_code, 422)

    def test_unknown_request_fields_are_rejected(self):
        response = self.analyze(unexpected_prediction_override=True)

        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()

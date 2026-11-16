# Maintenance training data

There is currently no validated maintenance-label dataset in this repository. Do not train or describe a model as production-ready until real service outcomes have been collected and reviewed.

The training command expects `maintenance_training.csv` with these numeric feature columns:

`vehicle_age_years,mileage_km,battery_age_months,battery_voltage,engine_temp_c,fuel_efficiency_kmpl,brake_score,has_dtc,avg_speed_kmh,engine_runtime_hours,service_required`

`service_required` is a binary target (`1` only when a documented inspection or completed service record confirms maintenance was required; otherwise `0`). It is a proposed data-collection contract, not an existing project target. Every row should represent a vehicle assessment at a known date, and its target should be traceable to an actual outcome. Do not derive labels from the app's former synthetic scores or from the same thresholds used by the rule checks.

The saved artifact contains the complete imputation, scaling, and XGBoost classification pipeline. Inference loads that artifact; it never fits a new transformer. The API reports `model_status: "not_trained"` when the artifact is absent and can only provide the explicitly identified sensor/symptom screening rules.

Copy the header-only `maintenance_training.csv.example` to `maintenance_training.csv` only after adding validated, real records. The example contains no labeled examples and is not trainable.

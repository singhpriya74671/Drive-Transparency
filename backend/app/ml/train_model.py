import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, balanced_accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from app.ml.predictor import FEATURE_NAMES, MODEL_TARGET, MODEL_VERSION


BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATASET = BACKEND_DIR / "data" / "maintenance_training.csv"
DEFAULT_MODEL = Path(__file__).resolve().parent / "artifacts" / "maintenance_pipeline.joblib"


def _pipeline(class_ratio: float) -> Pipeline:
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median", add_indicator=True)),
        ("scaler", StandardScaler()),
        ("classifier", XGBClassifier(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="binary:logistic",
            eval_metric="logloss",
            scale_pos_weight=class_ratio,
            random_state=42,
        )),
    ])


def train(dataset_path: Path, model_path: Path) -> dict:
    if not dataset_path.is_file():
        raise FileNotFoundError(
            f"Labeled dataset not found: {dataset_path}. "
            "Collect verified maintenance outcomes before training; synthetic labels are not accepted."
        )

    frame = pd.read_csv(dataset_path)
    required = set(FEATURE_NAMES) | {MODEL_TARGET}
    missing = sorted(required.difference(frame.columns))
    if missing:
        raise ValueError(f"Dataset is missing required columns: {', '.join(missing)}")
    if len(frame) < 20:
        raise ValueError("At least 20 real labeled records are required before training.")

    features = frame.loc[:, list(FEATURE_NAMES)].apply(pd.to_numeric, errors="raise")
    if features.isna().all(axis=0).any():
        columns = features.columns[features.isna().all(axis=0)].tolist()
        raise ValueError(f"Features have no observed values: {', '.join(columns)}")

    target_values = pd.to_numeric(frame[MODEL_TARGET], errors="raise")
    if target_values.isna().any() or not set(target_values.unique()).issubset({0, 1}):
        raise ValueError(f"{MODEL_TARGET} must contain only labeled 0/1 values.")
    target = target_values.astype(int)
    class_counts = target.value_counts()
    if len(class_counts) != 2 or class_counts.min() < 3:
        raise ValueError("Both service_required classes need at least 3 labeled records.")

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        target,
        test_size=0.25,
        random_state=42,
        stratify=target,
    )
    class_ratio = float((y_train == 0).sum() / (y_train == 1).sum())
    evaluation_pipeline = _pipeline(class_ratio)
    evaluation_pipeline.fit(x_train, y_train)
    predicted = evaluation_pipeline.predict(x_test)
    metrics = {
        "accuracy": float(accuracy_score(y_test, predicted)),
        "balanced_accuracy": float(balanced_accuracy_score(y_test, predicted)),
        "classification_report": classification_report(
            y_test, predicted, output_dict=True, zero_division=0
        ),
    }

    final_pipeline = _pipeline(float((target == 0).sum() / (target == 1).sum()))
    final_pipeline.fit(features, target)
    artifact = {
        "model_version": MODEL_VERSION,
        "feature_names": list(FEATURE_NAMES),
        "target": MODEL_TARGET,
        "pipeline": final_pipeline,
        "training_rows": int(len(frame)),
        "validation_metrics": metrics,
    }
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, model_path)
    return {
        "model_path": str(model_path),
        "training_rows": len(frame),
        "validation_metrics": metrics,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Train from verified maintenance outcome labels.")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--output", type=Path, default=DEFAULT_MODEL)
    args = parser.parse_args()
    result = train(args.dataset, args.output)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

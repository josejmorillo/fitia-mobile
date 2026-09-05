import type { BodyMeasurement, ProgressCheckpoint } from '../utils/types';
import { getDatabase } from './database';

type MeasurementInput = Omit<BodyMeasurement, 'id'>;
type CheckpointInput = Omit<ProgressCheckpoint, 'id'>;

export async function getMeasurements(): Promise<BodyMeasurement[]> {
  const db = await getDatabase();
  return db.getAllAsync<BodyMeasurement>(
    `SELECT
       id, date, weight, waist, hips, thighs, biceps, chest
     FROM body_measurements
     ORDER BY date ASC`
  );
}

export async function addMeasurement(input: MeasurementInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO body_measurements (date, weight, waist, hips, thighs, biceps, chest)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [input.date, input.weight, input.waist, input.hips, input.thighs, input.biceps, input.chest]
  );
}

export async function updateMeasurement(id: number, input: MeasurementInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE body_measurements SET
       date = ?, weight = ?, waist = ?, hips = ?, thighs = ?, biceps = ?, chest = ?
     WHERE id = ?`,
    [input.date, input.weight, input.waist, input.hips, input.thighs, input.biceps, input.chest, id]
  );
}

export async function deleteMeasurement(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM body_measurements WHERE id = ?', [id]);
}

export async function getCheckpoints(): Promise<ProgressCheckpoint[]> {
  const db = await getDatabase();
  return db.getAllAsync<ProgressCheckpoint>(
    `SELECT
       id, date,
       weight_kg AS "weightKg",
       chest_cm AS "chestCm",
       waist_cm AS "waistCm",
       hips_cm AS "hipsCm",
       biceps_cm AS "bicepsCm",
       quadriceps_cm AS "quadricepsCm",
       notes
     FROM progress_checkpoints
     ORDER BY date ASC`
  );
}

export async function addCheckpoint(input: CheckpointInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO progress_checkpoints (date, weight_kg, chest_cm, waist_cm, hips_cm, biceps_cm, quadriceps_cm, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.date,
      input.weightKg,
      input.chestCm,
      input.waistCm,
      input.hipsCm,
      input.bicepsCm,
      input.quadricepsCm,
      input.notes,
    ]
  );
}

export async function deleteCheckpoint(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM progress_checkpoints WHERE id = ?', [id]);
}

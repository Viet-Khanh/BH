// Browser replacement for mongoose: models persist to localStorage (see ../db).
import { createModel } from '../db/DemoModel.js';
import { Schema } from '../db/schema.js';

const models = {};

export const model = (name, schema) => {
  if (!models[name]) models[name] = createModel(name, schema);
  return models[name];
};

const mongoose = { Schema, model, models };

export { Schema };
export default mongoose;

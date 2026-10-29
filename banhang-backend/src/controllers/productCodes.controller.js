import { getNextProductCode } from '../services/productCodes.service.js';

export const getNextCode = async (req, res) => {
  res.json(await getNextProductCode(req.query));
};

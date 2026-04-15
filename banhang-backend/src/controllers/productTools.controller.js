import * as ProductToolsService from '../services/productTools.service.js';

export const updatePriceByName = async (req, res) => {
  try {
    const data = await ProductToolsService.updatePriceByName(req.body);
    res.json(data);
  } catch (err) {
    if (err.message === 'Không có dữ liệu cập nhật.') {
      return res.status(400).json({ message: err.message });
    }
    throw err;
  }
};

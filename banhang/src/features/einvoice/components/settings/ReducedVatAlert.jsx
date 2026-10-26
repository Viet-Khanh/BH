import { Alert } from 'antd';
import { shouldWarnReducedVat } from '../../domain/reducedVat.js';

// Reminds the shop that the 8% reduced VAT ended on 31/12/2026.
const ReducedVatAlert = ({ settings }) =>
  shouldWarnReducedVat(settings) ? (
    <Alert
      type="warning"
      showIcon
      message="Giảm thuế GTGT 8% đã hết hạn (31/12/2026)"
      description="Thuế suất mặc định vẫn là 8%. Vào Hệ thống → Hoá đơn điện tử để đổi thuế suất mặc định, và kiểm tra thuế suất từng mặt hàng."
    />
  ) : null;

export default ReducedVatAlert;

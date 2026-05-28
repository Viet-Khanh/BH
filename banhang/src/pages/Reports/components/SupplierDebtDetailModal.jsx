import { Button, Modal, Space, Tabs } from 'antd';
import dayjs from 'dayjs';
import { formatMoney } from '../../../utils/moneyFormat.js';

const SupplierDebtDetailModal = ({
  debtDetail,
  debtDetailTab,
  setDebtDetailTab,
  onClose,
  onOpenEditDebtPayment,
  onReprintDebtPayment,
  onDeleteDebtPayment,
  deletingDebtPaymentId,
  formatPaymentMethod,
}) => (
  <Modal
    title="Chi tiết công nợ nhà cung cấp"
    open={!!debtDetail}
    onCancel={onClose}
    footer={null}
  >
    {debtDetail ? (
      <div>
        <div className="section-title">{debtDetail.supplier?.name}</div>
        <div style={{ marginBottom: 12 }}>
          <div>
            Tổng nhập:{' '}
            <strong>
              {formatMoney(debtDetail.summary?.purchaseTotal || 0)}
            </strong>
          </div>
          <div>
            Trả theo phiếu nhập:{' '}
            <strong>
              {formatMoney(debtDetail.summary?.purchasePaid || 0)}
            </strong>
          </div>
          <div>
            Trả nợ độc lập:{' '}
            <strong>{formatMoney(debtDetail.summary?.debtPaid || 0)}</strong>
          </div>
          <div>
            Còn nợ:{' '}
            <strong>{formatMoney(debtDetail.summary?.debt || 0)}</strong>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Ngày</th>
                <th>Tổng</th>
                <th>Còn nợ</th>
              </tr>
            </thead>
            <tbody>
              {debtDetail.purchases?.map((purchase) => (
                <tr key={purchase.id}>
                  <td>{purchase.code}</td>
                  <td>{dayjs(purchase.date).format('DD/MM/YYYY')}</td>
                  <td>{formatMoney(purchase.total)}</td>
                  <td>{formatMoney(purchase.remain)}</td>
                </tr>
              ))}
              {!debtDetail.purchases?.length ? (
                <tr>
                  <td colSpan={4}>Chưa có dữ liệu.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <Tabs
          activeKey={debtDetailTab}
          onChange={setDebtDetailTab}
          items={[
            {
              key: 'active',
              label: `Phiếu trả nợ (${debtDetail.debtPayments?.length || 0})`,
              children: (
                <div className="table-wrapper">
                  <table className="invoice-items-table">
                    <thead>
                      <tr>
                        <th>Mã phiếu</th>
                        <th>Ngày</th>
                        <th>Số tiền</th>
                        <th>Phương thức</th>
                        <th>Ghi chú</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {debtDetail.debtPayments?.map((payment) => (
                        <tr key={payment.id}>
                          <td>{payment.code || payment.id}</td>
                          <td>{dayjs(payment.date).format('DD/MM/YYYY')}</td>
                          <td>{formatMoney(payment.amount)}</td>
                          <td>{formatPaymentMethod(payment.method)}</td>
                          <td>{payment.note}</td>
                          <td>
                            <Space size="small">
                              <Button
                                size="small"
                                onClick={() => onOpenEditDebtPayment(payment)}
                              >
                                Sửa
                              </Button>
                              <Button
                                size="small"
                                onClick={() => onReprintDebtPayment(payment)}
                              >
                                In lại
                              </Button>
                              <Button
                                danger
                                size="small"
                                loading={deletingDebtPaymentId === payment.id}
                                onClick={() => onDeleteDebtPayment(payment)}
                              >
                                Hủy phiếu
                              </Button>
                            </Space>
                          </td>
                        </tr>
                      ))}
                      {!debtDetail.debtPayments?.length ? (
                        <tr>
                          <td colSpan={6}>Chưa có phiếu trả nợ.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              ),
            },
            {
              key: 'deleted',
              label: `Đã hủy (${debtDetail.deletedDebtPayments?.length || 0})`,
              children: (
                <div className="table-wrapper">
                  <table className="invoice-items-table">
                    <thead>
                      <tr>
                        <th>Mã phiếu</th>
                        <th>Ngày trả</th>
                        <th>Số tiền</th>
                        <th>Phương thức</th>
                        <th>Ghi chú</th>
                        <th>Ngày hủy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debtDetail.deletedDebtPayments?.map((payment) => (
                        <tr key={payment.id}>
                          <td>{payment.code || payment.id}</td>
                          <td>
                            {payment.date
                              ? dayjs(payment.date).format('DD/MM/YYYY')
                              : ''}
                          </td>
                          <td>{formatMoney(payment.amount)}</td>
                          <td>{formatPaymentMethod(payment.method)}</td>
                          <td>{payment.note}</td>
                          <td>
                            {payment.deletedAt
                              ? dayjs(payment.deletedAt).format(
                                  'DD/MM/YYYY HH:mm'
                                )
                              : ''}
                          </td>
                        </tr>
                      ))}
                      {!debtDetail.deletedDebtPayments?.length ? (
                        <tr>
                          <td colSpan={6}>Chưa có phiếu trả nợ đã hủy.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              ),
            },
          ]}
        />
      </div>
    ) : null}
  </Modal>
);

export default SupplierDebtDetailModal;

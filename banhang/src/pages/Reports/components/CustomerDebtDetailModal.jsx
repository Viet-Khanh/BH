import { Button, Modal, Space, Tabs } from 'antd';
import dayjs from 'dayjs';
import { formatMoney } from '../../../utils/moneyFormat.js';

const CustomerDebtDetailModal = ({
  debtDetail,
  debtDetailTab,
  setDebtDetailTab,
  onClose,
  onOpenEditDebtReceipt,
  onReprintDebtReceipt,
  onDeleteDebtReceipt,
  deletingDebtReceiptId,
  formatPaymentMethod,
}) => (
  <Modal
    title="Chi tiết công nợ"
    open={!!debtDetail}
    onCancel={onClose}
    footer={null}
  >
    {debtDetail ? (
      <div>
        <div className="section-title">{debtDetail.customer?.name}</div>
        <div style={{ marginBottom: 12 }}>
          <div>
            Tổng bán:{' '}
            <strong>
              {formatMoney(debtDetail.summary?.invoiceTotal || 0)}
            </strong>
          </div>
          <div>
            Thu theo hóa đơn:{' '}
            <strong>{formatMoney(debtDetail.summary?.invoicePaid || 0)}</strong>
          </div>
          <div>
            Thu nợ độc lập:{' '}
            <strong>
              {formatMoney(debtDetail.summary?.debtReceiptPaid || 0)}
            </strong>
          </div>
          <div>
            Còn nợ:{' '}
            <strong>{formatMoney(debtDetail.summary?.debt || 0)}</strong>
          </div>
        </div>

        <Tabs
          activeKey={debtDetailTab}
          onChange={setDebtDetailTab}
          items={[
            {
              key: 'active',
              label: `Phiếu thu nợ (${debtDetail.debtReceipts?.length || 0})`,
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
                      {debtDetail.debtReceipts?.map((payment) => (
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
                                onClick={() => onOpenEditDebtReceipt(payment)}
                              >
                                Sửa
                              </Button>
                              <Button
                                size="small"
                                onClick={() => onReprintDebtReceipt(payment)}
                              >
                                In lại
                              </Button>
                              <Button
                                danger
                                size="small"
                                loading={deletingDebtReceiptId === payment.id}
                                onClick={() => onDeleteDebtReceipt(payment)}
                              >
                                Hủy phiếu
                              </Button>
                            </Space>
                          </td>
                        </tr>
                      ))}
                      {!debtDetail.debtReceipts?.length ? (
                        <tr>
                          <td colSpan={6}>Chưa có phiếu thu nợ.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              ),
            },
            {
              key: 'deleted',
              label: `Đã hủy (${debtDetail.deletedDebtReceipts?.length || 0})`,
              children: (
                <div className="table-wrapper">
                  <table className="invoice-items-table">
                    <thead>
                      <tr>
                        <th>Mã phiếu</th>
                        <th>Ngày thu</th>
                        <th>Số tiền</th>
                        <th>Phương thức</th>
                        <th>Ghi chú</th>
                        <th>Ngày hủy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debtDetail.deletedDebtReceipts?.map((payment) => (
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
                      {!debtDetail.deletedDebtReceipts?.length ? (
                        <tr>
                          <td colSpan={6}>Chưa có phiếu thu nợ đã hủy.</td>
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

export default CustomerDebtDetailModal;

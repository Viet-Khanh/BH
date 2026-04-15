import { Fragment } from 'react';
import dayjs from 'dayjs';
import { formatMoney } from '../../../utils/moneyFormat.js';

const ReportSalesDetailsTable = ({ rows, showSensitiveInfo = false }) => (
  <div className="pos-table">
    <table>
      <thead>
        <tr>
          <th
            colSpan={showSensitiveInfo ? 15 : 14}
            style={{ textAlign: 'center' }}
          >
            Thông tin hóa đơn
          </th>
          <th colSpan={7} style={{ textAlign: 'center' }}>
            Chi tiết hàng hóa
          </th>
        </tr>
        <tr>
          <th>Số HĐ</th>
          <th>Ngày</th>
          <th>Nhân viên</th>
          <th>Khách hàng</th>
          <th>Điện thoại</th>
          <th>Địa chỉ</th>
          <th>MH</th>
          <th>Tổng SL</th>
          <th>Tiền hàng</th>
          <th>Đã thu</th>
          <th>Nợ cũ</th>
          <th>Tổng cộng</th>
          <th>Còn nợ</th>
          {showSensitiveInfo ? <th>Lợi nhuận</th> : null}
          <th>Ghi chú</th>
          <th>Tên hàng</th>
          <th>ĐVT</th>
          <th>SL</th>
          <th>Đơn giá</th>
          <th>Thành tiền</th>
          <th>Ghi chú hàng</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const items = row.items?.length ? row.items : [null];
          const invoiceCellProps = {
            rowSpan: items.length,
            style: { verticalAlign: 'top', background: '#f9fbfb' },
          };

          return (
            <Fragment key={row.id}>
              {items.map((item, index) => {
                const isFirst = index === 0;
                return (
                  <tr key={item?.key ?? `${row.id}-empty-${index}`}>
                    {isFirst ? (
                      <>
                        <td {...invoiceCellProps}>{row.code}</td>
                        <td {...invoiceCellProps}>
                          {dayjs(row.date).format('DD/MM/YY HH:mm')}
                        </td>
                        <td {...invoiceCellProps}>{row.staff}</td>
                        <td {...invoiceCellProps}>{row.customerName}</td>
                        <td {...invoiceCellProps}>{row.phone}</td>
                        <td {...invoiceCellProps}>{row.address}</td>
                        <td {...invoiceCellProps}>{row.itemsCount}</td>
                        <td {...invoiceCellProps}>{row.qtySum}</td>
                        <td {...invoiceCellProps}>{formatMoney(row.amount)}</td>
                        <td
                          {...invoiceCellProps}
                          className={row.paid > 0 ? 'text-success' : ''}
                        >
                          {formatMoney(row.paid)}
                        </td>
                        <td {...invoiceCellProps} className="text-danger">
                          {formatMoney(row.oldDebt)}
                        </td>
                        <td {...invoiceCellProps}>
                          {formatMoney(row.totalPay)}
                        </td>
                        <td
                          {...invoiceCellProps}
                          className={
                            row.remain > 0 ? 'text-danger' : 'text-success'
                          }
                        >
                          {formatMoney(row.remain)}
                        </td>
                        {showSensitiveInfo ? (
                          <td
                            {...invoiceCellProps}
                            className={
                              row.profit >= 0 ? 'text-success' : 'text-danger'
                            }
                          >
                            {formatMoney(row.profit)}
                          </td>
                        ) : null}
                        <td {...invoiceCellProps}>{row.note}</td>
                      </>
                    ) : null}
                    {item ? (
                      <>
                        <td>{item.name}</td>
                        <td>{item.unit}</td>
                        <td>{item.qty}</td>
                        <td>{formatMoney(item.unitPrice)}</td>
                        <td>{formatMoney(item.lineTotal)}</td>
                        <td>{item.note}</td>
                      </>
                    ) : (
                      <td
                        colSpan={7}
                        style={{ textAlign: 'center', color: '#7a8f8d' }}
                      >
                        Chưa có hàng hóa.
                      </td>
                    )}
                  </tr>
                );
              })}
            </Fragment>
          );
        })}
        {!rows.length ? (
          <tr>
            <td
              colSpan={showSensitiveInfo ? 22 : 21}
              style={{ textAlign: 'center' }}
            >
              Chưa có hóa đơn.
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  </div>
);

export default ReportSalesDetailsTable;

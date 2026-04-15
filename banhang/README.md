# Bán hàng nhôm kính/sắt (React + Vite + MongoDB)

Ứng dụng quản lý bán hàng nhôm kính/sắt dành cho người low-tech. Frontend React + backend Node/Express/Mongoose, dữ liệu lưu MongoDB.

## Yêu cầu

- Node.js 18+
- MongoDB local

## Chạy backend

```bash
cd ../banhang-backend
cp .env.example .env
npm install
npm run dev
```

API mặc định chạy tại `http://localhost:5000`.

## Chạy frontend

```bash
cd ../banhang
npm install
npm run dev
```

Mặc định frontend gọi API tại `http://localhost:5000/api`. Nếu đổi port backend, tạo `.env` trong frontend:

```
VITE_API_URL=http://localhost:5000/api
```

## Tính năng chính

- Màn hình Home 6 nút lớn: Hệ thống / Danh mục / Bán hàng / Nhập hàng / Thu chi / Báo cáo.
- CRUD sản phẩm, khách hàng, nhà cung cấp.
- Bán hàng: lập hóa đơn, thanh toán nhiều lần, in hóa đơn, sửa mẫu hóa đơn.
- Nhập hàng: cập nhật tồn kho và giá vốn bình quân.
- Thu chi: sổ quỹ đơn giản, lọc theo ngày/tháng.
- Báo cáo: tồn kho, công nợ, doanh thu & lãi theo ngày.
- Xuất Excel cho các danh sách.

## In hóa đơn

1. Vào **Bán hàng** -> tạo/sửa hóa đơn.
2. Bấm **Xem trước** để xem template.
3. Bấm **In** để gọi `window.print()`.

## Xuất Excel

Tại các màn hình danh sách, bấm **Xuất Excel** để tải file `.xlsx`.

## Dữ liệu mẫu + Reset

Vào **Hệ thống**:

- **Nạp dữ liệu mẫu**: gọi API seed để tạo dữ liệu demo.
- **Reset dữ liệu**: xóa toàn bộ dữ liệu MongoDB và reset cài đặt.

## Ghi chú

- Frontend luôn gọi REST API, cần chạy backend trước khi sử dụng.
- Nếu cần cho phép âm kho, bật tùy chọn trong **Hệ thống**.

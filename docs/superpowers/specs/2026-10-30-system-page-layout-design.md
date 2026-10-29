# System Page Layout — Design

Date: 2026-10-30 · Status: approved · Branch: `feat/minimart-units-barcode`

## Problem

`pages/System/System.jsx` is one long page: a general form mixing shop info, stock switches,
print copies and the system password (one "Lưu" at the top), then the e-invoice section, the
printer section, the invoice template editor, data optimisation and sample data, each with its
own save. Related settings are scattered and the page is long.

## Decision (user chose "menu trái")

Left menu of groups, content on the right, one "Lưu" per group at the bottom of that group.
Narrow screens (< 768 px): the menu moves to the top.

| Group (key) | Content |
| --- | --- |
| Cửa hàng (`shop`) | Tên shop, Số điện thoại, Địa chỉ |
| Bán hàng & kho (`sales`) | Cho phép âm kho, Tự cập nhật giá vốn khi nhập hàng, Ngưỡng cảnh báo tồn thấp, Hiển thị thông tin nhạy cảm |
| In ấn (`printing`) | Số bản in; Máy in & khổ giấy hoá đơn; Tem (only with the `labels` flag); Mẫu hoá đơn (template editor) — sub-headings inside the group |
| Hoá đơn điện tử (`einvoice`) | The existing e-invoice section |
| Bảo mật (`security`) | Mật khẩu vào trang hệ thống |
| Dữ liệu (`data`) | Tối ưu dữ liệu; Dữ liệu mẫu (only with the `sampleData` flag) |

- The selected group is kept in the URL (`/system?tab=printing`) so a page can link to a group,
  and in session for back-navigation; unknown/hidden keys fall back to `shop`.
- Each group saves only its own fields (`settingsStore.update` merges). The general form is split
  into small group forms built from one reusable component (fields + "Lưu" + success message).
  The printer, e-invoice and template sections keep their own forms/save buttons, placed in their
  groups.
- Header keeps "Quay lại"; the old top "Lưu" goes away (each group has its own).
- The group list is plain data (`pages/System/systemGroups.js`) with flag filtering, tested.
- Access rule unchanged (password from the home page, `consumeSystemAccess`).
- Files ≤ 200 lines: `System.jsx` becomes a shell; groups live in `pages/System/groups/`.
- A short `pages/System/README.md` lists the groups and where each setting lives.

## Out of scope

New settings, search in settings, unsaved-changes prompts when switching groups.

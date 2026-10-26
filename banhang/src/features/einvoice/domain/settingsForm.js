import dayjs from 'dayjs';
import { EINVOICE_DEFAULT_SETTINGS } from './settingsDefaults.js';

// Settings edited by the e-invoice settings form (custom profiles have their
// own editor in the "Mẫu file" tab).
const FORM_FIELDS = Object.keys(EINVOICE_DEFAULT_SETTINGS).filter(
  (field) => field !== 'einvoiceCustomProfiles'
);

export const toFormValues = (settings = {}) => {
  const values = Object.fromEntries(
    FORM_FIELDS.map((field) => [
      field,
      settings[field] ?? EINVOICE_DEFAULT_SETTINGS[field],
    ])
  );
  return {
    ...values,
    einvoiceStartDate: values.einvoiceStartDate
      ? dayjs(values.einvoiceStartDate)
      : null,
  };
};

export const fromFormValues = (values) => ({
  ...values,
  sellerTaxCode: values.sellerTaxCode?.trim() || '',
  einvoiceLookupUrl: values.einvoiceLookupUrl?.trim() || '',
  einvoiceStartDate: values.einvoiceStartDate
    ? values.einvoiceStartDate.startOf('day').toISOString()
    : '',
});

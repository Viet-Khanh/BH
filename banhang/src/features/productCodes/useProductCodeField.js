import { useRef, useState } from 'react';
import { getNextProductCode } from '../../db/repository.js';
import { useEditionFeature } from '../../platform/useActiveModule.js';
import { buildCodeFromName, resolveProductCode } from './productCodes.js';

// "Mã hàng" of a product form: initials from the name, or (edition flag
// `sequentialCodes`) the next SP code fetched when a create form opens.
export const useProductCodeField = (form) => {
  const sequential = useEditionFeature('sequentialCodes');
  const [codeEdited, setCodeEdited] = useState(false);
  const requestRef = useRef(0);

  const fillNextCode = async (request) => {
    try {
      const code = await getNextProductCode();
      const current = String(form.getFieldValue('code') ?? '').trim();
      if (request === requestRef.current && code && !current) {
        form.setFieldsValue({ code });
      }
    } catch {
      // The field stays empty and required: the user types a code.
    }
  };

  const startCreate = () => {
    requestRef.current += 1;
    setCodeEdited(false);
    if (sequential) fillNextCode(requestRef.current);
  };

  const startEdit = () => {
    requestRef.current += 1;
    setCodeEdited(true);
  };

  const handleNameChange = (event) => {
    if (sequential || codeEdited) return;
    form.setFieldsValue({ code: buildCodeFromName(event.target.value || '') });
  };

  const handleCodeChange = (event) => {
    setCodeEdited((event.target.value || '').trim().length > 0);
  };

  // Code to save; auto initials are de-duplicated against `existingCodes`.
  const resolveCode = (values, existingCodes = []) =>
    resolveProductCode({
      code: values.code,
      name: values.name,
      codeEdited,
      sequential,
      existingCodes,
    });

  return {
    startCreate,
    startEdit,
    handleNameChange,
    handleCodeChange,
    resolveCode,
  };
};

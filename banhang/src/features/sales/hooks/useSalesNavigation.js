import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useSalesNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = location.state?.editInvoiceId;
  const copyId = location.state?.copyInvoiceId;
  const returnTo = location.state?.returnTo;
  const returnPath = location.state?.returnPath;

  const cancel = useCallback(() => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }
    if (returnPath) {
      navigate(`${returnPath}?tab=sales`);
      return;
    }
    navigate('/');
  }, [navigate, returnPath, returnTo]);

  return {
    navigate,
    location,
    editId,
    copyId,
    returnTo,
    returnPath,
    cancel,
  };
};

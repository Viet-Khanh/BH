import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const usePurchasesNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editPurchaseId = location.state?.editPurchaseId;
  const returnTo = location.state?.returnTo;

  const goBack = useCallback(() => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }
    navigate('/');
  }, [navigate, returnTo]);

  return {
    navigate,
    location,
    editPurchaseId,
    returnTo,
    goBack,
  };
};

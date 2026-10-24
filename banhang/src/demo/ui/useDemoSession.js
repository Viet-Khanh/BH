import { useCallback, useEffect, useReducer } from 'react';
import { activateEdition, bootDemoSession } from '../session/demoSession.js';

const initialState = {
  status: 'booting',
  edition: null,
  notices: [],
  error: '',
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'booted':
      return { ...state, ...action.result };
    case 'seeding':
      return { ...state, status: 'seeding' };
    case 'ready':
      return { ...state, status: 'ready', edition: action.edition };
    case 'failed':
      return { ...state, status: 'error', error: action.error };
    default:
      return state;
  }
};

export const useDemoSession = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let active = true;
    bootDemoSession()
      .then((result) => active && dispatch({ type: 'booted', result }))
      .catch(
        (error) => active && dispatch({ type: 'failed', error: error.message })
      );
    return () => {
      active = false;
    };
  }, []);

  const chooseEdition = useCallback(async (editionId) => {
    dispatch({ type: 'seeding' });
    try {
      dispatch({ type: 'ready', edition: await activateEdition(editionId) });
    } catch (error) {
      dispatch({ type: 'failed', error: error.message });
    }
  }, []);

  return { state, chooseEdition };
};

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setSessionId } from '@/redux/slices/cartSlice';
import { getOrCreateSessionId } from '@/utils/session';

export default function AppInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    console.log("🆔 Session ID from localStorage:", sessionId);
    dispatch(setSessionId(sessionId));
  }, []);

  return null;
}

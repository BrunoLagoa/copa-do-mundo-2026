import { useEffect, useState } from 'react';
import { fetchPlayerPhoto, playerAvatarUrl } from '../utils/playerStats';

export function usePlayerPhoto(name: string): string {
  const [url, setUrl] = useState<string>(() => playerAvatarUrl(name));

  useEffect(() => {
    let cancelled = false;
    fetchPlayerPhoto(name).then((photo) => {
      if (!cancelled && photo) setUrl(photo);
    });
    return () => {
      cancelled = true;
    };
  }, [name]);

  return url;
}

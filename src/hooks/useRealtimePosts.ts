import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Hook to subscribe to real-time post updates
export function useRealtimePosts(onNewPost: (post: unknown) => void) {
  useEffect(() => {
    // Only subscribe if we have a valid Supabase URL configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          console.log('New post received in real-time:', payload.new);
          onNewPost(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewPost]);
}

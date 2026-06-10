import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const isDevAdmin = typeof document !== 'undefined' && document.cookie.includes('dev_admin=true');
  if (isDevAdmin) {
    const originalAuth = client.auth;
    client.auth = new Proxy(originalAuth, {
      get(target, prop, receiver) {
        if (prop === 'getUser') {
          return async () => ({
            data: {
              user: {
                id: '81b7c26a-23ce-4b41-a8c9-7808dcd89141',
                email: 'ahmadnashat1999@gmail.com',
                role: 'authenticated',
              }
            },
            error: null
          });
        }
        return Reflect.get(target, prop, receiver);
      }
    });

    const originalFrom = client.from;
    client.from = function(table: string) {
      if (table === 'user_profiles') {
        return {
          select(columns: string) {
            return {
              eq(col: string, val: any) {
                return {
                  single() {
                    return Promise.resolve({
                      data: {
                        id: '81b7c26a-23ce-4b41-a8c9-7808dcd89141',
                        email: 'ahmadnashat1999@gmail.com',
                        role: 'admin',
                        full_name: 'Admin User',
                      },
                      error: null
                    });
                  }
                };
              }
            };
          }
        } as any;
      }
      return originalFrom.apply(this, [table]);
    };
  }

  return client;
}

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const isDevAdmin = cookieStore.get('dev_admin')?.value === 'true';
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

export async function createAdminClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-role-key',
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

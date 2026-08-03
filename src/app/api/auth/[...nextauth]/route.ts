import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        const customUser = session.user as { id?: string; name?: string | null; email?: string | null; image?: string | null };
        customUser.id = token.id as string;
      }
      return session;
    },
    async signIn({ user }) {
      if (!user.email) return false;

      // Sync user profile with Supabase on successful sign-in
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseServiceKey) {
          // Dynamic import to prevent client/server issues
          const { createClient } = await import("@supabase/supabase-js");
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          });

          const { error } = await supabaseAdmin.from("profiles").upsert(
            {
              id: user.id,
              name: user.name || "",
              email: user.email,
              avatar_url: user.image || "",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );

          if (error) {
            console.error("Error syncing profile with Supabase:", error);
          }
        }
      } catch (err) {
        console.error("Unexpected error in NextAuth signIn trigger:", err);
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin", // Option to redirect to custom signin page
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

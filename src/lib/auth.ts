import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { agency: true }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          agencyId: user.agencyId,
          agency: user.agency,
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      // For Google sign-ins, ensure user exists in database
      if (account?.provider === 'google' && user.email) {
        try {
          let existingUser = await db.user.findUnique({
            where: { email: user.email }
          });
          
          if (!existingUser) {
            // Create user immediately to avoid JWT callback issues
            existingUser = await db.user.create({
              data: {
                email: user.email,
                name: user.name || '',
                image: user.image,
                emailVerified: new Date(),
                // agencyId and role remain null until registration is completed
              }
            });
            console.log('Created new Google user:', existingUser.email);
          }
          
          // Allow sign-in for both new and existing users
          return true;
        } catch (error) {
          console.error('Error handling user in signIn callback:', error);
          return false;
        }
      }
      
      return true;
    },
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        const user = await db.user.findUnique({
          where: { id: token.sub as string },
          include: { agency: true }
        });
        
        if (user) {
          session.user.id = user.id;
          session.user.role = user.role;
          session.user.agencyId = user.agencyId;
          session.user.agency = user.agency;
          // Flag to indicate if user needs to complete registration
          session.user.needsRegistration = !user.agencyId || !user.role;
        }
      }
      return session;
    },
    jwt: async ({ user, token, account }) => {
      // Always fetch fresh user data to ensure token has latest info
      let dbUser = null;
      
      // Always search by email for consistency (since email is unique)
      if (token.email) {
        dbUser = await db.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, role: true, agencyId: true, emailVerified: true, email: true }
        });
        
        // Ensure token.sub is always set to the correct user ID
        if (dbUser) {
          token.sub = dbUser.id;
        }
      }
      
      if (dbUser) {
        token.role = dbUser.role;
        token.agencyId = dbUser.agencyId;
        token.emailVerified = !!dbUser.emailVerified;
        
        // Correct logic: isGoogleUser should only be true if user needs to complete registration
        if (account?.provider === 'google') {
          token.isGoogleUser = !dbUser.role || !dbUser.agencyId;
        } else {
          token.isGoogleUser = false;
        }
      } else {
        // This should not happen now that we create users in signIn callback
        console.warn('User not found in database during JWT callback:', token.email);
        token.isGoogleUser = false;
      }
      
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
}
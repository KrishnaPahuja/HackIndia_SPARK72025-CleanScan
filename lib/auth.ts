import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { AuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { Session, User as NextAuthUser } from 'next-auth';

// Extend the built-in session and user types
interface ExtendedUser extends NextAuthUser {
  id: string;
  role: 'restaurant' | 'ngo';
}

interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: 'restaurant' | 'ngo';
  };
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await dbConnect();

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          throw new Error('No user found with this email');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as ExtendedUser).role;
      }
      return token;
    },
    async session({ session, token }): Promise<ExtendedSession> {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as 'restaurant' | 'ngo',
        },
      };
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
}; 
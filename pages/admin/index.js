
// pages/admin/index.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import AdminOrdersPanel from '@/components/AdminOrdersPanel';

export async function getServerSideProps(context) {
    const session = await getServerSession(context.req, context.res, authOptions);
  
    if (!session) {
      return {
        redirect: { destination: '/admin/login', permanent: false }
      };
    }
  
    // Remove undefined values (e.g. image)
    const safeSession = {
      ...session,
      user: {
        ...session.user,
        image: session.user.image ?? null,
      }
    };
  
    return {
      props: { session: safeSession }
    };
  }
  

export default function AdminPage({ session }) {
  return <AdminOrdersPanel session={session} />;
}

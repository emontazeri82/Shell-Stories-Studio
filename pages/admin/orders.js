// pages/admin/orders.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import AdminOrdersPanel from '@/components/OrdersPanel/AdminOrdersPanel';

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: { destination: '/admin/login', permanent: false },
    };
  }

  return {
    props: { session },
  };
}

export default function AdminOrdersPage({ session }) {
  return <AdminOrdersPanel session={session} />;
}

import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminLayout = () => {
  const { logout, user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <aside className="w-64 border-r border-gray-800 bg-gray-900 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-indigo-400">Admin Panel</h2>
          <p className="text-xs text-gray-400 mt-1">Role: {user?.role}</p>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link to="/admin/dashboard" className="p-2 rounded text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Dashboard</Link>
          <Link to="/admin/participants" className="p-2 rounded text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Participants</Link>
          <Link to="/admin/questions" className="p-2 rounded text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Questions</Link>
          <Link to="/admin/settings" className="p-2 rounded text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Settings</Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={logout} className="w-full btn-danger py-2 rounded">Logout</button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
export default AdminLayout;

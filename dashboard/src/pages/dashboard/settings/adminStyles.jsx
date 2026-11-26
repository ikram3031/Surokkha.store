import AppearanceTab from './AppearanceTab';

// Admin view styles: the signed-in user's dashboard colour and corner style
const AdminStylesPage = () => (
  <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
    <div>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Admin View Styles</h2>
      <p className="text-sm text-muted-foreground mt-1">Choose how the dashboard looks for you.</p>
    </div>
    <AppearanceTab />
  </div>
);

export default AdminStylesPage;

import AppearanceTab from './AppearanceTab';
import { PageHeader } from '@/components/ui/page-header';

// Admin view styles: the signed-in user's dashboard colour and corner style
const AdminStylesPage = () => (
  <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
    <PageHeader
      title="Admin View Styles"
      description="Choose how the dashboard looks for you."
    />
    <AppearanceTab />
  </div>
);

export default AdminStylesPage;

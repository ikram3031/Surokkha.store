import { RouterProvider } from 'react-router-dom';
import { ReactQueryProvider } from '@/components/providers';
import { ClientThemeProvider } from '@/components/clientThemeProvider';
import { router } from './router';

const App = () => {
  return (
    <ReactQueryProvider>
      <ClientThemeProvider>
        <RouterProvider router={router} />
      </ClientThemeProvider>
    </ReactQueryProvider>
  );
};

export default App;

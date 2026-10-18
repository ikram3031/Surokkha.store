import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AdminStyles = () => {
  const [stylesList, setStylesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStyles();
  }, []);

  const fetchStyles = async () => {
    try {
      const res = await axios.get('/api/v1/styles');
      if (res.data?.data) {
        setStylesList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, updatedStyles) => {
    try {
      await axios.patch(`/api/v1/styles/${id}`, { styles: updatedStyles });
      alert('Style updated successfully!');
      fetchStyles();
      // Need a page reload to apply new styles potentially
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to update style');
    }
  };

  if (loading) return <div>Loading styles...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Styles Management</h1>
      <p>Configure styles and themes for Admin and Dashboard views.</p>

      <div className="space-y-8">
        {stylesList.map((styleDoc) => {
          const s = styleDoc.styles || {};
          const sidebarBg = s.sidebar?.backgroundColor || '';
          const sidebarColor = s.sidebar?.color || '';
          const mainBg = s.main?.backgroundColor || '';
          const mainColor = s.main?.color || '';

          return (
            <div key={styleDoc.id} className="p-4 border rounded-md bg-white shadow-sm dark:bg-zinc-950">
              <h2 className="text-xl font-semibold mb-4">{styleDoc.type} Settings</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sidebar Background Color</Label>
                  <Input 
                    type="text" 
                    defaultValue={sidebarBg} 
                    id={`sidebarBg_${styleDoc.id}`}
                    placeholder="e.g. #1f2937" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sidebar Text Color</Label>
                  <Input 
                    type="text" 
                    defaultValue={sidebarColor} 
                    id={`sidebarColor_${styleDoc.id}`}
                    placeholder="e.g. #ffffff" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Main Background Color</Label>
                  <Input 
                    type="text" 
                    defaultValue={mainBg} 
                    id={`mainBg_${styleDoc.id}`}
                    placeholder="e.g. #f3f4f6" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Main Text Color</Label>
                  <Input 
                    type="text" 
                    defaultValue={mainColor} 
                    id={`mainColor_${styleDoc.id}`}
                    placeholder="e.g. #000000" 
                  />
                </div>
              </div>

              <div className="mt-4">
                <Button 
                  onClick={() => {
                    const sbBg = document.getElementById(`sidebarBg_${styleDoc.id}`).value;
                    const sbCo = document.getElementById(`sidebarColor_${styleDoc.id}`).value;
                    const mnBg = document.getElementById(`mainBg_${styleDoc.id}`).value;
                    const mnCo = document.getElementById(`mainColor_${styleDoc.id}`).value;
                    
                    const updated = {
                      ...styleDoc.styles,
                      sidebar: { backgroundColor: sbBg, color: sbCo },
                      main: { backgroundColor: mnBg, color: mnCo },
                    };
                    handleUpdate(styleDoc.id, updated);
                  }}
                >
                  Update {styleDoc.type} Styles
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminStyles;

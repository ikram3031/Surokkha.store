const fs = require('fs');
let c = fs.readFileSync('dashboard/src/components/dashboard/admin-sidebar.jsx', 'utf8');
c = c.split('\"/dashboard').join('\"/admin');
c = c.split('\'/dashboard').join('\'/admin');
c = c.split('\/dashboard').join('\/admin');
fs.writeFileSync('dashboard/src/components/dashboard/admin-sidebar.jsx', c);

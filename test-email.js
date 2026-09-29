import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import { getSmtpTransport } from './backend/src/common/services/smtpConfig.service.js';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27019/surokkha-db').then(async () => {
  try {
    const { transport, config } = await getSmtpTransport();
    console.log('Config:', config);
    const info = await transport.sendMail({
      from: config.user,
      to: 'test@example.com',
      subject: 'Test SMTP',
      text: 'This is a test.'
    });
    console.log('Sent:', info);
  } catch (e) {
    console.error('Error:', e);
  }
  process.exit(0);
});

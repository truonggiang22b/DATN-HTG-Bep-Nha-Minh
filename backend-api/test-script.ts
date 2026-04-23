import request from 'supertest';
import { app } from './src/app';
import crypto from 'crypto';

async function run() {
  try {
    const qrToken = 'qr-bnm-table-01';
    
    // 1. Resolve QR
    const qrRes = await request(app).get(`/api/public/qr/${qrToken}`);
    const tableId = qrRes.body.data.table.id;
    const branchId = qrRes.body.data.branch.id;
    console.log('Resolved QR:', qrRes.body);

    // 2. Fetch Menu
    const menuRes = await request(app).get(`/api/public/branches/${branchId}/menu`);
    const menuItemId = menuRes.body.data.categories[0].items[0].id;
    console.log('Fetched Menu, get menuItemId', menuItemId);

    // 3. Create Order
    const idempotencyKey = crypto.randomUUID();
    const orderPayload = {
      qrToken,
      clientSessionId: crypto.randomUUID(),
      idempotencyKey,
      items: [
        {
          menuItemId,
          quantity: 2,
          options: {},
          note: 'Không hành'
        }
      ]
    };
    
    const orderRes = await request(app).post(`/api/public/orders`).send(orderPayload);
    require('fs').writeFileSync('error.json', JSON.stringify(orderRes.body, null, 2));
    console.log('Order create status:', orderRes.status);

  } catch(e: any) {
    console.error('Error:', e.message);
  }
}

run();

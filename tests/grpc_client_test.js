import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(__dirname, '../src/grpc/subscription.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const subscriptionProto = grpc.loadPackageDefinition(packageDefinition).subscription;

// Створюємо клієнта
const client = new subscriptionProto.SubscriptionService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

const testEmail = 'grpc-test@example.com';

console.log('--- Тестування gRPC-інтерфейсу ---');

// 1. Тест Subscribe
client.Subscribe({ email: testEmail, repo: 'facebook/react' }, (error, response) => {
  if (error) {
    console.error('❌ Помилка Subscribe:', error.message);
  } else {
    console.log('✅ Відповідь Subscribe:', response.message);

    // 2. Тест GetSubscriptions (викликаємо тільки після успішної підписки)
    client.GetSubscriptions({ email: testEmail }, (error, response) => {
      if (error) {
        console.error('❌ Помилка GetSubscriptions:', error.message);
      } else {
        console.log(
          '✅ Підписки для',
          testEmail,
          ':',
          JSON.stringify(response.subscriptions, null, 2)
        );
      }
    });
  }
});
